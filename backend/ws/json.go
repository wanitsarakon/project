package ws

import (
	"encoding/json"
	"log"
)

/* =========================
   JSON HELPER (SHARED)
========================= */
func MustJSON(v any) []byte {
	b, err := json.Marshal(v)
	if err != nil {
		log.Println("❌ MustJSON error:", err)
		return []byte("{}")
	}
	return b
}
