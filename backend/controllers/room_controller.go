package controllers

import (
	"crypto/subtle"
	"database/sql"
	"math/rand"
	"net/http"
	"strconv"
	"time"

	"thai-festival-backend/ws"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"golang.org/x/crypto/bcrypt"
)

type RoomController struct {
	DB  *sql.DB
	Hub *ws.Hub
}

<<<<<<< Updated upstream
=======
const (
	minRoomPasswordLength = 4
	maxRoomPasswordLength = 64
)

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

func normalizeRoomPassword(value string) string {
	return strings.TrimSpace(value)
}

func isValidRoomPassword(value string) bool {
	length := len([]rune(value))
	return length >= minRoomPasswordLength && length <= maxRoomPasswordLength
}

func hashRoomPassword(value string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(value), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	return string(hashed), nil
}

func roomRequiresPassword(value string) bool {
	return normalizeRoomPassword(value) != ""
}

func verifyRoomPassword(stored, candidate string) bool {
	stored = normalizeRoomPassword(stored)
	candidate = normalizeRoomPassword(candidate)

	if stored == "" {
		return candidate == ""
	}

	if strings.HasPrefix(stored, "$2a$") || strings.HasPrefix(stored, "$2b$") || strings.HasPrefix(stored, "$2y$") {
		return bcrypt.CompareHashAndPassword([]byte(stored), []byte(candidate)) == nil
	}

	return subtle.ConstantTimeCompare([]byte(stored), []byte(candidate)) == 1
}

>>>>>>> Stashed changes
func NewRoomController(db *sql.DB, hub *ws.Hub) *RoomController {
	return &RoomController{DB: db, Hub: hub}
}

/* =========================
   CREATE ROOM
========================= */

func (rc *RoomController) CreateRoom(c *gin.Context) {

	var req struct {
<<<<<<< Updated upstream
		Name       string `json:"name"`
		Mode       string `json:"mode"`
		HostName   string `json:"host_name"`
		MaxPlayers int    `json:"max_players"`
=======
		Name           string   `json:"name"`
		Mode           string   `json:"mode"`
		HostName       string   `json:"host_name"`
		MaxPlayers     int      `json:"max_players"`
		RoomPassword   string   `json:"room_password"`
		Prizes         []string `json:"prizes"`
		SelectedBooths []string `json:"selected_booths"`
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
=======
	roomPassword := normalizeRoomPassword(req.RoomPassword)
	var roomPasswordValue any
	if roomPassword != "" {
		if !isValidRoomPassword(roomPassword) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "room password must be 4-64 characters",
				"code":  "invalid_room_password",
			})
			return
		}

		hashedPassword, err := hashRoomPassword(roomPassword)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "hash room password failed"})
			return
		}

		roomPasswordValue = hashedPassword
	}

	prizeJSON, err := encodePrizeList(req.Prizes)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid prizes"})
		return
	}

	selectedBooths, ok := normalizeSelectedGameSequence(req.SelectedBooths)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid selected booths"})
		return
	}

	selectedBoothsJSON, err := json.Marshal(selectedBooths)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "encode selected booths failed"})
		return
	}

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
	(code,name,mode,max_players,status)
	VALUES ($1,$2,$3,$4,'waiting')
	RETURNING id
	`, code, req.Name, req.Mode, req.MaxPlayers).Scan(&roomID)
=======
	(code,name,mode,prize,max_players,room_password,selected_booths,status)
	VALUES ($1,$2,$3,$4,$5,$6,$7,'waiting')
	RETURNING id
	`, code, req.Name, req.Mode, prizeJSON, req.MaxPlayers, roomPasswordValue, string(selectedBoothsJSON)).Scan(&roomID)
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
		"room_code": code,
=======
		"room_code":       code,
		"is_private":      roomPassword != "",
		"mode":            req.Mode,
		"prizes":          normalizePrizeList(req.Prizes),
		"selected_booths": selectedBooths,
>>>>>>> Stashed changes
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
		Name         string `json:"name"`
		RoomCode     string `json:"room_code"`
		RoomPassword string `json:"room_password"`
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
	var storedRoomPassword sql.NullString

	err = tx.QueryRow(`
	SELECT id,max_players,room_password
	FROM rooms
	WHERE code=$1 AND status='waiting'
	FOR UPDATE
	`, req.RoomCode).Scan(&roomID, &maxPlayers, &storedRoomPassword)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	}

	if roomRequiresPassword(storedRoomPassword.String) {
		roomPassword := normalizeRoomPassword(req.RoomPassword)
		if roomPassword == "" {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "room password required",
				"code":  "password_required",
			})
			return
		}

		if !verifyRoomPassword(storedRoomPassword.String, roomPassword) {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "invalid room password",
				"code":  "invalid_room_password",
			})
			return
		}
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
	COUNT(p.id) FILTER (WHERE p.connected=true),
	(r.room_password IS NOT NULL AND BTRIM(r.room_password) <> '')
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
		var isPrivate bool

		rows.Scan(&code, &name, &mode, &status, &maxPlayers, &count, &isPrivate)

		rooms = append(rooms, gin.H{
			"code":         code,
			"is_private":   isPrivate,
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

<<<<<<< Updated upstream
=======
	var roomName, mode, status string
	var prizeText, selectedBoothsText, roomPasswordText sql.NullString
	if err := rc.DB.QueryRow(`
	SELECT name,mode,status,prize,selected_booths,room_password
	FROM rooms
	WHERE code=$1
	`, code).Scan(&roomName, &mode, &status, &prizeText, &selectedBoothsText, &roomPasswordText); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	}

>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
	c.JSON(http.StatusOK, gin.H{"players": players})
=======
	c.JSON(http.StatusOK, gin.H{
		"is_private":      roomRequiresPassword(roomPasswordText.String),
		"name":            roomName,
		"mode":            mode,
		"status":          status,
		"prizes":          decodePrizeList(prizeText.String),
		"selected_booths": decodeSelectedGameSequence(selectedBoothsText.String),
		"players":         players,
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

	tx, err := rc.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer tx.Rollback()

	var roomID int
	var roomStatus string
	var selectedBoothsText sql.NullString
	if err := tx.QueryRow(`
		SELECT id, status, selected_booths
		FROM rooms
		WHERE code=$1
		FOR UPDATE
	`, code).Scan(&roomID, &roomStatus, &selectedBoothsText); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	}

	roomSequence := decodeSelectedGameSequence(selectedBoothsText.String)
	gameOrder := gameSequenceIndexForSequence(roomSequence, gameKey)
	if gameOrder == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid game"})
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
	if gameKey == WorshipGameKey {
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
	if gameOrder < len(roomSequence) {
		nextGameKey = roomSequence[gameOrder]
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

	allCompleted, err := roomAllPlayersCompletedTx(tx, roomID, len(roomSequence))
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
		"total_games":   len(roomSequence),
		"next_game_key": nextGameKey,
		"all_completed": allCompleted,
	})

	c.JSON(http.StatusOK, gin.H{
		"ok":            true,
		"completed":     completedCount,
		"total_games":   len(roomSequence),
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

	roomSequence, err := loadRoomGameSequenceTx(tx, roomID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "load room sequence failed"})
		return
	}

	allCompleted, err := roomAllPlayersCompletedTx(tx, roomID, len(roomSequence))
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
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
}
=======
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

func ensureRoomSchema(db *sql.DB) {
	if db == nil {
		return
	}

	_, _ = db.Exec(`
		ALTER TABLE rooms
		ADD COLUMN IF NOT EXISTS room_password TEXT
	`)
	_, _ = db.Exec(`
		ALTER TABLE rooms
		ADD COLUMN IF NOT EXISTS selected_booths TEXT
	`)
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
	var prizeText, selectedBoothsText sql.NullString
	if err := db.QueryRow(`
		SELECT id, name, mode, status, prize, selected_booths
		FROM rooms
		WHERE code=$1
	`, code).Scan(&roomID, &roomName, &mode, &status, &prizeText, &selectedBoothsText); err != nil {
		return nil, err
	}

	roomSequence := decodeSelectedGameSequence(selectedBoothsText.String)

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
				TotalGames:     len(roomSequence),
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
		"sequence":       roomSequence,
		"players":        players,
		"me":             me,
		"all_completed":  allCompleted,
		"active_players": activePlayers,
		"total_players":  totalPlayers,
	}, nil
}

func roomAllPlayersCompletedTx(tx *sql.Tx, roomID int, totalGames int) (bool, error) {
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
		if completedCount < totalGames {
			return false, nil
		}
	}

	return playerCount > 0 && totalGames > 0, nil
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
>>>>>>> Stashed changes
