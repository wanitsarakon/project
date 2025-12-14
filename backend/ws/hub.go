package ws

import (
	"log"
	"time"

	"github.com/gorilla/websocket"
)

type Message struct {
	Room string
	Data []byte
}

type Client struct {
	Hub  *Hub
	Conn *websocket.Conn
	Room string
	Send chan []byte
}

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
		case c := <-h.Register:
			h.Clients[c] = true
			log.Println("WS register:", c.Room)

		case c := <-h.Unregister:
			if _, ok := h.Clients[c]; ok {
				delete(h.Clients, c)
				close(c.Send)
				c.Conn.Close()
			}

		case msg := <-h.Broadcast:
			for c := range h.Clients {
				if c.Room == msg.Room {
					select {
					case c.Send <- msg.Data:
					default:
						delete(h.Clients, c)
						close(c.Send)
					}
				}
			}
		}
	}
}

func NewClient(hub *Hub, conn *websocket.Conn, room string) *Client {
	c := &Client{
		Hub:  hub,
		Conn: conn,
		Room: room,
		Send: make(chan []byte, 256),
	}
	go c.readPump()
	go c.writePump()
	return c
}

func (c *Client) readPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()
	c.Conn.SetReadLimit(512)
	for {
		if _, _, err := c.Conn.ReadMessage(); err != nil {
			break
		}
	}
}

func (c *Client) writePump() {
	for msg := range c.Send {
		c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
		if err := c.Conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			return
		}
	}
}
