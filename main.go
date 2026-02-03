package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

type AnswerSubmission struct {
	Answers []int `json:"answers"`
}

type ScoreResponse struct {
	Score   int    `json:"score"`
	Correct []bool `json:"correct"`
}

// เฉลยลำดับท่า 1-5
var correctSequence = []int{1, 2, 3, 4, 5}

func main() {
	// Serve Static Files
	fs := http.FileServer(http.Dir("./frontend"))
	http.Handle("/", fs)

	// API Endpoint
	http.HandleFunc("/api/check-score", checkScoreHandler)

	fmt.Println("🥊 Server starting at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func checkScoreHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var sub AnswerSubmission
	err := json.NewDecoder(r.Body).Decode(&sub)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	score := 0
	results := make([]bool, 5)

	for i, ansID := range sub.Answers {
		if i < len(correctSequence) && ansID == correctSequence[i] {
			score += 10
			results[i] = true
		} else {
			results[i] = false
		}
	}

	resp := ScoreResponse{
		Score:   score,
		Correct: results,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
