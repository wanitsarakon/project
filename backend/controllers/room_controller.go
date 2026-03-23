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
	"unicode"

	"thai-festival-backend/ws"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type RoomController struct {
	DB  *sql.DB
	Hub *ws.Hub
}

func normalizePlayerName(value string) string {
	return strings.Join(strings.Fields(value), " ")
}

func isValidPlayerName(value string) bool {
	if value == "" {
		return false
	}

	for _, r := range value {
		switch {
		case r == ' ':
			continue
		case r >= 'A' && r <= 'Z':
			continue
		case r >= 'a' && r <= 'z':
			continue
		case unicode.In(r, unicode.Thai) && (unicode.IsLetter(r) || unicode.IsMark(r)):
			continue
		default:
			return false
		}
	}

	return true
}

func NewRoomController(db *sql.DB, hub *ws.Hub) *RoomController {
	ensureProgressSchema(db)
	return &RoomController{DB: db, Hub: hub}
}

/* =========================
   CREATE ROOM
========================= */

func (rc *RoomController) CreateRoom(c *gin.Context) {

	var req struct {
		Name       string   `json:"name"`
		Mode       string   `json:"mode"`
		HostName   string   `json:"host_name"`
		MaxPlayers int      `json:"max_players"`
		Prizes     []string `json:"prizes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil || req.HostName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	req.HostName = normalizePlayerName(req.HostName)
	if !isValidPlayerName(req.HostName) || len([]rune(req.HostName)) > 20 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid player name",
			"code":  "invalid_name",
		})
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

	req.Name = normalizePlayerName(req.Name)
	if !isValidPlayerName(req.Name) || len([]rune(req.Name)) > 20 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid player name",
			"code":  "invalid_name",
		})
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

	if err := tx.QueryRow(`
	SELECT COUNT(*)
	FROM players
	WHERE room_id=$1 AND connected=true
	`, roomID).Scan(&count); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}

	if count >= maxPlayers {
		c.JSON(http.StatusBadRequest, gin.H{"error": "room full"})
		return
	}

	rows, err := tx.Query(`
	SELECT name
	FROM players
	WHERE room_id=$1
	`, roomID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var existingName string
		if err := rows.Scan(&existingName); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}

		if strings.EqualFold(normalizePlayerName(existingName), req.Name) {
			c.JSON(http.StatusConflict, gin.H{
				"error": "duplicate player name",
				"code":  "duplicate_name",
			})
			return
		}
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
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

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit failed"})
		return
	}

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
		"name":    roomName,
		"mode":    mode,
		"status":  status,
		"prizes":  decodePrizeList(prizeText.String),
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
   ROOM PROGRESS
========================= */

func (rc *RoomController) GetProgress(c *gin.Context) {
	code := c.Param("code")
	playerID, _ := strconv.Atoi(c.Query("player_id"))

	if playerID > 0 {
		_, _ = rc.DB.Exec(`
			UPDATE players
			SET connected=true, last_seen_at=NOW()
			WHERE id=$1
		`, playerID)
	}

	progress, err := buildRoomProgress(rc.DB, code, playerID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	}

	c.JSON(http.StatusOK, progress)
}

/* =========================
   COMPLETE GAME (PLAYER)
========================= */

func (rc *RoomController) CompleteGame(c *gin.Context) {
	code := c.Param("code")
	gameKey := c.Param("game_key")

	var req struct {
		PlayerID int         `json:"player_id"`
		Score    int         `json:"score"`
		Meta     interface{} `json:"meta"`
	}

	if err := c.ShouldBindJSON(&req); err != nil || req.PlayerID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	gameOrder := gameSequenceIndex(gameKey)
	if gameOrder == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid game"})
		return
	}

	tx, err := rc.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer tx.Rollback()

	var roomID int
	var roomStatus string
	if err := tx.QueryRow(`
		SELECT id, status
		FROM rooms
		WHERE code=$1
		FOR UPDATE
	`, code).Scan(&roomID, &roomStatus); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	}

	if roomStatus != "playing" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "room not active"})
		return
	}

	var playerExists bool
	if err := tx.QueryRow(`
		SELECT EXISTS (
			SELECT 1
			FROM players
			WHERE id=$1 AND room_id=$2 AND is_host=false
		)
	`, req.PlayerID, roomID).Scan(&playerExists); err != nil || !playerExists {
		c.JSON(http.StatusForbidden, gin.H{"error": "player not allowed"})
		return
	}

	var progressStatus string
	if err := tx.QueryRow(`
		SELECT status
		FROM player_game_progress
		WHERE room_id=$1 AND player_id=$2 AND game_key=$3
		FOR UPDATE
	`, roomID, req.PlayerID, gameKey).Scan(&progressStatus); err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusBadRequest, gin.H{"error": "game not unlocked yet"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "progress lookup failed"})
		return
	}

	if progressStatus == "completed" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "game already completed"})
		return
	}

	metaJSON := []byte("null")
	if req.Meta != nil {
		if b, err := json.Marshal(req.Meta); err == nil {
			metaJSON = b
		}
	}

	if _, err := tx.Exec(`
		UPDATE players
		SET connected=true,
		    last_seen_at=NOW()
		WHERE id=$1
	`, req.PlayerID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "touch player failed"})
		return
	}

	effectiveScore := maxInt(req.Score, 0)
	if gameKey == "WorshipBoothScene" {
		effectiveScore = 0
	}

	if _, err := tx.Exec(`
		UPDATE player_game_progress
		SET status='completed',
		    score=$1,
		    meta=$2,
		    completed_at=NOW()
		WHERE room_id=$3 AND player_id=$4 AND game_key=$5
	`, effectiveScore, metaJSON, roomID, req.PlayerID, gameKey); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update progress failed"})
		return
	}

	if _, err := tx.Exec(`
		UPDATE players
		SET total_score = total_score + $1
		WHERE id=$2
	`, effectiveScore, req.PlayerID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update score failed"})
		return
	}

	nextGameKey := ""
	if gameOrder < len(GameSequence) {
		nextGameKey = GameSequence[gameOrder]
		_, err = tx.Exec(`
			INSERT INTO player_game_progress
				(room_id, player_id, game_key, game_order, status)
			VALUES ($1,$2,$3,$4,'unlocked')
			ON CONFLICT (room_id, player_id, game_key) DO NOTHING
		`, roomID, req.PlayerID, nextGameKey, gameOrder+1)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "unlock next game failed"})
			return
		}
	}

	var completedCount int
	_ = tx.QueryRow(`
		SELECT COUNT(*)
		FROM player_game_progress
		WHERE room_id=$1 AND player_id=$2 AND status='completed'
	`, roomID, req.PlayerID).Scan(&completedCount)

	allCompleted, err := roomAllPlayersCompletedTx(tx, roomID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "completion check failed"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit failed"})
		return
	}

	rc.broadcastRoom(code, gin.H{
		"type":      "score_update",
		"player_id": req.PlayerID,
		"score":     effectiveScore,
	})

	rc.broadcastRoom(code, gin.H{
		"type":          "progress_update",
		"player_id":     req.PlayerID,
		"game_key":      gameKey,
		"completed":     completedCount,
		"total_games":   len(GameSequence),
		"next_game_key": nextGameKey,
		"all_completed": allCompleted,
	})

	c.JSON(http.StatusOK, gin.H{
		"ok":            true,
		"completed":     completedCount,
		"total_games":   len(GameSequence),
		"next_game_key": nextGameKey,
		"all_completed": allCompleted,
	})
}

/* =========================
   FINALIZE GAME (HOST)
========================= */

func (rc *RoomController) FinalizeGame(c *gin.Context) {
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
	if err := tx.QueryRow(`
		SELECT id, status
		FROM rooms
		WHERE code=$1
		FOR UPDATE
	`, code).Scan(&roomID, &status); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	}

	if status == "finished" {
		if err := tx.Rollback(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "rollback failed"})
			return
		}

		summary, err := buildRoomSummary(rc.DB, code)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "summary build failed"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"ok":      true,
			"summary": summary,
		})
		return
	}

	if status != "playing" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "room not active"})
		return
	}

	var isHost bool
	if err := tx.QueryRow(`
		SELECT is_host
		FROM players
		WHERE id=$1 AND room_id=$2
	`, playerID, roomID).Scan(&isHost); err != nil || !isHost {
		c.JSON(http.StatusForbidden, gin.H{"error": "only host can finalize"})
		return
	}

	allCompleted, err := roomAllPlayersCompletedTx(tx, roomID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "completion check failed"})
		return
	}
	if !allCompleted {
		c.JSON(http.StatusBadRequest, gin.H{"error": "players are still playing"})
		return
	}

	if _, err := tx.Exec(`
		UPDATE rooms
		SET status='finished'
		WHERE id=$1
	`, roomID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "finalize room failed"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit failed"})
		return
	}

	summary, err := buildRoomSummary(rc.DB, code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "summary build failed"})
		return
	}

	rc.broadcastRoom(code, gin.H{
		"type": "game_finished",
	})

	c.JSON(http.StatusOK, gin.H{
		"ok":      true,
		"summary": summary,
	})
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
	var roomMode string

	err = tx.QueryRow(`
	SELECT id,status,mode
	FROM rooms
	WHERE code=$1
	FOR UPDATE
	`, code).Scan(&roomID, &status, &roomMode)

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

	if roomMode == "team" {
		rows, err := tx.Query(`
			SELECT id
			FROM players
			WHERE room_id=$1 AND is_host=false
			ORDER BY id
		`, roomID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "load players failed"})
			return
		}

		teamKeys := []string{"red", "blue"}
		playerIDs := make([]int, 0)
		for rows.Next() {
			var pid int
			if err := rows.Scan(&pid); err != nil {
				rows.Close()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "scan players failed"})
				return
			}
			playerIDs = append(playerIDs, pid)
		}
		rows.Close()

		rand.Shuffle(len(playerIDs), func(i, j int) {
			playerIDs[i], playerIDs[j] = playerIDs[j], playerIDs[i]
		})

		baseSize := 0
		extraPlayers := 0
		if len(teamKeys) > 0 {
			baseSize = len(playerIDs) / len(teamKeys)
			extraPlayers = len(playerIDs) % len(teamKeys)
		}

		assignIndex := 0
		for teamIndex, teamKey := range teamKeys {
			teamSize := baseSize
			if teamIndex < extraPlayers {
				teamSize += 1
			}

			for i := 0; i < teamSize && assignIndex < len(playerIDs); i += 1 {
				pid := playerIDs[assignIndex]
				assignIndex += 1
				if _, err := tx.Exec(`
				UPDATE players
				SET team=$1
				WHERE id=$2
			`, teamKey, pid); err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "assign team failed"})
					return
				}
			}
		}
	}

	tx.Exec(`
	UPDATE rooms
	SET status='playing'
	WHERE id=$1
	`, roomID)

	if len(GameSequence) > 0 {
		if _, err := tx.Exec(`
			INSERT INTO player_game_progress
				(room_id, player_id, game_key, game_order, status)
			SELECT $1, p.id, $2, 1, 'unlocked'
			FROM players p
			WHERE p.room_id=$1 AND p.is_host=false
			ON CONFLICT (room_id, player_id, game_key) DO NOTHING
		`, roomID, GameSequence[0]); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "init player progress failed"})
			return
		}
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit failed"})
		return
	}

	rc.broadcastRoom(code, gin.H{
		"type": "game_start",
	})

	rc.broadcastRoom(code, gin.H{
		"type":          "progress_update",
		"all_completed": false,
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

func ensureProgressSchema(db *sql.DB) {
	if db == nil {
		return
	}

	_, _ = db.Exec(`
		CREATE TABLE IF NOT EXISTS player_game_progress (
			id SERIAL PRIMARY KEY,
			room_id INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
			player_id INT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
			game_key VARCHAR(50) NOT NULL,
			game_order INT NOT NULL CHECK (game_order >= 1),
			status VARCHAR(20) NOT NULL DEFAULT 'unlocked'
				CHECK (status IN ('unlocked','completed')),
			score INT NOT NULL DEFAULT 0 CHECK (score >= 0),
			meta JSONB,
			completed_at TIMESTAMPTZ,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			CONSTRAINT uq_progress_room_player_game UNIQUE (room_id, player_id, game_key)
		)
	`)
	_, _ = db.Exec(`CREATE INDEX IF NOT EXISTS idx_progress_room_player ON player_game_progress(room_id, player_id)`)
	_, _ = db.Exec(`CREATE INDEX IF NOT EXISTS idx_progress_room_status ON player_game_progress(room_id, status)`)
}

func buildRoomProgress(db *sql.DB, code string, currentPlayerID int) (gin.H, error) {
	var roomID int
	var roomName, mode, status string
	var prizeText sql.NullString
	if err := db.QueryRow(`
		SELECT id, name, mode, status, prize
		FROM rooms
		WHERE code=$1
	`, code).Scan(&roomID, &roomName, &mode, &status, &prizeText); err != nil {
		return nil, err
	}

	rows, err := db.Query(`
		SELECT p.id, p.name, p.is_host, p.connected, p.team, p.total_score, pg.game_key, pg.status, pg.score
		FROM players p
		LEFT JOIN player_game_progress pg
		  ON pg.player_id=p.id AND pg.room_id=p.room_id
		WHERE p.room_id=$1
		ORDER BY p.is_host DESC, p.id, pg.game_order
	`, roomID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	type playerProgressState struct {
		PlayerID       int      `json:"player_id"`
		Name           string   `json:"name"`
		IsHost         bool     `json:"is_host"`
		Connected      bool     `json:"connected"`
		Team           string   `json:"team,omitempty"`
		TotalScore     int      `json:"total_score"`
		Completed      int      `json:"completed"`
		TotalGames     int      `json:"total_games"`
		NextGameKey    string   `json:"next_game_key,omitempty"`
		UnlockedGames  []string `json:"unlocked_games"`
		CompletedGames []string `json:"completed_games"`
	}

	playerMap := make(map[int]*playerProgressState)
	playerOrder := make([]int, 0)

	for rows.Next() {
		var id, totalScore int
		var name string
		var isHost, connected bool
		var gameKey, progressStatus, team sql.NullString
		var gameScore sql.NullInt64

		if err := rows.Scan(&id, &name, &isHost, &connected, &team, &totalScore, &gameKey, &progressStatus, &gameScore); err != nil {
			continue
		}

		entry, ok := playerMap[id]
		if !ok {
			entry = &playerProgressState{
				PlayerID:       id,
				Name:           name,
				IsHost:         isHost,
				Connected:      connected,
				Team:           team.String,
				TotalScore:     totalScore,
				TotalGames:     len(GameSequence),
				UnlockedGames:  make([]string, 0),
				CompletedGames: make([]string, 0),
			}
			playerMap[id] = entry
			playerOrder = append(playerOrder, id)
		}

		if !gameKey.Valid || !progressStatus.Valid {
			continue
		}

		switch progressStatus.String {
		case "completed":
			entry.Completed += 1
			entry.CompletedGames = append(entry.CompletedGames, gameKey.String)
		case "unlocked":
			entry.UnlockedGames = append(entry.UnlockedGames, gameKey.String)
			if entry.NextGameKey == "" {
				entry.NextGameKey = gameKey.String
			}
		}
	}

	players := make([]gin.H, 0, len(playerOrder))
	var me gin.H
	allCompleted := true
	activePlayers := 0
	totalPlayers := 0

	for _, id := range playerOrder {
		entry := playerMap[id]
		payload := gin.H{
			"player_id":       entry.PlayerID,
			"name":            entry.Name,
			"is_host":         entry.IsHost,
			"connected":       entry.Connected,
			"team":            entry.Team,
			"total_score":     entry.TotalScore,
			"completed":       entry.Completed,
			"total_games":     entry.TotalGames,
			"next_game_key":   entry.NextGameKey,
			"unlocked_games":  entry.UnlockedGames,
			"completed_games": entry.CompletedGames,
			"done":            entry.Completed >= entry.TotalGames,
		}
		players = append(players, payload)

		if !entry.IsHost {
			totalPlayers += 1
			if entry.Connected {
				activePlayers += 1
			}
			if entry.Completed < entry.TotalGames {
				allCompleted = false
			}
		}

		if currentPlayerID > 0 && entry.PlayerID == currentPlayerID {
			me = payload
		}
	}

	if totalPlayers == 0 {
		allCompleted = false
	}

	return gin.H{
		"room_code":      code,
		"room_name":      roomName,
		"mode":           mode,
		"status":         status,
		"prizes":         decodePrizeList(prizeText.String),
		"sequence":       GameSequence,
		"players":        players,
		"me":             me,
		"all_completed":  allCompleted,
		"active_players": activePlayers,
		"total_players":  totalPlayers,
	}, nil
}

func roomAllPlayersCompletedTx(tx *sql.Tx, roomID int) (bool, error) {
	rows, err := tx.Query(`
		SELECT p.id,
		       COALESCE(COUNT(pg.id) FILTER (WHERE pg.status='completed'), 0) AS completed_count
		FROM players p
		LEFT JOIN player_game_progress pg
		  ON pg.player_id=p.id AND pg.room_id=p.room_id
		WHERE p.room_id=$1
		  AND p.is_host=false
		GROUP BY p.id
	`, roomID)
	if err != nil {
		return false, err
	}
	defer rows.Close()

	playerCount := 0
	for rows.Next() {
		var id, completedCount int
		if err := rows.Scan(&id, &completedCount); err != nil {
			return false, err
		}
		playerCount += 1
		if completedCount < len(GameSequence) {
			return false, nil
		}
	}

	return playerCount > 0, nil
}

func gameSequenceIndex(gameKey string) int {
	for idx, key := range GameSequence {
		if key == gameKey {
			return idx + 1
		}
	}
	return 0
}

func maxInt(value, minValue int) int {
	if value < minValue {
		return minValue
	}
	return value
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
