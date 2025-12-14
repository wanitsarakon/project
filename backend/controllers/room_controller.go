package controllers

import (
	"database/sql"
	"encoding/json"
	"math/rand"
	"net/http"
	"time"

	"thai-festival-backend/ws"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type RoomController struct {
	DB  *sql.DB
	Hub *ws.Hub
}

func NewRoomController(db *sql.DB, hub *ws.Hub) *RoomController {
	return &RoomController{DB: db, Hub: hub}
}

/* ===== CREATE ROOM ===== */
func (rc *RoomController) CreateRoom(c *gin.Context) {
	var req struct {
		Name       string `json:"name"`
		Mode       string `json:"mode"`
		HostName   string `json:"host_name"`
		MaxPlayers int    `json:"max_players"`
	}

	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid request"})
		return
	}

	if req.MaxPlayers <= 0 {
		req.MaxPlayers = 8
	}

	code := generateRoomCode()

	tx, _ := rc.DB.Begin()
	defer tx.Rollback()

	var roomID int
	tx.QueryRow(`
		INSERT INTO rooms (code,name,mode,max_players,status)
		VALUES ($1,$2,$3,$4,'waiting')
		RETURNING id
	`, code, req.Name, req.Mode, req.MaxPlayers).Scan(&roomID)

	var hostID int
	tx.QueryRow(`
		INSERT INTO players (name,room_id,is_host,connected,total_score)
		VALUES ($1,$2,true,true,0)
		RETURNING id
	`, req.HostName, roomID).Scan(&hostID)

	tx.Exec(`UPDATE rooms SET host_player_id=$1 WHERE id=$2`, hostID, roomID)
	tx.Commit()

	c.JSON(200, gin.H{
		"room_code": code,
		"player": gin.H{
			"id":   hostID,
			"name": req.HostName,
			"isHost": true,
		},
	})
}

/* ===== JOIN ROOM ===== */
func (rc *RoomController) JoinRoom(c *gin.Context) {
	var req struct {
		Name     string `json:"name"`
		RoomCode string `json:"room_code"`
	}
	c.BindJSON(&req)

	var roomID int
	rc.DB.QueryRow(`SELECT id FROM rooms WHERE code=$1`, req.RoomCode).Scan(&roomID)

	var playerID int
	rc.DB.QueryRow(`
		INSERT INTO players (name,room_id,connected,total_score)
		VALUES ($1,$2,true,0)
		RETURNING id
	`, req.Name, roomID).Scan(&playerID)

	msg, _ := json.Marshal(gin.H{
		"type": "player_join",
		"id":   playerID,
		"name": req.Name,
	})

	rc.Hub.Broadcast <- &ws.Message{Room: req.RoomCode, Data: msg}

	c.JSON(200, gin.H{
		"player": gin.H{"id": playerID, "name": req.Name},
	})
}

/* ===== GET ROOM ===== */
func (rc *RoomController) GetRoom(c *gin.Context) {
	code := c.Param("code")

	rows, _ := rc.DB.Query(`
		SELECT id,name,is_host,total_score
		FROM players
		WHERE room_id=(SELECT id FROM rooms WHERE code=$1)
	`, code)
	defer rows.Close()

	players := []gin.H{}
	for rows.Next() {
		var id, score int
		var name string
		var isHost bool
		rows.Scan(&id, &name, &isHost, &score)
		players = append(players, gin.H{
			"id": id, "name": name, "isHost": isHost, "score": score,
		})
	}

	c.JSON(200, gin.H{"players": players})
}

/* ===== WS ===== */
func (rc *RoomController) ServeWs(c *gin.Context) {
	room := c.Param("room_code")
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}
	conn, _ := upgrader.Upgrade(c.Writer, c.Request, nil)
	client := ws.NewClient(rc.Hub, conn, room)
	rc.Hub.Register <- client
}

func generateRoomCode() string {
	const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, 6)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	return string(b)
}

func init() {
	rand.Seed(time.Now().UnixNano())
}
