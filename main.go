package main

import (
	"encoding/json"
	"net/http"
)

type Item struct {
	ID   string  `json:"id"`
	Name string  `json:"name"`
	X    float64 `json:"x"`
	Y    float64 `json:"y"`
	W    float64 `json:"w"`
	H    float64 `json:"h"` // แก้ไขจาก h เป็น H เรียบร้อย
}

type Ghost struct {
	ID    string   `json:"id"`
	Req   []string `json:"req"`
	Story string   `json:"story"`
	Fail  string   `json:"fail"`
}

func getGameData(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")

	data := map[string]interface{}{
		"rooms": []map[string]interface{}{
			{
				"id": "living", "name": "Living Room", "bg": "images/living.png",
				"items": []Item{
					{ID: "key", Name: "กุญแจ", X: 42, Y: 63, W: 6, H: 5},
					{ID: "scissors", Name: "กรรไกร", X: 90, Y: 67, W: 6, H: 7},
				},
			},
			{
				"id": "bathroom", "name": "Bathroom", "bg": "images/bathroom.png",
				"items": []Item{
					{ID: "blade", Name: "ใบมีด", X: 21, Y: 90, W: 5, H: 3},
					{ID: "med", Name: "ขวดยา", X: 92, Y: 8, W: 4, H: 8},
				},
			},
			{
				"id": "bedroom", "name": "Bedroom", "bg": "images/bedroom.png",
				"items": []Item{
					{ID: "gun", Name: "ปืน", X: 15, Y: 65, W: 8, H: 12},
					{ID: "coin", Name: "เหรียญ", X: 85, Y: 88, W: 6, H: 6},
				},
			},
			{
				"id": "kid", "name": "Kid Room", "bg": "images/kid.png",
				"items": []Item{
					{ID: "toy", Name: "ของเล่น", X: 89, Y: 88, W: 8, H: 10},
					{ID: "lighter", Name: "ไฟแช็ก", X: 46, Y: 28, W: 6, H: 5},
				},
			},
		},
		"ghosts": []Ghost{
			{ID: "woman", Req: []string{"key", "scissors"}, Story: "เสียงฝีเท้าใกล้เข้ามา... ฉันพยายามไขประตูแต่มันไม่ขยับ ฉันแค่หยิบสิ่งนี้มาป้องกันตัว แต่ก็ไม่ทันเสียแล้ว", Fail: "มืดเหลือเกิน... เธอหาของชิ้นนั้นไม่เจอสินะ... ฉันคงต้องติดอยู่ที่นี่ต่อไป"},
			{ID: "girl", Req: []string{"toy", "lighter"}, Story: "แม่บอกว่าอย่าจุดไฟเล่น... แต่แสงมันสวย ฉันกอดตุ๊กตาแน่นมาก แล้วทุกอย่างก็... มืดไปเลย", Fail: "เธอหาของชิ้นนั้นไม่เจอสินะ... ฉันคงต้องติดอยู่ที่นี่ต่อไป"},
			{ID: "man", Req: []string{"blade", "med"}, Story: "ผมไม่ได้อยากตาย... แค่อยากให้ความเจ็บปวดนี้จบลง มือหนึ่งถือขวด อีกมือคว้าของคมกริบ... แล้วสติก็หลุดลอยไป", Fail: "ความเจ็บปวดนี้ยังไม่หายไป... เธอหาของชิ้นนั้นไม่เจอสินะ..."},
			{ID: "maid", Req: []string{"gun", "coin"}, Story: "ดิฉันแค่จะเก็บเศษเงินคืนนายท่าน... แต่กระบอกเหล็กเย็นเฉียบกลับจ่อที่หลัง เสียงดังสนั่นนั่นทำให้ทุกอย่างดับวูบ", Fail: "ความเข้าใจผิดนี้ยังคงอยู่... เธอหาของชิ้นนั้นไม่เจอสินะ..."},
		},
	}
	json.NewEncoder(w).Encode(data)
}

func main() {
	// 1. เส้นทางสำหรับเรียกข้อมูล JSON (API)
	http.HandleFunc("/api/data", getGameData)

	// 2. เส้นทางสำหรับแสดงหน้าเว็บ Frontend (Serve Static Files)
	// โค้ดนี้จะไปอ่านไฟล์จากโฟลเดอร์ "frontend" มาแสดงผล
	fs := http.FileServer(http.Dir("./frontend"))
	http.Handle("/", fs)

	println("Server is running on http://localhost:8085")
	http.ListenAndServe(":8085", nil)
}
