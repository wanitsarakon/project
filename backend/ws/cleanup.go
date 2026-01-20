package ws

import (
	"context"
	"database/sql"
	"log"
	"time"
)

/* =========================
   AUTO CLEANUP SERVICE
========================= */
func StartAutoCleanup(
	ctx context.Context,
	db *sql.DB,
	hub *Hub,
) {
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()

		log.Println("🧹 AutoCleanup service started")

		for {
			select {
			case <-ctx.Done():
				log.Println("🛑 AutoCleanup stopped")
				return

			case <-ticker.C:
				runCleanupOnce(ctx, db, hub)
			}
		}
	}()
}

/* =========================
   RUN CLEANUP (ONCE)
========================= */
func runCleanupOnce(
	parentCtx context.Context,
	db *sql.DB,
	hub *Hub,
) {
	ctx, cancel := context.WithTimeout(parentCtx, 5*time.Second)
	defer cancel()

	type broadcastEvent struct {
		room string
		data []byte
	}

	var broadcasts []broadcastEvent
	anyChange := false

	/* =========================
	   1️⃣ HEARTBEAT TIMEOUT
	========================= */
	rows, err := db.QueryContext(ctx, `
		SELECT p.id, p.room_id, r.code
		FROM players p
		JOIN rooms r ON r.id = p.room_id
		WHERE p.connected = true
		  AND p.last_seen_at < NOW() - INTERVAL '60 seconds'
	`)
	if err != nil {
		if ctx.Err() == nil {
			log.Println("❌ cleanup heartbeat:", err)
		}
		return
	}
	defer rows.Close()

	handledRooms := make(map[int]bool)

	for rows.Next() {
		var playerID, roomID int
		var roomCode string

		if err := rows.Scan(&playerID, &roomID, &roomCode); err != nil {
			continue
		}

		anyChange = true

		/* ---- mark disconnected ---- */
		_, _ = db.ExecContext(ctx, `
			UPDATE players
			SET connected=false
			WHERE id=$1
		`, playerID)

		/* ---- notify player disconnect ---- */
		broadcasts = append(broadcasts, broadcastEvent{
			room: roomCode,
			data: MustJSON(map[string]any{
				"type":      "player_disconnect",
				"player_id": playerID,
			}),
		})

		/* ---- TEAM UPDATE (ส่งทีมใหม่) ---- */
		teams := fetchTeams(ctx, db, roomID)

		broadcasts = append(broadcasts, broadcastEvent{
			room: roomCode,
			data: MustJSON(map[string]any{
				"type":  "team_update",
				"teams": teams,
			}),
		})

		/* ---- HOST TRANSFER ---- */
		if !handledRooms[roomID] {
			if newHostID := transferHost(ctx, db, roomID); newHostID > 0 {
				broadcasts = append(broadcasts, broadcastEvent{
					room: roomCode,
					data: MustJSON(map[string]any{
						"type":      "host_transfer",
						"player_id": newHostID,
					}),
				})
			}
			handledRooms[roomID] = true
		}
	}

	/* =========================
	   2️⃣ CLEAN EMPTY ROOMS
	========================= */
	_, _ = db.ExecContext(ctx, `
		DELETE FROM rooms
		WHERE status IN ('waiting','finished')
		  AND NOT EXISTS (
			SELECT 1 FROM players
			WHERE room_id = rooms.id
			  AND connected = true
		  )
	`)

	/* =========================
	   3️⃣ BROADCAST EVENTS
	========================= */
	for _, b := range broadcasts {
		select {
		case hub.Broadcast <- &Message{
			Room: b.room,
			Data: b.data,
		}:
		default:
		}
	}

	/* =========================
	   4️⃣ GLOBAL ROOM UPDATE
	========================= */
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

/* =========================
   FETCH TEAM MEMBERS
========================= */
func fetchTeams(
	ctx context.Context,
	db *sql.DB,
	roomID int,
) []map[string]any {

	rows, err := db.QueryContext(ctx, `
		SELECT id, name, team, total_score
		FROM players
		WHERE room_id=$1 AND connected=true
		ORDER BY team, id
	`, roomID)
	if err != nil {
		return nil
	}
	defer rows.Close()

	var teams []map[string]any
	for rows.Next() {
		var id, score int
		var name, team sql.NullString

		_ = rows.Scan(&id, &name, &team, &score)

		teams = append(teams, map[string]any{
			"id":    id,
			"name":  name.String,
			"team":  team.String,
			"score": score,
		})
	}

	return teams
}

/* =========================
   HOST TRANSFER
========================= */
func transferHost(
	ctx context.Context,
	db *sql.DB,
	roomID int,
) int {

	var oldHostID int
	_ = db.QueryRowContext(ctx, `
		SELECT id FROM players
		WHERE room_id=$1 AND is_host=true
	`, roomID).Scan(&oldHostID)

	var newHostID int
	err := db.QueryRowContext(ctx, `
		SELECT id FROM players
		WHERE room_id=$1 AND connected=true
		ORDER BY last_seen_at DESC
		LIMIT 1
	`, roomID).Scan(&newHostID)

	if err != nil || newHostID == oldHostID {
		return 0
	}

	_, _ = db.ExecContext(ctx, `
		UPDATE players
		SET is_host = (id = $1)
		WHERE room_id=$2
	`, newHostID, roomID)

	return newHostID
}
