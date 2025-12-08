package main

import (
	"database/sql"
	"fmt"
	"log"

	"thai-festival-backend/controllers"
	"thai-festival-backend/routes"
	"thai-festival-backend/ws"

	_ "github.com/lib/pq"
	"github.com/gin-gonic/gin"
)

var db *sql.DB

func main() {
	
	dbURL := "postgres://postgres:1111@localhost:5432/thai_festival?sslmode=disable"

	var err error
	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("Connect DB error:", err)
	}
	if err = db.Ping(); err != nil {
		log.Fatal("Cannot ping DB:", err)
	}
	fmt.Println(" Connected to PostgreSQL")

	// สร้าง hub เพียงตัวเดียว (shared)
	hub := ws.NewHub()
	go hub.Run()

	// สร้าง factory สำหรับ controller ที่ส่ง hub เข้าไป
	ctrlFactory := func() *controllers.RoomController {
		return controllers.NewRoomController(db, hub)
	}

	// สร้าง router แล้วลงทะเบียน route ทั้งหมด
	r := gin.Default()
	routes.RegisterRoutes(r, db, hub, ctrlFactory)

	fmt.Println("🚀 Backend running on port 8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
