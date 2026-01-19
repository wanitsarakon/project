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
========================= */
var GameSequence = []string{
	"balloon",
	"fish",
	"horse",
	"candy",
	"worship",
}

/* =========================
   START ROUND (SAFE)
========================= */
func (rc *RoundController) StartRound(c *gin.Context) {
	code := c.Param("code")

	tx, err := rc.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer tx.Rollback()

	/* ===== find room ===== */
	var roomID int
	var roomStatus string
	if err := tx.QueryRow(`
		SELECT id, status FROM rooms WHERE code=$1
		FOR UPDATE
	`, code).Scan(&roomID, &roomStatus); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	}

	if roomStatus != "playing" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "room not started"})
		return
	}

	/* ===== close previous round ===== */
	_, _ = tx.Exec(`
		UPDATE rounds
		SET status='finished', ended_at=NOW()
		WHERE room_id=$1 AND status='playing'
	`, roomID)

	/* ===== next round index (1-based) ===== */
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

	/* ===== create round ===== */
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

	/* ===== broadcast ===== */
	rc.Hub.Broadcast <- &ws.Message{
		Room: code,
		Data: ws.MustJSON(gin.H{
			"type":     "round_start",
			"round":    nextRound,
			"round_id": roundID,
			"game_key": gameKey,
			"duration": 60,
		}),
	}

	c.JSON(http.StatusOK, gin.H{
		"round_id": roundID,
		"round":    nextRound,
		"game_key": gameKey,
		"duration": 60,
	})
}

/* =========================
   SUBMIT SCORE (SAFE)
========================= */
func (rc *RoundController) SubmitScore(c *gin.Context) {
	roundID, _ := strconv.Atoi(c.Param("roundID"))

	var req struct {
		PlayerID int         `json:"player_id"`
		Score    int         `json:"score"`
		Meta     interface{} `json:"meta"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	tx, err := rc.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer tx.Rollback()

	/* ===== validate round ===== */
	var status, gameKey, roomCode string
	var roomID int
	err = tx.QueryRow(`
		SELECT r.status, r.game_key, rooms.code, rooms.id
		FROM rounds r
		JOIN rooms ON rooms.id=r.room_id
		WHERE r.id=$1
		FOR UPDATE
	`, roundID).Scan(&status, &gameKey, &roomCode, &roomID)

	if err != nil || status != "playing" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "round not active"})
		return
	}

	/* ===== validate player in room ===== */
	var valid bool
	_ = tx.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM players
			WHERE id=$1 AND room_id=$2 AND connected=true
		)
	`, req.PlayerID, roomID).Scan(&valid)

	if !valid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid player"})
		return
	}

	/* ===== prevent duplicate submit ===== */
	var exists bool
	_ = tx.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM mini_game_results
			WHERE round_id=$1 AND player_id=$2
		)
	`, roundID, req.PlayerID).Scan(&exists)

	if exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "score already submitted"})
		return
	}

	/* ===== save score ===== */
	if _, err := tx.Exec(`
		INSERT INTO mini_game_results
			(round_id, player_id, game_key, score, meta)
		VALUES ($1,$2,$3,$4,$5)
	`, roundID, req.PlayerID, gameKey, req.Score, req.Meta); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "save score failed"})
		return
	}

	/* ===== update total score ===== */
	_, _ = tx.Exec(`
		UPDATE players
		SET total_score = total_score + $1
		WHERE id=$2
	`, req.Score, req.PlayerID)

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit failed"})
		return
	}

	/* ===== realtime update ===== */
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
   END ROUND (WITH BROADCAST)
========================= */
func (rc *RoundController) EndRound(c *gin.Context) {
	roundID := c.Param("roundID")

	var roomCode string
	_ = rc.DB.QueryRow(`
		SELECT rooms.code
		FROM rounds
		JOIN rooms ON rooms.id=rounds.room_id
		WHERE rounds.id=$1
	`, roundID).Scan(&roomCode)

	_, err := rc.DB.Exec(`
		UPDATE rounds
		SET status='finished', ended_at=NOW()
		WHERE id=$1
	`, roundID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "end round failed"})
		return
	}

	rc.Hub.Broadcast <- &ws.Message{
		Room: roomCode,
		Data: ws.MustJSON(gin.H{
			"type":     "round_end",
			"round_id": roundID,
		}),
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
