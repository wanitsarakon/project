package controllers

import (
	"database/sql"
	"encoding/json"
	"math/rand"
	"net/http"
	"sort"
	"strconv"
	"strings"
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

/* =========================
   CREATE ROOM
========================= */

func (rc *RoomController) CreateRoom(c *gin.Context) {

	var req struct {
		Name       string `json:"name"`
		Mode       string `json:"mode"`
		HostName   string `json:"host_name"`
		MaxPlayers int    `json:"max_players"`
		Prizes     []string `json:"prizes"`
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

	if req.MaxPlayers <= 0 {
		req.MaxPlayers = 8
	}

	prizeJSON, err := encodePrizeList(req.Prizes)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid prizes"})
		return
	}

	code := generateRoomCode()

	tx, err := rc.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}

	defer tx.Rollback()

	var roomID int

	err = tx.QueryRow(`
	INSERT INTO rooms
	(code,name,mode,prize,max_players,status)
	VALUES ($1,$2,$3,$4,$5,'waiting')
	RETURNING id
	`, code, req.Name, req.Mode, prizeJSON, req.MaxPlayers).Scan(&roomID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create room failed"})
		return
	}

	var hostID int

	err = tx.QueryRow(`
	INSERT INTO players
	(name,room_id,is_host,connected,total_score,last_seen_at)
	VALUES ($1,$2,true,true,0,NOW())
	RETURNING id
	`, req.HostName, roomID).Scan(&hostID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create host failed"})
		return
	}

	tx.Exec(`
	UPDATE rooms
	SET host_player_id=$1
	WHERE id=$2
	`, hostID, roomID)

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit failed"})
		return
	}

	rc.broadcastGlobal()

	c.JSON(http.StatusOK, gin.H{
		"room_code": code,
		"mode":      req.Mode,
		"prizes":    normalizePrizeList(req.Prizes),
		"player": gin.H{
			"id":      hostID,
			"name":    req.HostName,
			"is_host": true,
		},
	})
}

/* =========================
   JOIN ROOM
========================= */

func (rc *RoomController) JoinRoom(c *gin.Context) {

	var req struct {
		Name     string `json:"name"`
		RoomCode string `json:"room_code"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	tx, err := rc.DB.Begin()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}

	defer tx.Rollback()

	var roomID int
	var maxPlayers int

	err = tx.QueryRow(`
	SELECT id,max_players
	FROM rooms
	WHERE code=$1 AND status='waiting'
	FOR UPDATE
	`, req.RoomCode).Scan(&roomID, &maxPlayers)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	}

	var count int

	tx.QueryRow(`
	SELECT COUNT(*)
	FROM players
	WHERE room_id=$1 AND connected=true
	`, roomID).Scan(&count)

	if count >= maxPlayers {
		c.JSON(http.StatusBadRequest, gin.H{"error": "room full"})
		return
	}

	var playerID int

	err = tx.QueryRow(`
	INSERT INTO players
	(name,room_id,is_host,connected,total_score,last_seen_at)
	VALUES ($1,$2,false,true,0,NOW())
	RETURNING id
	`, req.Name, roomID).Scan(&playerID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "join failed"})
		return
	}

	tx.Commit()

	rc.broadcastRoom(req.RoomCode, gin.H{
		"type": "player_join",
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
   LIST ROOMS
========================= */

func (rc *RoomController) ListRooms(c *gin.Context) {

	rows, err := rc.DB.Query(`
	SELECT r.code,r.name,r.mode,r.status,r.max_players,
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
   GET ROOM DETAIL
========================= */

func (rc *RoomController) GetRoom(c *gin.Context) {

	code := c.Param("code")

	var roomName, mode, status string
	var prizeText sql.NullString
	if err := rc.DB.QueryRow(`
	SELECT name,mode,status,prize
	FROM rooms
	WHERE code=$1
	`, code).Scan(&roomName, &mode, &status, &prizeText); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	}

	rows, err := rc.DB.Query(`
	SELECT p.id,p.name,p.is_host,p.team,p.total_score,p.connected
	FROM players p
	JOIN rooms r ON r.id=p.room_id
	WHERE r.code=$1
	ORDER BY p.is_host DESC,p.id
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

	c.JSON(http.StatusOK, gin.H{
		"name":   roomName,
		"mode":   mode,
		"status": status,
		"prizes": decodePrizeList(prizeText.String),
		"players": players,
	})
}

/* =========================
   UPDATE PRIZES (HOST ONLY)
========================= */

func (rc *RoomController) UpdatePrizes(c *gin.Context) {
	code := c.Param("code")
	playerID, _ := strconv.Atoi(c.Query("player_id"))

	var req struct {
		Prizes []string `json:"prizes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	prizeJSON, err := encodePrizeList(req.Prizes)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid prizes"})
		return
	}

	tx, err := rc.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer tx.Rollback()

	var roomID int
	var status string
	if err := tx.QueryRow(`
	SELECT id,status
	FROM rooms
	WHERE code=$1
	FOR UPDATE
	`, code).Scan(&roomID, &status); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	}

	if status != "waiting" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot edit prizes after game start"})
		return
	}

	var isHost bool
	if err := tx.QueryRow(`
	SELECT is_host
	FROM players
	WHERE id=$1 AND room_id=$2
	`, playerID, roomID).Scan(&isHost); err != nil || !isHost {
		c.JSON(http.StatusForbidden, gin.H{"error": "only host can update prizes"})
		return
	}

	if _, err := tx.Exec(`
	UPDATE rooms
	SET prize=$1
	WHERE id=$2
	`, prizeJSON, roomID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update prizes failed"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit failed"})
		return
	}

	rc.broadcastRoom(code, gin.H{
		"type":   "room_update",
		"prizes": normalizePrizeList(req.Prizes),
	})

	c.JSON(http.StatusOK, gin.H{
		"ok":     true,
		"prizes": normalizePrizeList(req.Prizes),
	})
}

/* =========================
   ROOM SUMMARY
========================= */

func (rc *RoomController) GetSummary(c *gin.Context) {
	code := c.Param("code")

	summary, err := buildRoomSummary(rc.DB, code)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	}

	c.JSON(http.StatusOK, summary)
}

/* =========================
   START GAME
========================= */

func (rc *RoomController) StartGame(c *gin.Context) {

	code := c.Param("code")
	playerID, _ := strconv.Atoi(c.Query("player_id"))

	tx, err := rc.DB.Begin()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}

	defer tx.Rollback()

	var roomID int
	var status string

	err = tx.QueryRow(`
	SELECT id,status
	FROM rooms
	WHERE code=$1
	FOR UPDATE
	`, code).Scan(&roomID, &status)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "room not found"})
		return
	}

	if status != "waiting" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "room already started"})
		return
	}

	var isHost bool

	err = tx.QueryRow(`
	SELECT is_host
	FROM players
	WHERE id=$1 AND room_id=$2
	`, playerID, roomID).Scan(&isHost)

	if err != nil || !isHost {
		c.JSON(http.StatusForbidden, gin.H{"error": "only host can start"})
		return
	}

	var playerCount int

	tx.QueryRow(`
	SELECT COUNT(*)
	FROM players
	WHERE room_id=$1 AND connected=true
	`, roomID).Scan(&playerCount)

	if playerCount == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no players"})
		return
	}

	tx.Exec(`
	UPDATE rooms
	SET status='playing'
	WHERE id=$1
	`, roomID)

	tx.Commit()

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
		Data: ws.MustJSON(gin.H{
			"type": "room_update",
		}),
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

type summaryPlayer struct {
	PlayerID   int    `json:"player_id"`
	Name       string `json:"name"`
	Team       string `json:"team,omitempty"`
	TotalScore int    `json:"total_score"`
	Prize      string `json:"prize,omitempty"`
}

type summaryTeam struct {
	Team       string          `json:"team"`
	TotalScore int             `json:"total_score"`
	Prize      string          `json:"prize,omitempty"`
	Members    []summaryPlayer `json:"members"`
}

func buildRoomSummary(db *sql.DB, code string) (gin.H, error) {
	var roomID int
	var roomName, mode, status string
	var prizeText sql.NullString
	if err := db.QueryRow(`
	SELECT id,name,mode,status,prize
	FROM rooms
	WHERE code=$1
	`, code).Scan(&roomID, &roomName, &mode, &status, &prizeText); err != nil {
		return nil, err
	}

	prizes := decodePrizeList(prizeText.String)
	rows, err := db.Query(`
	SELECT id,name,team,total_score
	FROM players
	WHERE room_id=$1 AND is_host=false
	ORDER BY total_score DESC, id ASC
	`, roomID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	players := make([]summaryPlayer, 0)
	for rows.Next() {
		var p summaryPlayer
		var team sql.NullString
		if err := rows.Scan(&p.PlayerID, &p.Name, &team, &p.TotalScore); err != nil {
			continue
		}
		if team.Valid {
			p.Team = team.String
		}
		players = append(players, p)
	}

	if mode == "team" {
		teams := make(map[string]*summaryTeam)
		for _, p := range players {
			teamKey := p.Team
			if teamKey == "" {
				teamKey = "unassigned"
			}
			if teams[teamKey] == nil {
				teams[teamKey] = &summaryTeam{
					Team:    teamKey,
					Members: make([]summaryPlayer, 0),
				}
			}
			teams[teamKey].TotalScore += p.TotalScore
			teams[teamKey].Members = append(teams[teamKey].Members, p)
		}

		rankedTeams := make([]summaryTeam, 0, len(teams))
		for _, t := range teams {
			sort.Slice(t.Members, func(i, j int) bool {
				if t.Members[i].TotalScore == t.Members[j].TotalScore {
					return t.Members[i].PlayerID < t.Members[j].PlayerID
				}
				return t.Members[i].TotalScore > t.Members[j].TotalScore
			})
			rankedTeams = append(rankedTeams, *t)
		}

		sort.Slice(rankedTeams, func(i, j int) bool {
			if rankedTeams[i].TotalScore == rankedTeams[j].TotalScore {
				return rankedTeams[i].Team < rankedTeams[j].Team
			}
			return rankedTeams[i].TotalScore > rankedTeams[j].TotalScore
		})

		for i := range rankedTeams {
			if i < len(prizes) {
				rankedTeams[i].Prize = prizes[i]
			}
		}

		return gin.H{
			"room_code": code,
			"room_name": roomName,
			"mode":      mode,
			"status":    status,
			"prizes":    prizes,
			"results":   players,
			"teams":     rankedTeams,
			"podium":    rankedTeams[:min(len(rankedTeams), 3)],
		}, nil
	}

	for i := range players {
		if i < len(prizes) {
			players[i].Prize = prizes[i]
		}
	}

	return gin.H{
		"room_code": code,
		"room_name": roomName,
		"mode":      mode,
		"status":    status,
		"prizes":    prizes,
		"results":   players,
		"podium":    players[:min(len(players), 3)],
	}, nil
}

func encodePrizeList(prizes []string) (string, error) {
	normalized := normalizePrizeList(prizes)
	if len(normalized) == 0 {
		return "[]", nil
	}
	b, err := json.Marshal(normalized)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

func decodePrizeList(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return []string{}
	}

	var prizes []string
	if err := json.Unmarshal([]byte(raw), &prizes); err == nil {
		return normalizePrizeList(prizes)
	}

	return normalizePrizeList([]string{raw})
}

func normalizePrizeList(prizes []string) []string {
	normalized := make([]string, 0, len(prizes))
	for _, prize := range prizes {
		clean := strings.TrimSpace(prize)
		if clean == "" {
			continue
		}
		normalized = append(normalized, clean)
	}
	if len(normalized) > 10 {
		return normalized[:10]
	}
	return normalized
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
