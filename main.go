package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

type Character struct {
	Name      string  `json:"name"`
	Power     float64 `json:"power"`
	Speed     float64 `json:"speed"`
	Note      string  `json:"note"`
	Image     string  `json:"image"`
	PullImage string  `json:"pullImage"`
}

func main() {
	fs := http.FileServer(http.Dir("./frontend"))
	http.Handle("/", fs)

	http.HandleFunc("/api/characters", func(w http.ResponseWriter, r *http.Request) {
		chars := []Character{
			{Name: "ผู้ชายผอม", Power: 2.0, Speed: 1.8, Note: "กดรัวได้ไว", Image: "skinny.png", PullImage: "skinny_pull.png"},
			{Name: "หนุ่มนักกล้าม", Power: 5.0, Speed: 0.6, Note: "แรงสูงมาก", Image: "buff.png", PullImage: "buff_pull.png"},
			{Name: "คนแก่เเต่เท่", Power: 3.5, Speed: 0.4, Note: "เก๋าเเรงเยอะเเต่เหนื่อยง่าย", Image: "old.png", PullImage: "old_pull.png"},
			{Name: "เด็ก", Power: 1.0, Speed: 1.4, Note: "เร็วแต่แรงน้อย", Image: "kid.png", PullImage: "kid_pull.png"},
			{Name: "ผู้หญิงธรรมดา", Power: 2.5, Speed: 1.0, Note: "แรงน้อยกว่าผู้ชาย", Image: "woman.png", PullImage: "woman_pull.png"},
			{Name: "ผู้ชายธรรมดา", Power: 4.0, Speed: 1.1, Note: "สมดุล", Image: "man.png", PullImage: "man_pull.png"},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(chars)
	})

	fmt.Println("🚀 Server running at http://localhost:8090")
	log.Fatal(http.ListenAndServe(":8090", nil))
}