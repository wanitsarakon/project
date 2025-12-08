package controllers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"thai-festival-backend/ws"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// RoomController handles room-related endpoints. Hub is shared from main.
type RoomController struct {
	DB  *sql.DB
	Hub *ws.Hub
}

func NewRoomController(db *sql.DB, hub *ws.Hub) *RoomController {
	return &RoomController{DB: db, Hub: hub}
}

func (rc *RoomController) CreateRoom(c *gin.Context) {
	var req struct {
		Name       string `json:"name"`
		Mode       string `json:"mode"`
		HostName   string `json:"host_name"`
		MaxPlayers int    `json:"max_players"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	if req.Mode != "solo" && req.Mode != "team" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "mode must be 'solo' or 'team'"})
		return
	}
	code := generateRoomCode()
	var id int
	err := rc.DB.QueryRow(`
        INSERT INTO rooms (code, name, mode, host_name, max_players, created_at)
        VALUES ($1,$2,$3,$4,$5,$6) RETURNING id
    `, code, req.Name, req.Mode, req.HostName, req.MaxPlayers, time.Now()).Scan(&id)
	if err != nil {
		log.Println("DB insert room error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db insert failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"room_id": id, "room_code": code})
}

func (rc *RoomController) JoinRoom(c *gin.Context) {
	var req struct {
		Name     string `json:"name"`
		RoomCode string `json:"room_code"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	var roomID int
	var mode string
	err := rc.DB.QueryRow("SELECT id, mode FROM rooms WHERE code=$1", req.RoomCode).Scan(&roomID, &mode)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	var team interface{} = nil
	var teamStr *string = nil
	if mode == "team" {
		t := "red"
		if time.Now().UnixNano()%2 == 0 {
			t = "blue"
		}
		team = t
		teamStr = &t
	}
	var playerID int
	err = rc.DB.QueryRow(`
        INSERT INTO players (name, room_id, team, total_score, connected, created_at)
        VALUES ($1,$2,$3,0,true,$4) RETURNING id
    `, req.Name, roomID, team, time.Now()).Scan(&playerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "insert failed"})
		return
	}
	var teamVal string
	if teamStr != nil {
		teamVal = *teamStr
	}
	msg := map[string]interface{}{
		"type":      "player_join",
		"player_id": playerID,
		"name":      req.Name,
		"team":      teamVal,
		"room":      req.RoomCode,
	}
	b, _ := json.Marshal(msg)
	rc.Hub.Broadcast <- &ws.Message{Room: req.RoomCode, Data: b}
	c.JSON(http.StatusOK, gin.H{"player_id": playerID, "team": teamVal})
}

func (rc *RoomController) GetRoom(c *gin.Context) {
	code := c.Param("code")
	var room struct {
		ID         int       `json:"id"`
		Code       string    `json:"code"`
		Name       string    `json:"name"`
		Mode       string    `json:"mode"`
		HostName   string    `json:"host_name"`
		MaxPlayers int       `json:"max_players"`
		CreatedAt  time.Time `json:"created_at"`
	}
	err := rc.DB.QueryRow(`
        SELECT id, code, name, mode, host_name, max_players, created_at
        FROM rooms WHERE code=$1
    `, code).Scan(&room.ID, &room.Code, &room.Name, &room.Mode, &room.HostName, &room.MaxPlayers, &room.CreatedAt)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	c.JSON(http.StatusOK, room)
}

func (rc *RoomController) PostScore(c *gin.Context) {
	code := c.Param("code")
	var req struct {
		PlayerID int    `json:"player_id"`
		GameName string `json:"game_name"`
		Score    int    `json:"score"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	var roomID int
	if err := rc.DB.QueryRow("SELECT id FROM rooms WHERE code=$1", code).Scan(&roomID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	}
	var exists bool
	err := rc.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM players WHERE id=$1 AND room_id=$2)", req.PlayerID, roomID).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "player not in room"})
		return
	}
	tx, err := rc.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	_, err = tx.Exec("INSERT INTO scores (player_id, game_name, score, created_at) VALUES ($1,$2,$3,$4)",
		req.PlayerID, req.GameName, req.Score, time.Now())
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "insert score failed"})
		return
	}
	_, err = tx.Exec("UPDATE players SET total_score = total_score + $1 WHERE id=$2", req.Score, req.PlayerID)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update total failed"})
		return
	}
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit failed"})
		return
	}
	msg := map[string]interface{}{
		"type":      "score_update",
		"player_id": req.PlayerID,
		"game":      req.GameName,
		"score":     req.Score,
		"room":      code,
	}
	b, _ := json.Marshal(msg)
	rc.Hub.Broadcast <- &ws.Message{Room: code, Data: b}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (rc *RoomController) ServeWs(c *gin.Context) {
	roomCode := c.Param("room_code")
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("ws upgrade:", err)
		return
	}
	client := ws.NewClient(conn, roomCode)
	rc.Hub.Register <- client
}

func generateRoomCode() string {
	const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, 6)
	seed := time.Now().UnixNano()
	for i := range b {
		b[i] = letters[(seed+int64(i))%int64(len(letters))]
		seed = seed / 7 * 13
	}
	return string(b)
}
