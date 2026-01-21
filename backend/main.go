package main

import (
	"context"
	"database/sql"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"thai-festival-backend/routes"
	"thai-festival-backend/ws"

	_ "github.com/lib/pq"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {

	/* =========================
	   DATABASE
	========================= */
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:1111@localhost:5432/thai_festival?sslmode=disable"
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("❌ Open DB error:", err)
	}

	// 🔒 production-safe pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(30 * time.Minute)

	if err := db.Ping(); err != nil {
		log.Fatal("❌ Cannot ping DB:", err)
	}

	log.Println("✅ Connected to PostgreSQL")

	/* =========================
	   RESET STALE STATE (BOOT)
	========================= */
	if err := resetStaleState(db); err != nil {
		log.Println("⚠️ Reset stale state warning:", err)
	} else {
		log.Println("🧹 Stale state reset completed")
	}

	/* =========================
	   WEBSOCKET HUB
	========================= */
	hub := ws.NewHub(db)
	go hub.Run()
	log.Println("✅ WebSocket Hub running")

	/* =========================
	   AUTO CLEANUP SERVICE
	========================= */
	cleanupCtx, cleanupCancel := context.WithCancel(context.Background())
	ws.StartAutoCleanup(cleanupCtx, db, hub)
	log.Println("🧹 AutoCleanup service running")

	/* =========================
	   GIN ENGINE
	========================= */
	gin.SetMode(gin.ReleaseMode)
	gin.DisableConsoleColor()

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	// 🔒 trusted proxy (important for prod / ws)
	if err := r.SetTrustedProxies(nil); err != nil {
		log.Println("⚠️ SetTrustedProxies warning:", err)
	}

	/* =========================
	   CORS
	========================= */
	allowOrigin := os.Getenv("CORS_ORIGIN")
	if allowOrigin == "" {
		allowOrigin = "http://localhost:5173"
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{allowOrigin},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	/* =========================
	   ROUTES
	========================= */
	routes.RegisterRoutes(r, db, hub)

	/* =========================
	   HTTP SERVER
	========================= */
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	baseCtx, baseCancel := context.WithCancel(context.Background())

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
		BaseContext: func(net.Listener) context.Context {
			return baseCtx
		},
	}

	go func() {
		log.Println("🚀 Backend running on port", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Println("❌ Server error:", err)
		}
	}()

	/* =========================
	   GRACEFUL SHUTDOWN
	========================= */
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Shutting down server...")

	// 1️⃣ STOP BACKGROUND SERVICES
	cleanupCancel()
	baseCancel()

	// 2️⃣ SHUTDOWN HTTP (stop new requests / WS)
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Println("⚠️ HTTP shutdown error:", err)
	}

	// 3️⃣ CLOSE DB
	if err := db.Close(); err != nil {
		log.Println("⚠️ DB close error:", err)
	}

	log.Println("✅ Server stopped cleanly")
}

/* =========================
   RESET STALE STATE
========================= */
func resetStaleState(db *sql.DB) error {

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	// 1️⃣ mark stale players offline
	if _, err := tx.ExecContext(ctx, `
		UPDATE players
		SET connected = false
		WHERE connected = true
		  AND last_seen_at < NOW() - INTERVAL '2 minutes'
	`); err != nil {
		return err
	}

	// 2️⃣ reset broken rooms
	if _, err := tx.ExecContext(ctx, `
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
