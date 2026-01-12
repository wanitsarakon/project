package routes

import (
	"database/sql"
	"net/http"

	"thai-festival-backend/controllers"
	"thai-festival-backend/ws"

	"github.com/gin-gonic/gin"
)

/* =========================
   REGISTER ROUTES
========================= */
func RegisterRoutes(
	r *gin.Engine,
	db *sql.DB,
	hub *ws.Hub,
) {

	/* =========================
	   HEALTH CHECK
	========================= */
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "backend is running",
		})
	})

	/* =========================
	   CONTROLLERS
	========================= */
	roomCtrl := controllers.NewRoomController(db, hub)
	roundCtrl := controllers.NewRoundController(db, hub)

	/* =========================
	   ROOM FLOW
	========================= */
	r.POST("/rooms", roomCtrl.CreateRoom)
	r.GET("/rooms", roomCtrl.ListRooms)
	r.GET("/rooms/:code", roomCtrl.GetRoom)
	r.POST("/rooms/join", roomCtrl.JoinRoom)

	// ▶ Host เริ่มเกม (เริ่ม game อย่างเดียว)
	r.POST("/rooms/:code/start", roomCtrl.StartGame)

	// 🏁 จบเกม
	r.POST("/rooms/:code/end", roomCtrl.EndGame)

	/* =========================
	   ROUND ENGINE
	========================= */
	// 🔥 internal use (frontend ไม่เรียกตรง)
	r.POST("/rooms/:code/round/start", roundCtrl.StartRound)
	r.POST("/rounds/:roundID/submit", roundCtrl.SubmitScore)
	r.POST("/rounds/:roundID/end", roundCtrl.EndRound)

	/* =========================
	   WEBSOCKET
	========================= */

	// 🌍 global realtime
	r.GET("/ws/global", func(c *gin.Context) {
		c.Set("room_code", "global")
		roomCtrl.ServeWs(c)
	})

	// 🏟 room realtime
	r.GET("/ws/:room_code", roomCtrl.ServeWs)

	/* =========================
	   FALLBACK
	========================= */
	r.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "route not found",
		})
	})
}
