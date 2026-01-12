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
   START ROUND
========================= */
func (rc *RoundController) StartRound(c *gin.Context) {
	code := c.Param("code")

	/* ===== find room ===== */
	var roomID int
	var roomStatus string
	if err := rc.DB.QueryRow(`
		SELECT id, status FROM rooms WHERE code=$1
	`, code).Scan(&roomID, &roomStatus); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	}

	if roomStatus != "playing" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "room not started"})
		return
	}

	/* ===== close previous round (safety) ===== */
	_, _ = rc.DB.Exec(`
		UPDATE rounds
		SET status='finished', ended_at=NOW()
		WHERE room_id=$1 AND status='playing'
	`, roomID)

	/* ===== next round index (1-based) ===== */
	var nextRound int
	_ = rc.DB.QueryRow(`
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
	if err := rc.DB.QueryRow(`
		INSERT INTO rounds
			(room_id, round_index, game_key, status, started_at)
		VALUES ($1,$2,$3,'playing',NOW())
		RETURNING id
	`, roomID, nextRound, gameKey).Scan(&roundID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create round failed"})
		return
	}

	/* ===== broadcast ===== */
	rc.Hub.Broadcast <- &ws.Message{
		Room: code,
		Data: ws.MustJSON(gin.H{
			"type":        "round_start",
			"round":       nextRound,
			"round_id":    roundID,
			"game_key":    gameKey,
			"duration":    60,
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
   SUBMIT SCORE
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

	/* ===== validate round ===== */
	var status, gameKey, roomCode string
	err := rc.DB.QueryRow(`
		SELECT r.status, r.game_key, rooms.code
		FROM rounds r
		JOIN rooms ON rooms.id=r.room_id
		WHERE r.id=$1
	`, roundID).Scan(&status, &gameKey, &roomCode)

	if err != nil || status != "playing" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "round not active"})
		return
	}

	/* ===== prevent duplicate submit ===== */
	var exists bool
	_ = rc.DB.QueryRow(`
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
	if _, err := rc.DB.Exec(`
		INSERT INTO mini_game_results
			(round_id, player_id, game_key, score, meta)
		VALUES ($1,$2,$3,$4,$5)
	`, roundID, req.PlayerID, gameKey, req.Score, req.Meta); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "save score failed"})
		return
	}

	/* ===== update total score ===== */
	_, _ = rc.DB.Exec(`
		UPDATE players
		SET total_score = total_score + $1
		WHERE id=$2
	`, req.Score, req.PlayerID)

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
   END ROUND
========================= */
func (rc *RoundController) EndRound(c *gin.Context) {
	roundID := c.Param("roundID")

	_, err := rc.DB.Exec(`
		UPDATE rounds
		SET status='finished', ended_at=NOW()
		WHERE id=$1
	`, roundID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "end round failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
