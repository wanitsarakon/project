package ws

import (
	"encoding/json"
	"log"
	"reflect"
)

/* =========================
   JSON HELPER (PRODUCTION FINAL)
   - WS / API shared
   - no panic
   - safe fallback
   - minimal allocation
   - production logging
========================= */

// reuse slice (read-only)
var emptyJSON = []byte(`{}`)

/*
MustJSON
- marshal เป็น JSON
- ไม่มี panic หลุด
- error / panic → return {}
- ใช้ใน goroutine / WS / broadcast ได้ปลอดภัย
*/
func MustJSON(v any) []byte {

	// quick path: nil
	if v == nil {
		return emptyJSON
	}

	defer func() {
		if r := recover(); r != nil {
			log.Printf(
				"❌ MustJSON panic: %v (type=%v)",
				r,
				reflect.TypeOf(v),
			)
		}
	}()

	b, err := json.Marshal(v)
	if err != nil {
		log.Printf(
			"❌ MustJSON marshal error: %v (type=%v)",
			err,
			reflect.TypeOf(v),
		)
		return emptyJSON
	}

	// guard: empty / invalid JSON
	if len(b) == 0 {
		return emptyJSON
	}

	return b
}

/*
TryJSON
- ใช้กรณีต้องการ handle error เอง
- ไม่ panic
- suitable for REST API response
*/
func TryJSON(v any) ([]byte, error) {

	if v == nil {
		return emptyJSON, nil
	}

	defer func() {
		if r := recover(); r != nil {
			log.Printf(
				"❌ TryJSON panic: %v (type=%v)",
				r,
				reflect.TypeOf(v),
			)
		}
	}()

	return json.Marshal(v)
}
