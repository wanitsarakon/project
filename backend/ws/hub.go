package ws

import (
	"database/sql"
	"log"
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
	Hub        *Hub
	Conn       *websocket.Conn
	Room       string
	PlayerID   int
	Send       chan []byte
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
			h.mu.Unlock()

			log.Printf("✅ WS register room=%s player=%d clients=%d",
				c.Room, c.PlayerID, len(h.Clients))

		case c := <-h.Unregister:
			h.removeClient(c)

		case msg := <-h.Broadcast:
			h.mu.Lock()
			for c := range h.Clients {
				if c.Room == msg.Room || c.Room == "global" {
					select {
					case c.Send <- msg.Data:
					default:
						go h.removeClient(c)
					}
				}
			}
			h.mu.Unlock()
		}
	}
}

/* =========================
   REMOVE CLIENT (SAFE)
========================= */
func (h *Hub) removeClient(c *Client) {
	h.mu.Lock()
	if _, ok := h.Clients[c]; !ok {
		h.mu.Unlock()
		return
	}
	delete(h.Clients, c)
	h.mu.Unlock()

	c.disconnect.Do(func() {
		c.onDisconnect()
		close(c.Send)
		_ = c.Conn.Close()

		log.Printf("❌ WS unregister room=%s player=%d clients=%d",
			c.Room, c.PlayerID, len(h.Clients))
	})
}

/* =========================
   DISCONNECT LOGIC
========================= */
func (c *Client) onDisconnect() {
	if c.PlayerID == 0 || c.Hub.DB == nil {
		return
	}

	// mark disconnected
	_, _ = c.Hub.DB.Exec(`
		UPDATE players
		SET connected=false
		WHERE id=$1
	`, c.PlayerID)

	// notify room
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
func NewClient(hub *Hub, conn *websocket.Conn, room string, playerID int) *Client {
	c := &Client{
		Hub:      hub,
		Conn:     conn,
		Room:     room,
		PlayerID: playerID,
		Send:     make(chan []byte, 256),
	}

	hub.Register <- c

	go c.readPump()
	go c.writePump()

	return c
}

/* =========================
   READ PUMP (HEARTBEAT)
========================= */
func (c *Client) readPump() {
	defer func() {
		c.Hub.Unregister <- c
	}()

	c.Conn.SetReadLimit(1024)
	_ = c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))

	c.Conn.SetPongHandler(func(string) error {
		_ = c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, msg, err := c.Conn.ReadMessage()
		if err != nil {
			return
		}

		// heartbeat
		if string(msg) == "ping" && c.PlayerID > 0 {
			_, _ = c.Hub.DB.Exec(`
				UPDATE players
				SET last_seen_at=NOW()
				WHERE id=$1
			`, c.PlayerID)
		}
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
