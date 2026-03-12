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

	/* =====================================================
	   ROOM FLOW
	   /rooms/*
	   - create / join / lobby
	===================================================== */

	room := r.Group("/rooms")
	{

		/* ---------- PUBLIC ---------- */

		room.POST("", roomCtrl.CreateRoom)      // create room
		room.GET("", roomCtrl.ListRooms)        // list rooms
		room.GET("/:code", roomCtrl.GetRoom)    // room detail
		room.POST("/join", roomCtrl.JoinRoom)   // join room

		/* ---------- HOST ACTION ---------- */

		room.POST("/:code/start", roomCtrl.StartGame) // start session

	}

	/* =====================================================
	   ROUND FLOW (ROOM CONTEXT)
	   /rooms/:code/round/*
	===================================================== */

	roomRound := r.Group("/rooms/:code/round")
	{

		roomRound.POST("/start", roundCtrl.StartRound)

	}

	/* =====================================================
	   ROUND ENGINE (CORE GAME)
	   /rounds/*
	===================================================== */

	round := r.Group("/rounds")
	{

		round.POST("/:round_id/submit", roundCtrl.SubmitScore)
		round.POST("/:round_id/end", roundCtrl.EndRound)

	}

	/* =====================================================
	   WEBSOCKET
	   /ws/*
	===================================================== */

	wsGroup := r.Group("/ws")
	{

		/* ---------- GLOBAL CHANNEL ---------- */

		wsGroup.GET("/global", func(c *gin.Context) {

			c.Params = append(c.Params, gin.Param{
				Key:   "room_code",
				Value: "global",
			})

			roomCtrl.ServeWs(c)
		})

		/* ---------- ROOM CHANNEL ---------- */

		wsGroup.GET("/:room_code", roomCtrl.ServeWs)

	}

	/* =====================================================
	   FALLBACK 404
	===================================================== */

	r.NoRoute(func(c *gin.Context) {

		c.JSON(http.StatusNotFound, gin.H{
			"error":  "route not found",
			"method": c.Request.Method,
			"path":   c.Request.URL.Path,
		})

	})
}