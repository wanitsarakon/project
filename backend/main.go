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

	// =========================
	// Database
	// =========================
	dbURL := "postgres://postgres:1111@localhost:5432/thai_festival?sslmode=disable"

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("❌ Connect DB error:", err)
	}

	if err := db.Ping(); err != nil {
		log.Fatal("❌ Cannot ping DB:", err)
	}

	fmt.Println("✅ Connected to PostgreSQL")

	// =========================
	// WebSocket Hub (shared)
	// =========================
	hub := ws.NewHub()
	go hub.Run()

	// =========================
	// Gin Engine
	// =========================
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// =========================
	// CORS (สมบูรณ์)
	// =========================
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:5173", // Vite dev
		},
		AllowMethods: []string{
			"GET",
			"POST",
			"PUT",
			"PATCH",
			"DELETE",
			"OPTIONS",
		},
		AllowHeaders: []string{
			"Origin",
			"Content-Type",
			"Authorization",
		},
		ExposeHeaders: []string{
			"Content-Length",
		},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// =========================
	// Register Routes
	// =========================
	routes.RegisterRoutes(r, db, hub)

	// =========================
	// Start Server
	// =========================
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Println("🚀 Backend running on port", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
