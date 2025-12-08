package routes

import (
	"database/sql"

	"github.com/gin-gonic/gin"
	"thai-festival-backend/controllers"
	"thai-festival-backend/ws"
)

// ControllerFactory creates a controller (allows injecting hub that is shared)
type ControllerFactory func() *controllers.RoomController

// RegisterRoutes registers all routes and passes DB and hub to controllers
func RegisterRoutes(r *gin.Engine, db *sql.DB, hub *ws.Hub, factory ControllerFactory) {
	// health
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "backend is running"})
	})

	// create a controller instance using factory
	ctrl := factory()

	// REST endpoints
	r.POST("/rooms", ctrl.CreateRoom)
	r.POST("/rooms/join", ctrl.JoinRoom)
	r.GET("/rooms/:code", ctrl.GetRoom)

	// score endpoint
	r.POST("/rooms/:code/score", ctrl.PostScore)

	// websocket hub endpoint (lobby)
	r.GET("/ws/:room_code", ctrl.ServeWs)
}
