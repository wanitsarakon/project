package controllers

import (
	"database/sql"
	"math/rand"
	"net/http"
	"strconv"
	"time"

	"thai-festival-backend/ws"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

/* =========================
   ROOM CONTROLLER
========================= */

type RoomController struct {
	DB  *sql.DB
	Hub *ws.Hub
}

func NewRoomController(db *sql.DB, hub *ws.Hub) *RoomController {
	return &RoomController{DB: db, Hub: hub}
}

/* =========================
   CREATE ROOM (HOST)
   ✅ Backend = Source of Truth (is_host)
========================= */
func (rc *RoomController) CreateRoom(c *gin.Context) {
	var req struct {
		Name         string  `json:"name"`
		Mode         string  `json:"mode"`
		HostName     string  `json:"host_name"`
		MaxPlayers   int     `json:"max_players"`
		RoomPassword *string `json:"room_password"`
	}

	if err := c.ShouldBindJSON(&req); err != nil || req.HostName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	if req.Name == "" {
		req.Name = "Thai Festival Room"
	}
	if req.Mode != "team" {
		req.Mode = "solo"
	}
	if req.MaxPlayers < 1 {
		req.MaxPlayers = 1
	}
	if req.MaxPlayers > 100 {
		req.MaxPlayers = 100
	}

	code := generateRoomCode()

	tx, err := rc.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer tx.Rollback()

	var roomID int
	if err := tx.QueryRow(`
		INSERT INTO rooms (code, name, mode, max_players, room_password, status, created_at)
		VALUES ($1,$2,$3,$4,$5,'waiting',NOW())
		RETURNING id
	`, code, req.Name, req.Mode, req.MaxPlayers, req.RoomPassword).Scan(&roomID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create room failed"})
		return
	}

	var hostID int
	if err := tx.QueryRow(`
		INSERT INTO players (
			name,
			room_id,
			is_host,
			connected,
			total_score,
			last_seen_at
		)
		VALUES ($1,$2,true,true,0,NOW())
		RETURNING id
	`, req.HostName, roomID).Scan(&hostID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create host failed"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit failed"})
		return
	}

	// แจ้งหน้า Home
	rc.broadcastGlobal()

	c.JSON(http.StatusOK, gin.H{
		"room_code": code,
		"player": gin.H{
			"id":      hostID,
			"name":    req.HostName,
			"is_host": true,
		},
	})
}

/* =========================
   JOIN ROOM (PLAYER)
========================= */
func (rc *RoomController) JoinRoom(c *gin.Context) {
	var req struct {
		Name     string `json:"name"`
		RoomCode string `json:"room_code"`
	}

	if err := c.ShouldBindJSON(&req); err != nil || req.Name == "" || req.RoomCode == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	tx, err := rc.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer tx.Rollback()

	var roomID, maxPlayers int
	if err := tx.QueryRow(`
		SELECT id, max_players
		FROM rooms
		WHERE code=$1 AND status='waiting'
		FOR UPDATE
	`, req.RoomCode).Scan(&roomID, &maxPlayers); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	}

	var count int
	_ = tx.QueryRow(`
		SELECT COUNT(*) FROM players
		WHERE room_id=$1 AND connected=true
	`, roomID).Scan(&count)

	if count >= maxPlayers {
		c.JSON(http.StatusBadRequest, gin.H{"error": "room is full"})
		return
	}

	var playerID int
	if err := tx.QueryRow(`
		INSERT INTO players (name, room_id, is_host, connected, total_score, last_seen_at)
		VALUES ($1,$2,false,true,0,NOW())
		RETURNING id
	`, req.Name, roomID).Scan(&playerID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "join room failed"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit failed"})
		return
	}

	rc.broadcastRoom(req.RoomCode, gin.H{
		"type": "player_join",
		"player": gin.H{
			"id":        playerID,
			"name":      req.Name,
			"is_host":   false,
			"connected": true,
		},
	})

	rc.broadcastGlobal()

	c.JSON(http.StatusOK, gin.H{
		"player": gin.H{
			"id":      playerID,
			"name":    req.Name,
			"is_host": false,
		},
	})
}

/* =========================
   LIST ROOMS (HOME)
========================= */
func (rc *RoomController) ListRooms(c *gin.Context) {
	rows, err := rc.DB.Query(`
		SELECT r.code, r.name, r.mode, r.status, r.max_players,
		       COUNT(p.id) FILTER (WHERE p.connected=true)
		FROM rooms r
		LEFT JOIN players p ON p.room_id=r.id
		GROUP BY r.id
		ORDER BY r.created_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer rows.Close()

	var rooms []gin.H
	for rows.Next() {
		var code, name, mode, status string
		var maxPlayers, count int

		rows.Scan(&code, &name, &mode, &status, &maxPlayers, &count)

		rooms = append(rooms, gin.H{
			"code":         code,
			"name":         name,
			"mode":         mode,
			"status":       status,
			"player_count": count,
			"max_players":  maxPlayers,
		})
	}

	c.JSON(http.StatusOK, rooms)
}

/* =========================
   GET ROOM DETAIL (LOBBY)
   ✅ ส่ง is_host จาก DB
========================= */
func (rc *RoomController) GetRoom(c *gin.Context) {
	code := c.Param("code")

	rows, err := rc.DB.Query(`
		SELECT
			p.id,
			p.name,
			p.is_host,
			p.team,
			p.total_score,
			p.connected
		FROM players p
		JOIN rooms r ON r.id=p.room_id
		WHERE r.code=$1
		ORDER BY p.is_host DESC, p.id ASC
	`, code)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	}
	defer rows.Close()

	var players []gin.H
	for rows.Next() {
		var id, score int
		var name string
		var isHost, connected bool
		var team sql.NullString

		rows.Scan(&id, &name, &isHost, &team, &score, &connected)

		players = append(players, gin.H{
			"id":        id,
			"name":      name,
			"is_host":   isHost,
			"team":      team.String,
			"score":     score,
			"connected": connected,
		})
	}

	c.JSON(http.StatusOK, gin.H{"players": players})
}

/* =========================
   START GAME (HOST)
========================= */
func (rc *RoomController) StartGame(c *gin.Context) {
	code := c.Param("code")

	var roomID int
	if err := rc.DB.QueryRow(`
		SELECT id FROM rooms
		WHERE code=$1 AND status='waiting'
	`, code).Scan(&roomID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot start game"})
		return
	}

	rc.DB.Exec(`UPDATE rooms SET status='playing' WHERE id=$1`, roomID)

	rc.broadcastRoom(code, gin.H{
		"type": "game_start",
	})

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

/* =========================
   WEBSOCKET
========================= */
func (rc *RoomController) ServeWs(c *gin.Context) {
	room := c.Param("room_code")
	playerID, _ := strconv.Atoi(c.Query("player_id"))

	up := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}

	conn, err := up.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	ws.NewClient(rc.Hub, conn, room, playerID)
}

/* =========================
   HELPERS
========================= */

func (rc *RoomController) broadcastRoom(code string, payload gin.H) {
	rc.Hub.Broadcast <- &ws.Message{
		Room: code,
		Data: ws.MustJSON(payload),
	}
}

func (rc *RoomController) broadcastGlobal() {
	rc.Hub.Broadcast <- &ws.Message{
		Room: "global",
		Data: ws.MustJSON(gin.H{"type": "room_update"}),
	}
}

func generateRoomCode() string {
	const digits = "0123456789"
	b := make([]byte, 6)
	for i := range b {
		b[i] = digits[rand.Intn(len(digits))]
	}
	return string(b)
}

func init() {
	rand.Seed(time.Now().UnixNano())
}
