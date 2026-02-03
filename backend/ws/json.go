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
   - never return nil slice
   - debug-friendly
========================= */

// immutable empty JSON (READ-ONLY, NEVER MODIFY)
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

	/* ---------- FAST PATH ---------- */

	if v == nil {
		return emptyJSON
	}

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

	/* ---------- PANIC SAFE ---------- */

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

	/* ---------- MARSHAL ---------- */

	b, err := json.Marshal(v)
	if err != nil {
		log.Printf(
			"[MustJSON] ❌ marshal error: %v | type=%v",
			err,
			reflect.TypeOf(v),
		)
		return emptyJSON
	}

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
- ❌ ไม่คืน nil slice
*/
func TryJSON(v any) ([]byte, error) {

	/* ---------- FAST PATH ---------- */

	if v == nil {
		return emptyJSON, nil
	}

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

	/* ---------- PANIC SAFE ---------- */

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

	/* ---------- MARSHAL ---------- */

	b, err := json.Marshal(v)
	if err != nil {
		log.Printf(
			"[TryJSON] ❌ marshal error: %v | type=%v",
			err,
			reflect.TypeOf(v),
		)
		return emptyJSON, err
	}

	if len(b) == 0 {
		return emptyJSON, nil
	}

	return b, nil
}
