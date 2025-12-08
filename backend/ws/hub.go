package ws

import (
	"log"
	"time"
	"github.com/gorilla/websocket"
)

// Message wraps broadcast data with room
type Message struct {
	Room string
	Data []byte
}

// Client represents a single websocket connection
type Client struct {
	Conn *websocket.Conn
	Room string
	Send chan []byte
}

// Hub maintains clients and broadcasts
type Hub struct {
	Clients    map[*Client]bool
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan *Message
}

func NewHub() *Hub {
	return &Hub{
		Clients:    make(map[*Client]bool),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan *Message, 256),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.Clients[client] = true
			log.Println("ws: client registered for room", client.Room)
		case client := <-h.Unregister:
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)
				client.Conn.Close()
			}
		case msg := <-h.Broadcast:
			for c := range h.Clients {
				if c.Room == msg.Room {
					select {
					case c.Send <- msg.Data:
					default:
						close(c.Send)
						delete(h.Clients, c)
					}
				}
			}
		}
	}
}

func NewClient(conn *websocket.Conn, room string) *Client {
	c := &Client{Conn: conn, Room: room, Send: make(chan []byte, 256)}
	go c.writePump()
	go c.readPump()
	return c
}

func (c *Client) readPump() {
	defer func() {
		c.Conn.Close()
	}()
	c.Conn.SetReadLimit(512)
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	for {
		_, _, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

func (c *Client) writePump() {
	for {
		select {
		case msg, ok := <-c.Send:
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		}
	}
}