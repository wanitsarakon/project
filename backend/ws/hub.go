package ws

import (
	"database/sql"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

/* =========================
   MESSAGE
========================= */
type Message struct {
	Room string
	Data []byte
}

/* =========================
   CLIENT
========================= */
type Client struct {
	Hub       *Hub
	Conn      *websocket.Conn
	Room      string
	PlayerID  int
	Send      chan []byte
	disconnect sync.Once
}

/* =========================
   HUB
========================= */
type Hub struct {
	DB         *sql.DB
	Clients    map[*Client]struct{}
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan *Message
	mu         sync.RWMutex
}

/* =========================
   NEW HUB
========================= */
func NewHub(db *sql.DB) *Hub {
	return &Hub{
		DB:         db,
		Clients:    make(map[*Client]struct{}),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan *Message, 512),
	}
}

/* =========================
   HUB RUN LOOP
========================= */
func (h *Hub) Run() {
	for {
		select {

		case c := <-h.Register:
			h.mu.Lock()
			h.Clients[c] = struct{}{}
			count := len(h.Clients)
			h.mu.Unlock()

			log.Printf("✅ WS register room=%s player=%d clients=%d",
				c.Room, c.PlayerID, count)

		case c := <-h.Unregister:
			h.removeClient(c)

		case msg := <-h.Broadcast:
			h.mu.RLock()
			for c := range h.Clients {
				if msg.Room == "global" || c.Room == msg.Room {
					select {
					case c.Send <- msg.Data:
					default:
						go h.removeClient(c)
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

/* =========================
   REMOVE CLIENT (SAFE / IDEMPOTENT)
========================= */
func (h *Hub) removeClient(c *Client) {
	c.disconnect.Do(func() {

		h.mu.Lock()
		if _, ok := h.Clients[c]; !ok {
			h.mu.Unlock()
			return
		}
		delete(h.Clients, c)
		count := len(h.Clients)
		h.mu.Unlock()

		c.onDisconnect()

		close(c.Send)
		_ = c.Conn.Close()

		log.Printf("❌ WS unregister room=%s player=%d clients=%d",
			c.Room, c.PlayerID, count)
	})
}

/* =========================
   DISCONNECT LOGIC
========================= */
func (c *Client) onDisconnect() {
	if c.PlayerID == 0 || c.Hub.DB == nil {
		return
	}

	_, _ = c.Hub.DB.Exec(`
		UPDATE players
		SET connected=false
		WHERE id=$1
	`, c.PlayerID)

	// notify room
	c.Hub.broadcastRoom(c.Room, map[string]any{
		"type":      "player_disconnect",
		"player_id": c.PlayerID,
	})

	// update team list
	teams := c.Hub.fetchTeams(c.Room)
	c.Hub.broadcastRoom(c.Room, map[string]any{
		"type":  "team_update",
		"teams": teams,
	})
}

/* =========================
   NEW CLIENT
========================= */
func NewClient(
	hub *Hub,
	conn *websocket.Conn,
	room string,
	playerID int,
) *Client {

	c := &Client{
		Hub:      hub,
		Conn:     conn,
		Room:     room,
		PlayerID: playerID,
		Send:     make(chan []byte, 256),
	}

	// mark connected
	if playerID > 0 && hub.DB != nil {
		_, _ = hub.DB.Exec(`
			UPDATE players
			SET connected=true, last_seen_at=NOW()
			WHERE id=$1
		`, playerID)
	}

	hub.Register <- c

	go c.readPump()
	go c.writePump()

	return c
}

/* =========================
   READ PUMP
========================= */
func (c *Client) readPump() {
	defer func() {
		c.Hub.Unregister <- c
	}()

	c.Conn.SetReadLimit(4096)
	_ = c.Conn.SetReadDeadline(time.Now().Add(90 * time.Second))

	c.Conn.SetPongHandler(func(string) error {
		_ = c.Conn.SetReadDeadline(time.Now().Add(90 * time.Second))
		return nil
	})

	for {
		_, msg, err := c.Conn.ReadMessage()
		if err != nil {
			return
		}

		// heartbeat update
		if c.PlayerID > 0 && c.Hub.DB != nil {
			_, _ = c.Hub.DB.Exec(`
				UPDATE players
				SET last_seen_at=NOW()
				WHERE id=$1
			`, c.PlayerID)
		}

		text := strings.TrimSpace(strings.ToLower(string(msg)))
		if text == "" || text == "ping" {
			continue
		}

		// 🔮 รองรับ future commands (ready / emote / chat)
	}
}

/* =========================
   WRITE PUMP
========================= */
func (c *Client) writePump() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {

		case msg, ok := <-c.Send:
			if !ok {
				return
			}

			_ = c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				c.Hub.Unregister <- c
				return
			}

		case <-ticker.C:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				c.Hub.Unregister <- c
				return
			}
		}
	}
}

/* =========================
   FETCH TEAMS (REAL DATA)
========================= */
func (h *Hub) fetchTeams(roomCode string) []map[string]any {
	if h.DB == nil {
		return nil
	}

	rows, err := h.DB.Query(`
		SELECT p.id, p.name, p.team, p.total_score
		FROM players p
		JOIN rooms r ON r.id=p.room_id
		WHERE r.code=$1
		ORDER BY p.team, p.id
	`, roomCode)
	if err != nil {
		return nil
	}
	defer rows.Close()

	var teams []map[string]any
	for rows.Next() {
		var id, score int
		var name string
		var team sql.NullString

		if err := rows.Scan(&id, &name, &team, &score); err != nil {
			continue
		}

		teams = append(teams, map[string]any{
			"id":    id,
			"name":  name,
			"team":  team.String,
			"score": score,
		})
	}

	return teams
}

/* =========================
   BROADCAST HELPER
========================= */
func (h *Hub) broadcastRoom(room string, payload map[string]any) {
	select {
	case h.Broadcast <- &Message{
		Room: room,
		Data: MustJSON(payload),
	}:
	default:
	}
}
