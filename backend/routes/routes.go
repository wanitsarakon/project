package routes

import (
	"database/sql"
	"net/http"

	"thai-festival-backend/controllers"
	"thai-festival-backend/ws"

	"github.com/gin-gonic/gin"
)

/*
=================================================
 REGISTER ROUTES (PRODUCTION FINAL)
-------------------------------------------------
 - REST API
 - WebSocket
 - Room / Round Flow
=================================================
*/
func RegisterRoutes(
	r *gin.Engine,
	db *sql.DB,
	hub *ws.Hub,
) {

	/* =========================
	   SAFETY GUARD
	========================= */
	if r == nil {
		panic("❌ RegisterRoutes: gin.Engine is nil")
	}
	if db == nil {
		panic("❌ RegisterRoutes: database is nil")
	}
	if hub == nil {
		panic("❌ RegisterRoutes: websocket hub is nil")
	}

	/* =========================
	   HEALTH CHECK
	========================= */
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "thai-festival-backend",
		})
	})

	/* =========================
	   CONTROLLERS
	========================= */
	roomCtrl := controllers.NewRoomController(db, hub)
	roundCtrl := controllers.NewRoundController(db, hub)

	/* =========================
	   ROOM FLOW (LOBBY / WAITING)
	   /rooms/*
	========================= */
	room := r.Group("/rooms")
	{
		// 📋 PUBLIC
		room.POST("", roomCtrl.CreateRoom)   // create room
		room.GET("", roomCtrl.ListRooms)     // list all rooms
		room.GET("/:code", roomCtrl.GetRoom) // get room detail
		room.POST("/join", roomCtrl.JoinRoom)

		// ▶ HOST CONTROL
		// start whole game session (host only)
		room.POST("/:code/start", roomCtrl.StartGame)
	}

	/* =========================
	   ROUND FLOW (ROOM CONTEXT)
	   /rooms/:code/round/*
	   → ใช้เริ่มรอบถัดไป
	========================= */
	roomRound := r.Group("/rooms/:code/round")
	{
		roomRound.POST("/start", roundCtrl.StartRound)
	}

	/* =========================
	   ROUND ENGINE (CORE GAME)
	   /rounds/*
	   → submit score / end round
	========================= */
	round := r.Group("/rounds")
	{
		round.POST("/:round_id/submit", roundCtrl.SubmitScore)
		round.POST("/:round_id/end", roundCtrl.EndRound)
	}

	/* =========================
	   WEBSOCKET
	========================= */
	wsGroup := r.Group("/ws")
	{
		// 🌍 GLOBAL realtime
		// ใช้สำหรับ room list / lobby update
		wsGroup.GET("/global", func(c *gin.Context) {
			// force room_code = "global"
			c.Params = append(c.Params, gin.Param{
				Key:   "room_code",
				Value: "global",
			})
			roomCtrl.ServeWs(c)
		})

		// 🏟 ROOM realtime
		// ใช้สำหรับ festival map / score / round state
		wsGroup.GET("/:room_code", roomCtrl.ServeWs)
	}

	/* =========================
	   FALLBACK (404)
	========================= */
	r.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{
			"error":  "route not found",
			"method": c.Request.Method,
			"path":   c.Request.URL.Path,
		})
	})
}
