package routes

import (
	"database/sql"

	"github.com/gin-gonic/gin"
	"thai-festival-backend/controllers"
	"thai-festival-backend/ws"
)

/*
RegisterRoutes
- รวม REST + WebSocket routes ทั้งหมด
- ใช้ RoomController ตัวเดียว (แชร์ DB + Hub)
*/
func RegisterRoutes(
	r *gin.Engine,
	db *sql.DB,
	hub *ws.Hub,
) {

	// =========================
	// Health Check
	// =========================
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "backend is running",
		})
	})

	// =========================
	// Controller
	// =========================
	roomCtrl := controllers.NewRoomController(db, hub)

	// =========================
	// Room REST API
	// =========================
	r.POST("/rooms", roomCtrl.CreateRoom)     // Host สร้างห้อง
	r.POST("/rooms/join", roomCtrl.JoinRoom)  // Player เข้าห้อง
	r.GET("/rooms/:code", roomCtrl.GetRoom)   // ดึงรายชื่อผู้เล่นใน Lobby

	// =========================
	// WebSocket (Lobby realtime)
	// =========================
	r.GET("/ws/:room_code", roomCtrl.ServeWs)
}
