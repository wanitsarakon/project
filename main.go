package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sort"
	"sync"
	"time"
)

// ScoreRecord โครงสร้างข้อมูลสำหรับเก็บคะแนน
type ScoreRecord struct {
	PlayerName string    `json:"player_name"`
	Score      int       `json:"score"`
	Timestamp  time.Time `json:"timestamp"`
}

// Global Variables (ในระบบจริงควรใช้ Database เช่น PostgreSQL หรือ Redis)
var (
	leaderboard []ScoreRecord
	mu          sync.Mutex
)

func main() {
	// 1. เส้นทาง API (Endpoints)
	http.HandleFunc("/api/submit", submitScoreHandler)         // สำหรับบันทึกคะแนน
	http.HandleFunc("/api/leaderboard", getLeaderboardHandler) // สำหรับดูคะแนนสูงสุด

	// 2. จัดการไฟล์ Static (ถ้าต้องการให้รัน HTML ผ่าน Go Server)
	fs := http.FileServer(http.Dir("./frontend"))
	http.Handle("/", fs)

	fmt.Println("🚀 Server started at http://localhost:8084")
	log.Fatal(http.ListenAndServe(":8084", nil))
}

// submitScoreHandler จัดการการรับคะแนนจากเกม
func submitScoreHandler(w http.ResponseWriter, r *http.Request) {
	// ตั้งค่า CORS เพื่อให้ Frontend เรียกใช้งานได้ (กรณีแยกพอร์ต)
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var newScore ScoreRecord
	err := json.NewDecoder(r.Body).Decode(&newScore)
	if err != nil {
		http.Error(w, "Invalid data", http.StatusBadRequest)
		return
	}

	newScore.Timestamp = time.Now()

	// บันทึกลงใน Memory (Thread-safe ด้วย Mutex)
	mu.Lock()
	leaderboard = append(leaderboard, newScore)
	// เรียงลำดับจากคะแนนมากไปน้อย
	sort.Slice(leaderboard, func(i, j int) bool {
		return leaderboard[i].Score > leaderboard[j].Score
	})
	// เก็บไว้แค่ Top 10
	if len(leaderboard) > 10 {
		leaderboard = leaderboard[:10]
	}
	mu.Unlock()

	fmt.Printf("🏆 New High Score! %s: %d\n", newScore.PlayerName, newScore.Score)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

// getLeaderboardHandler ส่งข้อมูลอันดับคะแนนกลับไปให้หน้าเว็บ
func getLeaderboardHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")

	mu.Lock()
	defer mu.Unlock()
	json.NewEncoder(w).Encode(leaderboard)
}
