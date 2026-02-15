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

var recipe = []string{"RED", "YELLOW", "BLUE"}

func main() {
	// ชี้ไปยังโฟลเดอร์ frontend
	fs := http.FileServer(http.Dir("./frontend"))
	// ตั้งค่า Alias /static/ ให้ตรงกับในไฟล์ JS/HTML
	http.Handle("/static/", http.StripPrefix("/static/", fs))
	http.Handle("/", fs)

	http.HandleFunc("/check", checkHandler)

	log.Println("🎡 Server started at http://localhost:8088")
	if err := http.ListenAndServe(":8088", nil); err != nil {
		log.Fatal(err)
	}
}

func checkHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	if r.Method == http.MethodOptions {
		return
	}

	var result GameResult
	if err := json.NewDecoder(r.Body).Decode(&result); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	score := 0
	correctCount := 0
	for _, color := range result.Steps {
		if correctCount < len(recipe) && color == recipe[correctCount] {
			score += 100
			correctCount++
		} else if color == "PURPLE" {
			score -= 150
		} else if color == "GREEN" {
			score += 200
		}
	}

	response := ScoreResponse{
		Score: score,
		Grade: "ผลการเล่น",
		Text:  fmt.Sprintf("ได้ไป %d คะแนนจ้า", score),
	}
	json.NewEncoder(w).Encode(response)
}