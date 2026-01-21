package ws

import (
	"encoding/json"
	"log"
	"reflect"
	"runtime/debug"
)

/* =========================
   JSON HELPER (PRODUCTION FINAL)
   - Shared: WS / Hub / Controller
   - panic-safe
   - goroutine-safe
   - never return nil
   - debug-friendly
========================= */

// immutable empty JSON (READ-ONLY)
var emptyJSON = []byte("{}")

/*
MustJSON
------------------------------------------------
- marshal เป็น JSON
- ใช้ใน WebSocket / Broadcast / goroutine
- ❌ ไม่มี panic หลุด
- ❌ ไม่มี nil return
- error หรือ panic → return {}
*/
func MustJSON(v any) []byte {

	// fast path: nil
	if v == nil {
		return emptyJSON
	}

	// fast path: already JSON
	switch t := v.(type) {
	case []byte:
		if len(t) == 0 {
			return emptyJSON
		}
		return t
	case json.RawMessage:
		if len(t) == 0 {
			return emptyJSON
		}
		return []byte(t)
	}

	defer func() {
		if r := recover(); r != nil {
			log.Printf(
				"[MustJSON] ❌ panic: %v | type=%v\n%s",
				r,
				reflect.TypeOf(v),
				debug.Stack(),
			)
		}
	}()

	b, err := json.Marshal(v)
	if err != nil {
		log.Printf(
			"[MustJSON] ❌ marshal error: %v | type=%v",
			err,
			reflect.TypeOf(v),
		)
		return emptyJSON
	}

	// safety guard
	if len(b) == 0 {
		return emptyJSON
	}

	return b
}

/*
TryJSON
------------------------------------------------
- marshal เป็น JSON
- caller handle error เอง
- เหมาะกับ REST API / HTTP response
- ❌ ไม่ panic
*/
func TryJSON(v any) ([]byte, error) {

	// fast path: nil
	if v == nil {
		return emptyJSON, nil
	}

	// fast path: already JSON
	switch t := v.(type) {
	case []byte:
		if len(t) == 0 {
			return emptyJSON, nil
		}
		return t, nil
	case json.RawMessage:
		if len(t) == 0 {
			return emptyJSON, nil
		}
		return []byte(t), nil
	}

	defer func() {
		if r := recover(); r != nil {
			log.Printf(
				"[TryJSON] ❌ panic: %v | type=%v\n%s",
				r,
				reflect.TypeOf(v),
				debug.Stack(),
			)
		}
	}()

	b, err := json.Marshal(v)
	if err != nil {
		log.Printf(
			"[TryJSON] ❌ marshal error: %v | type=%v",
			err,
			reflect.TypeOf(v),
		)
		return nil, err
	}

	if len(b) == 0 {
		return emptyJSON, nil
	}

	return b, nil
}
