package controllers

import (
	"database/sql"
	"net/http"
	"strconv"

	"thai-festival-backend/ws"

	"github.com/gin-gonic/gin"
)

/* =========================
   ROUND CONTROLLER
========================= */

type RoundController struct {
	DB  *sql.DB
	Hub *ws.Hub
}

func NewRoundController(db *sql.DB, hub *ws.Hub) *RoundController {
	return &RoundController{DB: db, Hub: hub}
}

/* =========================
   GAME SEQUENCE
   ⚠️ ต้องตรงกับ frontend gameKey
========================= */
var GameSequence = []string{
	"FishScoopingScene",
	"CAROUSEL",
	"SHOOT",
	"COTTON",
	"WORSHIP",
}

/* =========================
   START ROUND (HOST ONLY)
========================= */
func (rc *RoundController) StartRound(c *gin.Context) {
	code := c.Param("code")

	tx, err := rc.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer tx.Rollback()

	/* ===== LOCK ROOM ===== */
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "room not started"})
		return
	}

	/* ===== CHECK ACTIVE ROUND ===== */
	var active bool
	_ = tx.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM rounds
			WHERE room_id=$1 AND status='playing'
		)
	`, roomID).Scan(&active)

	if active {
		c.JSON(http.StatusBadRequest, gin.H{"error": "round already running"})
		return
	}

	/* ===== NEXT ROUND INDEX ===== */
	var nextRound int
	_ = tx.QueryRow(`
		SELECT COALESCE(MAX(round_index),0) + 1
		FROM rounds
		WHERE room_id=$1
	`, roomID).Scan(&nextRound)

	if nextRound > len(GameSequence) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no more rounds"})
		return
	}

	gameKey := GameSequence[nextRound-1]

	/* ===== CREATE ROUND ===== */
	var roundID int
	if err := tx.QueryRow(`
		INSERT INTO rounds
			(room_id, round_index, game_key, status, started_at)
		VALUES ($1,$2,$3,'playing',NOW())
		RETURNING id
	`, roomID, nextRound, gameKey).Scan(&roundID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create round failed"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit failed"})
		return
	}

	/* =========================
	   WS: ROUND START
	========================= */
	rc.Hub.Broadcast <- &ws.Message{
		Room: code,
		Data: ws.MustJSON(gin.H{
			"type":         "round_start",
			"round":        nextRound,
			"round_id":     roundID,
			"game_key":     gameKey,
			"duration":     60,
			"total_rounds": len(GameSequence),
		}),
	}

	/* =========================
	   WS: ENTER GAME (NON-HOST)
	========================= */
	rows, _ := rc.DB.Query(`
		SELECT id FROM players
		WHERE room_id=$1 AND is_host=false AND connected=true
	`, roomID)
	defer rows.Close()

	for rows.Next() {
		var pid int
		rows.Scan(&pid)

		rc.Hub.Broadcast <- &ws.Message{
			Room: code,
			Data: ws.MustJSON(gin.H{
				"type":      "enter_game",
				"player_id": pid,
				"game_key":  gameKey,
				"round_id":  roundID,
			}),
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"round_id": roundID,
		"round":    nextRound,
		"game_key": gameKey,
	})
}

/* =========================
   SUBMIT SCORE (PLAYER)
========================= */
func (rc *RoundController) SubmitScore(c *gin.Context) {
	roundID, _ := strconv.Atoi(c.Param("round_id"))

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

	var status, gameKey, roomCode string
	var roomID int
	if err := tx.QueryRow(`
		SELECT r.status, r.game_key, rooms.code, rooms.id
		FROM rounds r
		JOIN rooms ON rooms.id=r.room_id
		WHERE r.id=$1
		FOR UPDATE
	`, roundID).Scan(&status, &gameKey, &roomCode, &roomID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "round not found"})
		return
	}

	if status != "playing" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "round finished"})
		return
	}

	var exists bool
	_ = tx.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM mini_game_results
			WHERE round_id=$1 AND player_id=$2
		)
	`, roundID, req.PlayerID).Scan(&exists)

	if exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "score already submitted"})
		return
	}

	/* ===== SAVE SCORE ===== */
	if _, err := tx.Exec(`
		INSERT INTO mini_game_results
			(round_id, player_id, game_key, score, meta)
		VALUES ($1,$2,$3,$4,$5)
	`, roundID, req.PlayerID, gameKey, req.Score, req.Meta); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "save score failed"})
		return
	}

	_, _ = tx.Exec(`
		UPDATE players
		SET total_score = total_score + $1
		WHERE id=$2
	`, req.Score, req.PlayerID)

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit failed"})
		return
	}

	/* ===== WS: SCORE UPDATE ===== */
	rc.Hub.Broadcast <- &ws.Message{
		Room: roomCode,
		Data: ws.MustJSON(gin.H{
			"type":      "score_update",
			"player_id": req.PlayerID,
			"score":     req.Score,
		}),
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

/* =========================
   END ROUND (HOST ONLY)
========================= */
func (rc *RoundController) EndRound(c *gin.Context) {
	roundID, _ := strconv.Atoi(c.Param("round_id"))

	var roomCode string
	var roundIndex int
	if err := rc.DB.QueryRow(`
		SELECT rooms.code, rounds.round_index
		FROM rounds
		JOIN rooms ON rooms.id=rounds.room_id
		WHERE rounds.id=$1 AND rounds.status='playing'
	`, roundID).Scan(&roomCode, &roundIndex); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "round not active"})
		return
	}

	_, _ = rc.DB.Exec(`
		UPDATE rounds
		SET status='finished', ended_at=NOW()
		WHERE id=$1
	`, roundID)

	rc.Hub.Broadcast <- &ws.Message{
		Room: roomCode,
		Data: ws.MustJSON(gin.H{
			"type":        "round_end",
			"round_id":    roundID,
			"round_index": roundIndex,
		}),
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
