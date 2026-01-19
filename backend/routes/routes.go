package routes

import (
	"database/sql"
	"net/http"

	"thai-festival-backend/controllers"
	"thai-festival-backend/ws"

	"github.com/gin-gonic/gin"
)

/* =========================
   REGISTER ROUTES (FINAL)
========================= */
func RegisterRoutes(
	r *gin.Engine,
	db *sql.DB,
	hub *ws.Hub,
) {

	// =========================
	// SAFETY GUARD
	// =========================
	if r == nil || db == nil || hub == nil {
		panic("❌ RegisterRoutes: nil dependency")
	}

	/* =========================
	   HEALTH CHECK
	========================= */
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"service": "thai-festival-backend",
		})
	})

	/* =========================
	   CONTROLLERS
	========================= */
	roomCtrl := controllers.NewRoomController(db, hub)
	roundCtrl := controllers.NewRoundController(db, hub)

	/* =========================
	   ROOM FLOW
	   /rooms/*
	========================= */
	room := r.Group("/rooms")
	{
		// 📋 public
		room.POST("", roomCtrl.CreateRoom)
		room.GET("", roomCtrl.ListRooms)
		room.GET("/:code", roomCtrl.GetRoom)
		room.POST("/join", roomCtrl.JoinRoom)

		// ▶ host control
		room.POST("/:code/start", roomCtrl.StartGame)
		room.POST("/:code/end", roomCtrl.EndGame)

		// ⚙ engine / internal
		room.POST("/:code/round/start", roundCtrl.StartRound)
	}

	/* =========================
	   ROUND ENGINE
	   /rounds/*
	========================= */
	round := r.Group("/rounds")
	{
		round.POST("/:round_id/submit", roundCtrl.SubmitScore)
		round.POST("/:round_id/end", roundCtrl.EndRound)
	}

	/* =========================
	   WEBSOCKET
	   /ws/*
	========================= */
	wsGroup := r.Group("/ws")
	{
		// 🌍 global realtime (room list / lobby update)
		wsGroup.GET("/global", roomCtrl.ServeWs)

		// 🏟 room realtime
		wsGroup.GET("/:room_code", roomCtrl.ServeWs)
	}

	/* =========================
	   FALLBACK (DEBUG FRIENDLY)
	========================= */
	r.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{
			"error":  "route not found",
			"method": c.Request.Method,
			"path":   c.Request.URL.Path,
		})
	})
}
