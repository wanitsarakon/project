package ws

import (
	"database/sql"
	"log"
	"time"
)

/* =========================
   AUTO CLEANUP SERVICE
========================= */
func StartAutoCleanup(db *sql.DB, hub *Hub) {
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()

		log.Println("🧹 AutoCleanup service started")

		for range ticker.C {

			var anyChange bool

			// 1️⃣ HEARTBEAT TIMEOUT
			rows, err := db.Query(`
				SELECT id, room_id
				FROM players
				WHERE connected = true
				  AND last_seen_at < NOW() - INTERVAL '60 seconds'
			`)
			if err != nil {
				log.Println("❌ heartbeat query error:", err)
				continue
			}

			type timeoutPlayer struct {
				playerID int
				roomID   int
			}

			var timeouts []timeoutPlayer
			for rows.Next() {
				var p timeoutPlayer
				_ = rows.Scan(&p.playerID, &p.roomID)
				timeouts = append(timeouts, p)
			}
			rows.Close()

			for _, p := range timeouts {
				anyChange = true

				_, _ = db.Exec(`
					UPDATE players
					SET connected = false
					WHERE id = $1
				`, p.playerID)

				roomCode := getRoomCode(db, p.roomID)
				if roomCode == "" {
					continue
				}

				select {
				case hub.Broadcast <- &Message{
					Room: roomCode,
					Data: MustJSON(map[string]any{
						"type":      "player_disconnect",
						"player_id": p.playerID,
					}),
				}:
				default:
				}

				handleHostTransfer(db, hub, p.roomID, roomCode)
			}

			// 2️⃣ DELETE EMPTY ROOMS
			res, err := db.Exec(`
				DELETE FROM rooms
				WHERE status IN ('waiting','finished')
				  AND id NOT IN (
					SELECT DISTINCT room_id
					FROM players
					WHERE connected = true
				  )
			`)
			if err != nil {
				log.Println("❌ cleanup empty rooms:", err)
			} else if n, _ := res.RowsAffected(); n > 0 {
				anyChange = true
			}

			// 3️⃣ GLOBAL UPDATE
			if anyChange {
				select {
				case hub.Broadcast <- &Message{
					Room: "global",
					Data: MustJSON(map[string]any{
						"type": "room_update",
					}),
				}:
				default:
				}
			}
		}
	}()
}

/* =========================
   HOST TRANSFER
========================= */
func handleHostTransfer(db *sql.DB, hub *Hub, roomID int, roomCode string) {
	var oldHostID int
	if err := db.QueryRow(`
		SELECT id FROM players
		WHERE room_id=$1 AND is_host=true
	`, roomID).Scan(&oldHostID); err != nil {
		return
	}

	var newHostID int
	err := db.QueryRow(`
		SELECT id FROM players
		WHERE room_id=$1 AND connected=true
		ORDER BY last_seen_at DESC
		LIMIT 1
	`, roomID).Scan(&newHostID)

	if err != nil || newHostID == oldHostID {
		return
	}

	_, _ = db.Exec(`
		UPDATE players
		SET is_host = CASE WHEN id=$1 THEN true ELSE false END
		WHERE room_id=$2
	`, newHostID, roomID)

	_, _ = db.Exec(`
		UPDATE rooms
		SET host_player_id=$1
		WHERE id=$2
	`, newHostID, roomID)

	select {
	case hub.Broadcast <- &Message{
		Room: roomCode,
		Data: MustJSON(map[string]any{
			"type":      "host_transfer",
			"player_id": newHostID,
		}),
	}:
	default:
	}
}

/* =========================
   ROOM CODE HELPER
========================= */
func getRoomCode(db *sql.DB, roomID int) string {
	var code string

	err := db.QueryRow(
		`SELECT code FROM rooms WHERE id=$1`,
		roomID,
	).Scan(&code)

	if err != nil {
		return ""
	}

	return code
}
