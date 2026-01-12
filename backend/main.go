package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	"thai-festival-backend/routes"
	"thai-festival-backend/ws"

	_ "github.com/lib/pq"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {

	/* =========================
	   Database
	========================= */
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:1111@localhost:5432/thai_festival?sslmode=disable"
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("❌ Connect DB error:", err)
	}

	// 🔧 Connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(30 * time.Minute)

	if err := db.Ping(); err != nil {
		log.Fatal("❌ Cannot ping DB:", err)
	}

	fmt.Println("✅ Connected to PostgreSQL")

	/* =========================
	   🔥 RESET STALE STATE (SAFE)
	========================= */
	if err := resetStaleState(db); err != nil {
		log.Println("⚠️ Reset stale state warning:", err)
	}

	defer func() {
		_ = db.Close()
		fmt.Println("🛑 DB closed")
	}()

	/* =========================
	   WebSocket Hub
	========================= */
	hub := ws.NewHub(db)
	go hub.Run()
	fmt.Println("✅ WebSocket Hub running")

	// 🔥 Auto cleanup
	ws.StartAutoCleanup(db, hub)
	fmt.Println("🧹 AutoCleanup service running")

	/* =========================
	   Gin Engine
	========================= */
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	/* =========================
	   CORS
	========================= */
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:5173",
		},
		AllowMethods: []string{
			"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS",
		},
		AllowHeaders: []string{
			"Origin", "Content-Type", "Authorization",
		},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	/* =========================
	   Routes
	========================= */
	routes.RegisterRoutes(r, db, hub)

	/* =========================
	   Start Server
	========================= */
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Println("🚀 Backend running on port", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("❌ Server error:", err)
	}
}

/* =========================
   RESET STALE STATE (SAFE)
   - ใช้เฉพาะตอน restart
   - ไม่เตะผู้เล่นที่ยัง fresh
========================= */
func resetStaleState(db *sql.DB) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// mark stale player offline (> 2 นาที)
	if _, err := tx.Exec(`
		UPDATE players
		SET connected = false
		WHERE connected = true
		  AND last_seen_at < NOW() - INTERVAL '2 minutes'
	`); err != nil {
		return err
	}

	// reset ห้องที่เล่นอยู่แต่ไม่มี player online
	if _, err := tx.Exec(`
		UPDATE rooms r
		SET status = 'waiting'
		WHERE status = 'playing'
		  AND NOT EXISTS (
			SELECT 1 FROM players p
			WHERE p.room_id = r.id
			  AND p.connected = true
		  )
	`); err != nil {
		return err
	}

	return tx.Commit()
}
