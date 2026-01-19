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
	Hub      *Hub
	Conn     *websocket.Conn
	Room     string
	PlayerID int
	Send     chan []byte

	disconnect sync.Once
}

/* =========================
   HUB
========================= */
type Hub struct {
	DB         *sql.DB
	Clients    map[*Client]bool
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan *Message
	mu         sync.Mutex
}

/* =========================
   NEW HUB
========================= */
func NewHub(db *sql.DB) *Hub {
	return &Hub{
		DB:         db,
		Clients:    make(map[*Client]bool),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan *Message, 256),
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
			h.Clients[c] = true
			count := len(h.Clients)
			h.mu.Unlock()

			log.Printf("✅ WS register room=%s player=%d clients=%d",
				c.Room, c.PlayerID, count)

		case c := <-h.Unregister:
			h.removeClient(c)

		case msg := <-h.Broadcast:
			h.mu.Lock()
			for c := range h.Clients {
				if msg.Room == "global" || c.Room == msg.Room {
					select {
					case c.Send <- msg.Data:
					default:
						// slow or dead client → remove async
						go h.removeClient(c)
					}
				}
			}
			h.mu.Unlock()
		}
	}
}

/* =========================
   REMOVE CLIENT (ABSOLUTELY SAFE)
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

		// close send channel safely
		close(c.Send)

		// close socket
		_ = c.Conn.Close()

		log.Printf("❌ WS unregister room=%s player=%d clients=%d",
			c.Room, c.PlayerID, count)
	})
}

/* =========================
   DISCONNECT LOGIC (ONCE)
========================= */
func (c *Client) onDisconnect() {
	if c.PlayerID == 0 || c.Hub.DB == nil {
		return
	}

	// mark offline
	_, _ = c.Hub.DB.Exec(`
		UPDATE players
		SET connected=false
		WHERE id=$1
	`, c.PlayerID)

	// notify room (non-blocking)
	select {
	case c.Hub.Broadcast <- &Message{
		Room: c.Room,
		Data: MustJSON(map[string]any{
			"type":      "player_disconnect",
			"player_id": c.PlayerID,
		}),
	}:
	default:
	}
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
   READ PUMP (HEARTBEAT SAFE)
========================= */
func (c *Client) readPump() {
	defer func() {
		c.Hub.Unregister <- c
	}()

	c.Conn.SetReadLimit(2048)
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

		// ignore text ping
		text := strings.TrimSpace(strings.ToLower(string(msg)))
		if text == "ping" {
			continue
		}
	}
}

/* =========================
   WRITE PUMP (SAFE)
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
			if err := c.Conn.WriteMessage(
				websocket.TextMessage,
				msg,
			); err != nil {
				c.Hub.Unregister <- c
				return
			}

		case <-ticker.C:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(
				websocket.PingMessage,
				nil,
			); err != nil {
				c.Hub.Unregister <- c
				return
			}
		}
	}
}
