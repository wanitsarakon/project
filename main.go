package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

type GameResult struct {
	Steps    []string `json:"steps"`
	TimeLeft int      `json:"timeLeft"`
}

type ScoreResponse struct {
	Score int    `json:"score"`
	Grade string `json:"grade"`
	Text  string `json:"text"`
}

var recipe = []string{
	"ถั่วเหลือง",
	"น้ำตาลทรายขาว",
	"กะทิ",
	"ผงวุ้น",
	"สีผสมอาหาร",
	"น้ำเปล่า",
	"เกลือ",
}

// ตรวจสอบว่าไฟล์อยู่ในโฟลเดอร์ปัจจุบัน หรืออยู่ในโฟลเดอร์ frontend
// ในที่นี้ปรับให้ดึงจาก Root หรือโฟลเดอร์ที่รันโปรแกรม
func main() {
	// กำหนดที่อยู่ของไฟล์ Frontend (ตรวจสอบว่าโฟลเดอร์ชื่อ frontend)
	fs := http.FileServer(http.Dir("./frontend"))
	http.Handle("/", fs)

	// API สำหรับตรวจคะแนน
	http.HandleFunc("/check", checkHandler)

	log.Println("Server started at http://localhost:8081")
	if err := http.ListenAndServe(":8081", nil); err != nil {
		log.Fatal(err)
	}
}

func checkHandler(w http.ResponseWriter, r *http.Request) {
	// อนุญาตให้เข้าถึงจาก Domain อื่นได้ (CORS) เพื่อกัน Error
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	if r.Method == http.MethodOptions {
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var result GameResult
	if err := json.NewDecoder(r.Body).Decode(&result); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	score := 0
	correctCount := 0

	for i := 0; i < len(recipe); i++ {
		if i < len(result.Steps) {
			if result.Steps[i] == recipe[i] {
				score += 10
				correctCount++
			}
		}
	}

	if correctCount == len(recipe) && result.TimeLeft > 0 {
		score += 30
	}

	var text string
	var grade string

	if correctCount == len(recipe) {
		text = fmt.Sprintf("โอ้โห! เก่งมากหลาน ทำถูกหมดทั้ง 7 ขั้นตอนเลย รับไป %d คะแนนเต็ม!", score)
		grade = "ยอดเชฟลูกชุบ"
	} else if correctCount >= 4 {
		text = fmt.Sprintf("ทำเสร็จแล้วจ้ะหลาน ได้ไป %d คะแนน... มีบางขั้นตอนที่สลับกันนะ", score)
		grade = "พ่อครัวฝึกหัด"
	} else {
		text = fmt.Sprintf("ยายชิมแล้วรสชาติแปลกๆ นะหลาน... ได้ไป %d คะแนนจ้ะ", score)
		grade = "ต้องพยายามอีกนิด"
	}

	response := ScoreResponse{
		Score: score,
		Grade: grade,
		Text:  text,
	}

	json.NewEncoder(w).Encode(response)
}
