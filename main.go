package main

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"
)

type PatternResponse struct {
	Pattern []string `json:"pattern"`
	Limit   int      `json:"limit"`
}

func getPatternHandler(w http.ResponseWriter, r *http.Request) {
	colors := []string{"white", "red", "yellow", "green", "purple"} // ให้ครบ 5 สีตามรูป
	s := rand.NewSource(time.Now().UnixNano())
	rng := rand.New(s)

	pattern := make([]string, 4)
	for i := 0; i < 4; i++ {
		pattern[i] = colors[rng.Intn(len(colors))]
	}

	res := PatternResponse{
		Pattern: pattern,
		Limit:   28,
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(res)
}

func main() {
	http.HandleFunc("/api/pattern", getPatternHandler)

	// แก้ไขบรรทัดนี้: ชี้ไปที่โฟลเดอร์ frontend ที่มี index.html อยู่
	fs := http.FileServer(http.Dir("./frontend")) 
	http.Handle("/", fs)

	port := ":8089"
	fmt.Printf("🚀 Server started at http://localhost%s\n", port)
	
	err := http.ListenAndServe(port, nil)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
	}
}