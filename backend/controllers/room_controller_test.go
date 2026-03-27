package controllers

import (
	"database/sql/driver"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"testing"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"thai-festival-backend/ws"
)

func newRoomControllerTest(t *testing.T) (*RoomController, sqlmock.Sqlmock, func()) {
	t.Helper()

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}

	controller := &RoomController{
		DB:  db,
		Hub: &ws.Hub{Broadcast: make(chan *ws.Message, 8)},
	}

	cleanup := func() {
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("unmet sql expectations: %v", err)
		}
		_ = db.Close()
	}

	return controller, mock, cleanup
}

func queryPattern(query string) string {
	return regexp.QuoteMeta(strings.TrimSpace(query))
}

func mustJSONBody(t *testing.T, body io.Reader) map[string]any {
	t.Helper()

	var payload map[string]any
	if err := json.NewDecoder(body).Decode(&payload); err != nil {
		t.Fatalf("decode json body: %v", err)
	}
	return payload
}

func mustJSONArrayBody(t *testing.T, body io.Reader) []map[string]any {
	t.Helper()

	var payload []map[string]any
	if err := json.NewDecoder(body).Decode(&payload); err != nil {
		t.Fatalf("decode json array body: %v", err)
	}
	return payload
}

type bcryptHashMatcher struct {
	plain string
}

func (m bcryptHashMatcher) Match(value driver.Value) bool {
	hashed, ok := value.(string)
	if !ok || hashed == "" || hashed == m.plain {
		return false
	}

	return bcrypt.CompareHashAndPassword([]byte(hashed), []byte(m.plain)) == nil
}

func TestBuildRoomProgressTracksUnlockedCompletedAndCounts(t *testing.T) {
	controller, mock, cleanup := newRoomControllerTest(t)
	defer cleanup()

	mock.ExpectQuery(queryPattern(`
		SELECT id, name, mode, status, prize, selected_booths
		FROM rooms
		WHERE code=$1
	`)).
		WithArgs("654321").
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "mode", "status", "prize", "selected_booths"}).
			AddRow(12, "Night Fair", "team", "playing", `["Large Doll","Memorial Coin"]`, `["FishScoopingScene","HorseDeliveryScene","WorshipBoothScene"]`))

	mock.ExpectQuery(queryPattern(`
		SELECT p.id, p.name, p.is_host, p.connected, p.team, p.total_score, pg.game_key, pg.status, pg.score
		FROM players p
		LEFT JOIN player_game_progress pg
		  ON pg.player_id=p.id AND pg.room_id=p.room_id
		WHERE p.room_id=$1
		ORDER BY p.is_host DESC, p.id, pg.game_order
	`)).
		WithArgs(12).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "name", "is_host", "connected", "team", "total_score", "game_key", "status", "score",
		}).
			AddRow(1, "Host", true, true, nil, 0, nil, nil, nil).
			AddRow(2, "Alice", false, true, "red", 30, "FishScoopingScene", "completed", 30).
			AddRow(2, "Alice", false, true, "red", 30, "HorseDeliveryScene", "unlocked", 0).
			AddRow(3, "Bob", false, false, "blue", 15, "FishScoopingScene", "completed", 15))

	progress, err := buildRoomProgress(controller.DB, "654321", 2)
	if err != nil {
		t.Fatalf("buildRoomProgress returned error: %v", err)
	}

	if got := progress["mode"]; got != "team" {
		t.Fatalf("mode = %v, want team", got)
	}
	if got := progress["active_players"]; got != 1 {
		t.Fatalf("active_players = %v, want 1", got)
	}
	if got := progress["total_players"]; got != 2 {
		t.Fatalf("total_players = %v, want 2", got)
	}
	if got := progress["all_completed"]; got != false {
		t.Fatalf("all_completed = %v, want false", got)
	}

	me, ok := progress["me"].(gin.H)
	if !ok {
		t.Fatalf("me payload has unexpected type: %T", progress["me"])
	}
	if got := me["next_game_key"]; got != "HorseDeliveryScene" {
		t.Fatalf("next_game_key = %v, want HorseDeliveryScene", got)
	}
	if got := me["completed"]; got != 1 {
		t.Fatalf("completed = %v, want 1", got)
	}
	if got := me["team"]; got != "red" {
		t.Fatalf("team = %v, want red", got)
	}
}

func TestBuildRoomSummaryTeamModeAggregatesScoresAndPrizes(t *testing.T) {
	controller, mock, cleanup := newRoomControllerTest(t)
	defer cleanup()

	mock.ExpectQuery(queryPattern(`
	SELECT id,name,mode,status,prize
	FROM rooms
	WHERE code=$1
	`)).
		WithArgs("999111").
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "mode", "status", "prize"}).
			AddRow(7, "Temple Team Cup", "team", "finished", `["Grand Trophy","Silver Medal"]`))

	mock.ExpectQuery(queryPattern(`
	SELECT id,name,team,total_score
	FROM players
	WHERE room_id=$1 AND is_host=false
	ORDER BY total_score DESC, id ASC
	`)).
		WithArgs(7).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "team", "total_score"}).
			AddRow(11, "A", "red", 50).
			AddRow(12, "B", "blue", 45).
			AddRow(13, "C", "red", 40).
			AddRow(14, "D", "blue", 10))

	summary, err := buildRoomSummary(controller.DB, "999111")
	if err != nil {
		t.Fatalf("buildRoomSummary returned error: %v", err)
	}

	teams, ok := summary["teams"].([]summaryTeam)
	if !ok {
		t.Fatalf("teams payload has unexpected type: %T", summary["teams"])
	}
	if len(teams) != 2 {
		t.Fatalf("len(teams) = %d, want 2", len(teams))
	}
	if teams[0].Team != "red" || teams[0].TotalScore != 90 || teams[0].Prize != "Grand Trophy" {
		t.Fatalf("first team = %+v, want red/90/Grand Trophy", teams[0])
	}
	if teams[1].Team != "blue" || teams[1].TotalScore != 55 || teams[1].Prize != "Silver Medal" {
		t.Fatalf("second team = %+v, want blue/55/Silver Medal", teams[1])
	}
}

func TestFinalizeGameRejectsWhenPlayersStillPlaying(t *testing.T) {
	controller, mock, cleanup := newRoomControllerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)

	mock.ExpectBegin()
	mock.ExpectQuery(queryPattern(`
		SELECT id, status
		FROM rooms
		WHERE code=$1
		FOR UPDATE
	`)).
		WithArgs("123456").
		WillReturnRows(sqlmock.NewRows([]string{"id", "status"}).AddRow(20, "playing"))
	mock.ExpectQuery(queryPattern(`
		SELECT is_host
		FROM players
		WHERE id=$1 AND room_id=$2
	`)).
		WithArgs(1, 20).
		WillReturnRows(sqlmock.NewRows([]string{"is_host"}).AddRow(true))
	mock.ExpectQuery(queryPattern(`
		SELECT selected_booths
		FROM rooms
		WHERE id=$1
	`)).
		WithArgs(20).
		WillReturnRows(sqlmock.NewRows([]string{"selected_booths"}).
			AddRow(`["FishScoopingScene","HorseDeliveryScene","BoxingGameScene","CookingGameScene","BalloonShootScene","DollGameScene","FlowerGameScene","HauntedHouseScene","TugOfWarScene","WorshipBoothScene"]`))
	mock.ExpectQuery(queryPattern(`
		SELECT p.id,
		       COALESCE(COUNT(pg.id) FILTER (WHERE pg.status='completed'), 0) AS completed_count
		FROM players p
		LEFT JOIN player_game_progress pg
		  ON pg.player_id=p.id AND pg.room_id=p.room_id
		WHERE p.room_id=$1
		  AND p.is_host=false
		GROUP BY p.id
	`)).
		WithArgs(20).
		WillReturnRows(sqlmock.NewRows([]string{"id", "completed_count"}).AddRow(2, 4))
	mock.ExpectRollback()

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/rooms/123456/finalize?player_id=1", nil)
	ctx.Params = gin.Params{{Key: "code", Value: "123456"}}

	controller.FinalizeGame(ctx)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
	}

	var payload map[string]any
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("invalid json response: %v", err)
	}
	if payload["error"] != "players are still playing" {
		t.Fatalf("error = %v, want players are still playing", payload["error"])
	}
}

func TestFinalizeGameReturnsSummaryWhenComplete(t *testing.T) {
	controller, mock, cleanup := newRoomControllerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)

	mock.ExpectBegin()
	mock.ExpectQuery(queryPattern(`
		SELECT id, status
		FROM rooms
		WHERE code=$1
		FOR UPDATE
	`)).
		WithArgs("777888").
		WillReturnRows(sqlmock.NewRows([]string{"id", "status"}).AddRow(55, "playing"))
	mock.ExpectQuery(queryPattern(`
		SELECT is_host
		FROM players
		WHERE id=$1 AND room_id=$2
	`)).
		WithArgs(1, 55).
		WillReturnRows(sqlmock.NewRows([]string{"is_host"}).AddRow(true))
	mock.ExpectQuery(queryPattern(`
		SELECT selected_booths
		FROM rooms
		WHERE id=$1
	`)).
		WithArgs(55).
		WillReturnRows(sqlmock.NewRows([]string{"selected_booths"}).
			AddRow(`["FishScoopingScene","HorseDeliveryScene","BoxingGameScene","CookingGameScene","BalloonShootScene","DollGameScene","FlowerGameScene","HauntedHouseScene","TugOfWarScene","WorshipBoothScene"]`))
	mock.ExpectQuery(queryPattern(`
		SELECT p.id,
		       COALESCE(COUNT(pg.id) FILTER (WHERE pg.status='completed'), 0) AS completed_count
		FROM players p
		LEFT JOIN player_game_progress pg
		  ON pg.player_id=p.id AND pg.room_id=p.room_id
		WHERE p.room_id=$1
		  AND p.is_host=false
		GROUP BY p.id
	`)).
		WithArgs(55).
		WillReturnRows(sqlmock.NewRows([]string{"id", "completed_count"}).
			AddRow(2, len(GameSequence)).
			AddRow(3, len(GameSequence)))
	mock.ExpectExec(queryPattern(`
		UPDATE rooms
		SET status='finished'
		WHERE id=$1
	`)).
		WithArgs(55).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	mock.ExpectQuery(queryPattern(`
	SELECT id,name,mode,status,prize
	FROM rooms
	WHERE code=$1
	`)).
		WithArgs("777888").
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "mode", "status", "prize"}).
			AddRow(55, "Temple Cup", "team", "finished", `["Team Shield","Medal"]`))
	mock.ExpectQuery(queryPattern(`
	SELECT id,name,team,total_score
	FROM players
	WHERE room_id=$1 AND is_host=false
	ORDER BY total_score DESC, id ASC
	`)).
		WithArgs(55).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "team", "total_score"}).
			AddRow(2, "Alice", "red", 90).
			AddRow(3, "Bob", "blue", 70))

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/rooms/777888/finalize?player_id=1", nil)
	ctx.Params = gin.Params{{Key: "code", Value: "777888"}}

	controller.FinalizeGame(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}

	var payload map[string]any
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("invalid json response: %v", err)
	}
	if payload["ok"] != true {
		t.Fatalf("ok = %v, want true", payload["ok"])
	}

	summary, ok := payload["summary"].(map[string]any)
	if !ok {
		t.Fatalf("summary payload has unexpected type: %T", payload["summary"])
	}
	if summary["mode"] != "team" {
		t.Fatalf("summary.mode = %v, want team", summary["mode"])
	}

	teams, ok := summary["teams"].([]any)
	if !ok || len(teams) != 2 {
		t.Fatalf("summary.teams = %T len=%d, want len 2", summary["teams"], len(teams))
	}

	firstTeam, ok := teams[0].(map[string]any)
	if !ok {
		t.Fatalf("first team payload has unexpected type: %T", teams[0])
	}
	if firstTeam["team"] != "red" {
		t.Fatalf("first team = %v, want red", firstTeam["team"])
	}
	if firstTeam["total_score"] != float64(90) {
		t.Fatalf("first team total_score = %v, want 90", firstTeam["total_score"])
	}
}

func TestCompleteGameMarksCompletedAndUnlocksNextGame(t *testing.T) {
	controller, mock, cleanup := newRoomControllerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)

	mock.ExpectBegin()
	mock.ExpectQuery(queryPattern(`
		SELECT id, status, selected_booths
		FROM rooms
		WHERE code=$1
		FOR UPDATE
	`)).
		WithArgs("654987").
		WillReturnRows(sqlmock.NewRows([]string{"id", "status", "selected_booths"}).
			AddRow(90, "playing", `["FishScoopingScene","HorseDeliveryScene","BoxingGameScene","CookingGameScene","BalloonShootScene","DollGameScene","FlowerGameScene","HauntedHouseScene","TugOfWarScene","WorshipBoothScene"]`))
	mock.ExpectQuery(queryPattern(`
		SELECT EXISTS (
			SELECT 1
			FROM players
			WHERE id=$1 AND room_id=$2 AND is_host=false
		)
	`)).
		WithArgs(12, 90).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))
	mock.ExpectQuery(queryPattern(`
		SELECT status
		FROM player_game_progress
		WHERE room_id=$1 AND player_id=$2 AND game_key=$3
		FOR UPDATE
	`)).
		WithArgs(90, 12, "FishScoopingScene").
		WillReturnRows(sqlmock.NewRows([]string{"status"}).AddRow("unlocked"))
	mock.ExpectExec(queryPattern(`
		UPDATE players
		SET connected=true,
		    last_seen_at=NOW()
		WHERE id=$1
	`)).
		WithArgs(12).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(queryPattern(`
		UPDATE player_game_progress
		SET status='completed',
		    score=$1,
		    meta=$2,
		    completed_at=NOW()
		WHERE room_id=$3 AND player_id=$4 AND game_key=$5
	`)).
		WithArgs(7, sqlmock.AnyArg(), 90, 12, "FishScoopingScene").
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(queryPattern(`
		UPDATE players
		SET total_score = total_score + $1
		WHERE id=$2
	`)).
		WithArgs(7, 12).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(queryPattern(`
			INSERT INTO player_game_progress
				(room_id, player_id, game_key, game_order, status)
			VALUES ($1,$2,$3,$4,'unlocked')
			ON CONFLICT (room_id, player_id, game_key) DO NOTHING
		`)).
		WithArgs(90, 12, "HorseDeliveryScene", 2).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectQuery(queryPattern(`
		SELECT COUNT(*)
		FROM player_game_progress
		WHERE room_id=$1 AND player_id=$2 AND status='completed'
	`)).
		WithArgs(90, 12).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
	mock.ExpectQuery(queryPattern(`
		SELECT p.id,
		       COALESCE(COUNT(pg.id) FILTER (WHERE pg.status='completed'), 0) AS completed_count
		FROM players p
		LEFT JOIN player_game_progress pg
		  ON pg.player_id=p.id AND pg.room_id=p.room_id
		WHERE p.room_id=$1
		  AND p.is_host=false
		GROUP BY p.id
	`)).
		WithArgs(90).
		WillReturnRows(sqlmock.NewRows([]string{"id", "completed_count"}).
			AddRow(12, 1).
			AddRow(14, 0))
	mock.ExpectCommit()

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	req := httptest.NewRequest(http.MethodPost, "/rooms/654987/games/FishScoopingScene/complete", strings.NewReader(`{"player_id":12,"score":7,"meta":{"caught":3}}`))
	req.Header.Set("Content-Type", "application/json")
	ctx.Request = req
	ctx.Params = gin.Params{
		{Key: "code", Value: "654987"},
		{Key: "game_key", Value: "FishScoopingScene"},
	}

	controller.CompleteGame(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}

	payload := mustJSONBody(t, recorder.Body)
	if payload["next_game_key"] != "HorseDeliveryScene" {
		t.Fatalf("next_game_key = %v, want HorseDeliveryScene", payload["next_game_key"])
	}
	if payload["completed"] != float64(1) {
		t.Fatalf("completed = %v, want 1", payload["completed"])
	}
	if payload["all_completed"] != false {
		t.Fatalf("all_completed = %v, want false", payload["all_completed"])
	}

	msg1 := <-controller.Hub.Broadcast
	msg2 := <-controller.Hub.Broadcast
	var broadcast1 map[string]any
	var broadcast2 map[string]any
	if err := json.Unmarshal(msg1.Data, &broadcast1); err != nil {
		t.Fatalf("decode first broadcast: %v", err)
	}
	if err := json.Unmarshal(msg2.Data, &broadcast2); err != nil {
		t.Fatalf("decode second broadcast: %v", err)
	}
	if broadcast1["type"] != "score_update" || broadcast1["score"] != float64(7) {
		t.Fatalf("score_update broadcast = %+v", broadcast1)
	}
	if broadcast2["type"] != "progress_update" || broadcast2["next_game_key"] != "HorseDeliveryScene" {
		t.Fatalf("progress_update broadcast = %+v", broadcast2)
	}
}

func TestCompleteGameForcesWorshipScoreToZero(t *testing.T) {
	controller, mock, cleanup := newRoomControllerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)

	mock.ExpectBegin()
	mock.ExpectQuery(queryPattern(`
		SELECT id, status, selected_booths
		FROM rooms
		WHERE code=$1
		FOR UPDATE
	`)).
		WithArgs("888999").
		WillReturnRows(sqlmock.NewRows([]string{"id", "status", "selected_booths"}).
			AddRow(91, "playing", `["FishScoopingScene","HorseDeliveryScene","BoxingGameScene","CookingGameScene","BalloonShootScene","DollGameScene","FlowerGameScene","HauntedHouseScene","TugOfWarScene","WorshipBoothScene"]`))
	mock.ExpectQuery(queryPattern(`
		SELECT EXISTS (
			SELECT 1
			FROM players
			WHERE id=$1 AND room_id=$2 AND is_host=false
		)
	`)).
		WithArgs(22, 91).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))
	mock.ExpectQuery(queryPattern(`
		SELECT status
		FROM player_game_progress
		WHERE room_id=$1 AND player_id=$2 AND game_key=$3
		FOR UPDATE
	`)).
		WithArgs(91, 22, "WorshipBoothScene").
		WillReturnRows(sqlmock.NewRows([]string{"status"}).AddRow("unlocked"))
	mock.ExpectExec(queryPattern(`
		UPDATE players
		SET connected=true,
		    last_seen_at=NOW()
		WHERE id=$1
	`)).
		WithArgs(22).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(queryPattern(`
		UPDATE player_game_progress
		SET status='completed',
		    score=$1,
		    meta=$2,
		    completed_at=NOW()
		WHERE room_id=$3 AND player_id=$4 AND game_key=$5
	`)).
		WithArgs(0, sqlmock.AnyArg(), 91, 22, "WorshipBoothScene").
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(queryPattern(`
		UPDATE players
		SET total_score = total_score + $1
		WHERE id=$2
	`)).
		WithArgs(0, 22).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectQuery(queryPattern(`
		SELECT COUNT(*)
		FROM player_game_progress
		WHERE room_id=$1 AND player_id=$2 AND status='completed'
	`)).
		WithArgs(91, 22).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(len(GameSequence)))
	mock.ExpectQuery(queryPattern(`
		SELECT p.id,
		       COALESCE(COUNT(pg.id) FILTER (WHERE pg.status='completed'), 0) AS completed_count
		FROM players p
		LEFT JOIN player_game_progress pg
		  ON pg.player_id=p.id AND pg.room_id=p.room_id
		WHERE p.room_id=$1
		  AND p.is_host=false
		GROUP BY p.id
	`)).
		WithArgs(91).
		WillReturnRows(sqlmock.NewRows([]string{"id", "completed_count"}).AddRow(22, len(GameSequence)))
	mock.ExpectCommit()

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	req := httptest.NewRequest(http.MethodPost, "/rooms/888999/games/WorshipBoothScene/complete", strings.NewReader(`{"player_id":22,"score":99,"meta":{"blessing":"โชคดี"}}`))
	req.Header.Set("Content-Type", "application/json")
	ctx.Request = req
	ctx.Params = gin.Params{
		{Key: "code", Value: "888999"},
		{Key: "game_key", Value: "WorshipBoothScene"},
	}

	controller.CompleteGame(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}

	payload := mustJSONBody(t, recorder.Body)
	if payload["next_game_key"] != "" {
		t.Fatalf("next_game_key = %v, want empty", payload["next_game_key"])
	}
	if payload["all_completed"] != true {
		t.Fatalf("all_completed = %v, want true", payload["all_completed"])
	}

	msg1 := <-controller.Hub.Broadcast
	msg2 := <-controller.Hub.Broadcast
	var broadcast1 map[string]any
	var broadcast2 map[string]any
	_ = json.Unmarshal(msg1.Data, &broadcast1)
	_ = json.Unmarshal(msg2.Data, &broadcast2)
	if broadcast1["score"] != float64(0) {
		t.Fatalf("worship score broadcast = %v, want 0", broadcast1["score"])
	}
	if broadcast2["all_completed"] != true {
		t.Fatalf("worship progress broadcast = %+v, want all_completed true", broadcast2)
	}
}

func TestCreateRoomAppliesDefaultsAndReturnsHost(t *testing.T) {
	controller, mock, cleanup := newRoomControllerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)

	mock.ExpectBegin()
	mock.ExpectQuery(queryPattern(`
	INSERT INTO rooms
	(code,name,mode,prize,max_players,room_password,selected_booths,status)
	VALUES ($1,$2,$3,$4,$5,$6,$7,'waiting')
	RETURNING id
	`)).
		WithArgs(sqlmock.AnyArg(), "Thai Festival Room", "solo", "[]", 8, nil, `["FishScoopingScene","HorseDeliveryScene","BoxingGameScene","CookingGameScene","BalloonShootScene","DollGameScene","FlowerGameScene","HauntedHouseScene","TugOfWarScene","WorshipBoothScene"]`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(101))
	mock.ExpectQuery(queryPattern(`
	INSERT INTO players
	(name,room_id,is_host,connected,total_score,last_seen_at)
	VALUES ($1,$2,true,true,0,NOW())
	RETURNING id
	`)).
		WithArgs("HostA", 101).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(501))
	mock.ExpectExec(queryPattern(`
	UPDATE rooms
	SET host_player_id=$1
	WHERE id=$2
	`)).
		WithArgs(501, 101).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	req := httptest.NewRequest(http.MethodPost, "/rooms", strings.NewReader(`{"host_name":"HostA","max_players":0,"mode":"weird","prizes":["", "  "]}`))
	req.Header.Set("Content-Type", "application/json")
	ctx.Request = req

	controller.CreateRoom(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}

	payload := mustJSONBody(t, recorder.Body)
	if payload["is_private"] != false {
		t.Fatalf("is_private = %v, want false", payload["is_private"])
	}
	if payload["mode"] != "solo" {
		t.Fatalf("mode = %v, want solo", payload["mode"])
	}
	player, ok := payload["player"].(map[string]any)
	if !ok {
		t.Fatalf("player payload has unexpected type: %T", payload["player"])
	}
	if player["is_host"] != true || player["name"] != "HostA" {
		t.Fatalf("player payload = %+v", player)
	}

	msg := <-controller.Hub.Broadcast
	var broadcast map[string]any
	if err := json.Unmarshal(msg.Data, &broadcast); err != nil {
		t.Fatalf("decode global broadcast: %v", err)
	}
	if msg.Room != "global" || broadcast["type"] != "room_update" {
		t.Fatalf("unexpected broadcast: room=%s payload=%+v", msg.Room, broadcast)
	}
}

func TestCreateRoomStoresHashedPasswordWhenPrivate(t *testing.T) {
	controller, mock, cleanup := newRoomControllerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)

	mock.ExpectBegin()
	mock.ExpectQuery(queryPattern(`
	INSERT INTO rooms
	(code,name,mode,prize,max_players,room_password,selected_booths,status)
	VALUES ($1,$2,$3,$4,$5,$6,$7,'waiting')
	RETURNING id
	`)).
		WithArgs(
			sqlmock.AnyArg(),
			"Thai Festival Room",
			"team",
			`["Gold"]`,
			10,
			bcryptHashMatcher{plain: "secret-123"},
			`["FishScoopingScene","WorshipBoothScene"]`,
		).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(150))
	mock.ExpectQuery(queryPattern(`
	INSERT INTO players
	(name,room_id,is_host,connected,total_score,last_seen_at)
	VALUES ($1,$2,true,true,0,NOW())
	RETURNING id
	`)).
		WithArgs("HostB", 150).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(700))
	mock.ExpectExec(queryPattern(`
	UPDATE rooms
	SET host_player_id=$1
	WHERE id=$2
	`)).
		WithArgs(700, 150).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	req := httptest.NewRequest(http.MethodPost, "/rooms", strings.NewReader(`{"host_name":"HostB","mode":"team","max_players":10,"prizes":["Gold"],"room_password":"secret-123","selected_booths":["FishScoopingScene"]}`))
	req.Header.Set("Content-Type", "application/json")
	ctx.Request = req

	controller.CreateRoom(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}

	payload := mustJSONBody(t, recorder.Body)
	if payload["is_private"] != true {
		t.Fatalf("is_private = %v, want true", payload["is_private"])
	}
}

func TestJoinRoomSuccessBroadcastsRoomAndGlobal(t *testing.T) {
	controller, mock, cleanup := newRoomControllerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)

	mock.ExpectBegin()
	mock.ExpectQuery(queryPattern(`
	SELECT id,max_players,room_password
	FROM rooms
	WHERE code=$1 AND status='waiting'
	FOR UPDATE
	`)).
		WithArgs("123123").
		WillReturnRows(sqlmock.NewRows([]string{"id", "max_players", "room_password"}).AddRow(77, 8, nil))
	mock.ExpectQuery(queryPattern(`
	SELECT COUNT(*)
	FROM players
	WHERE room_id=$1 AND connected=true
	`)).
		WithArgs(77).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(2))
	mock.ExpectQuery(queryPattern(`
	SELECT name
	FROM players
	WHERE room_id=$1
	`)).
		WithArgs(77).
		WillReturnRows(sqlmock.NewRows([]string{"name"}).
			AddRow("HostA").
			AddRow("PlayerY"))
	mock.ExpectQuery(queryPattern(`
	INSERT INTO players
	(name,room_id,is_host,connected,total_score,last_seen_at)
	VALUES ($1,$2,false,true,0,NOW())
	RETURNING id
	`)).
		WithArgs("PlayerX", 77).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(903))
	mock.ExpectCommit()

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	req := httptest.NewRequest(http.MethodPost, "/rooms/join", strings.NewReader(`{"name":"PlayerX","room_code":"123123"}`))
	req.Header.Set("Content-Type", "application/json")
	ctx.Request = req

	controller.JoinRoom(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}

	payload := mustJSONBody(t, recorder.Body)
	player, ok := payload["player"].(map[string]any)
	if !ok || player["id"] != float64(903) || player["is_host"] != false {
		t.Fatalf("join player payload = %+v", payload["player"])
	}

	msg1 := <-controller.Hub.Broadcast
	msg2 := <-controller.Hub.Broadcast
	if msg1.Room != "123123" && msg2.Room != "123123" {
		t.Fatalf("expected room broadcast for 123123")
	}
	if msg1.Room != "global" && msg2.Room != "global" {
		t.Fatalf("expected global broadcast")
	}
}

func TestJoinRoomRejectsWhenFull(t *testing.T) {
	controller, mock, cleanup := newRoomControllerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)

	mock.ExpectBegin()
	mock.ExpectQuery(queryPattern(`
	SELECT id,max_players,room_password
	FROM rooms
	WHERE code=$1 AND status='waiting'
	FOR UPDATE
	`)).
		WithArgs("333444").
		WillReturnRows(sqlmock.NewRows([]string{"id", "max_players", "room_password"}).AddRow(79, 2, nil))
	mock.ExpectQuery(queryPattern(`
	SELECT COUNT(*)
	FROM players
	WHERE room_id=$1 AND connected=true
	`)).
		WithArgs(79).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(2))
	mock.ExpectRollback()

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	req := httptest.NewRequest(http.MethodPost, "/rooms/join", strings.NewReader(`{"name":"Late","room_code":"333444"}`))
	req.Header.Set("Content-Type", "application/json")
	ctx.Request = req

	controller.JoinRoom(ctx)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
	}
	payload := mustJSONBody(t, recorder.Body)
	if payload["error"] != "room full" {
		t.Fatalf("error = %v, want room full", payload["error"])
	}
}

func TestJoinRoomRejectsDuplicateName(t *testing.T) {
	controller, mock, cleanup := newRoomControllerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)

	mock.ExpectBegin()
	mock.ExpectQuery(queryPattern(`
	SELECT id,max_players,room_password
	FROM rooms
	WHERE code=$1 AND status='waiting'
	FOR UPDATE
	`)).
		WithArgs("555666").
		WillReturnRows(sqlmock.NewRows([]string{"id", "max_players", "room_password"}).AddRow(81, 4, nil))
	mock.ExpectQuery(queryPattern(`
	SELECT COUNT(*)
	FROM players
	WHERE room_id=$1 AND connected=true
	`)).
		WithArgs(81).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
	mock.ExpectQuery(queryPattern(`
	SELECT name
	FROM players
	WHERE room_id=$1
	`)).
		WithArgs(81).
		WillReturnRows(sqlmock.NewRows([]string{"name"}).AddRow("playerx"))
	mock.ExpectRollback()

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	req := httptest.NewRequest(http.MethodPost, "/rooms/join", strings.NewReader(`{"name":" PlayerX ","room_code":"555666"}`))
	req.Header.Set("Content-Type", "application/json")
	ctx.Request = req

	controller.JoinRoom(ctx)

	if recorder.Code != http.StatusConflict {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusConflict)
	}

	payload := mustJSONBody(t, recorder.Body)
	if payload["error"] != "duplicate player name" {
		t.Fatalf("error = %v, want duplicate player name", payload["error"])
	}
	if payload["code"] != "duplicate_name" {
		t.Fatalf("code = %v, want duplicate_name", payload["code"])
	}
}

func TestJoinRoomRejectsDuplicateHostName(t *testing.T) {
	controller, mock, cleanup := newRoomControllerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)

	mock.ExpectBegin()
	mock.ExpectQuery(queryPattern(`
	SELECT id,max_players,room_password
	FROM rooms
	WHERE code=$1 AND status='waiting'
	FOR UPDATE
	`)).
		WithArgs("111222").
		WillReturnRows(sqlmock.NewRows([]string{"id", "max_players", "room_password"}).AddRow(82, 5, nil))
	mock.ExpectQuery(queryPattern(`
	SELECT COUNT(*)
	FROM players
	WHERE room_id=$1 AND connected=true
	`)).
		WithArgs(82).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
	mock.ExpectQuery(queryPattern(`
	SELECT name
	FROM players
	WHERE room_id=$1
	`)).
		WithArgs(82).
		WillReturnRows(sqlmock.NewRows([]string{"name"}).AddRow("HostPP"))
	mock.ExpectRollback()

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	req := httptest.NewRequest(http.MethodPost, "/rooms/join", strings.NewReader(`{"name":" hostpp ","room_code":"111222"}`))
	req.Header.Set("Content-Type", "application/json")
	ctx.Request = req

	controller.JoinRoom(ctx)

	if recorder.Code != http.StatusConflict {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusConflict)
	}

	payload := mustJSONBody(t, recorder.Body)
	if payload["code"] != "duplicate_name" {
		t.Fatalf("code = %v, want duplicate_name", payload["code"])
	}
}

func TestJoinPrivateRoomSuccessWithPassword(t *testing.T) {
	controller, mock, cleanup := newRoomControllerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)

	hashedPassword, err := hashRoomPassword("open-sesame")
	if err != nil {
		t.Fatalf("hashRoomPassword: %v", err)
	}

	mock.ExpectBegin()
	mock.ExpectQuery(queryPattern(`
	SELECT id,max_players,room_password
	FROM rooms
	WHERE code=$1 AND status='waiting'
	FOR UPDATE
	`)).
		WithArgs("909090").
		WillReturnRows(sqlmock.NewRows([]string{"id", "max_players", "room_password"}).AddRow(90, 6, hashedPassword))
	mock.ExpectQuery(queryPattern(`
	SELECT COUNT(*)
	FROM players
	WHERE room_id=$1 AND connected=true
	`)).
		WithArgs(90).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
	mock.ExpectQuery(queryPattern(`
	SELECT name
	FROM players
	WHERE room_id=$1
	`)).
		WithArgs(90).
		WillReturnRows(sqlmock.NewRows([]string{"name"}).AddRow("HostA"))
	mock.ExpectQuery(queryPattern(`
	INSERT INTO players
	(name,room_id,is_host,connected,total_score,last_seen_at)
	VALUES ($1,$2,false,true,0,NOW())
	RETURNING id
	`)).
		WithArgs("PlayerP", 90).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(904))
	mock.ExpectCommit()

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	req := httptest.NewRequest(http.MethodPost, "/rooms/join", strings.NewReader(`{"name":"PlayerP","room_code":"909090","room_password":"open-sesame"}`))
	req.Header.Set("Content-Type", "application/json")
	ctx.Request = req

	controller.JoinRoom(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}

	payload := mustJSONBody(t, recorder.Body)
	player, ok := payload["player"].(map[string]any)
	if !ok || player["id"] != float64(904) {
		t.Fatalf("player payload = %+v", payload["player"])
	}
}

func TestJoinRoomRejectsMissingPasswordForPrivateRoom(t *testing.T) {
	controller, mock, cleanup := newRoomControllerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)

	hashedPassword, err := hashRoomPassword("secret-join")
	if err != nil {
		t.Fatalf("hashRoomPassword: %v", err)
	}

	mock.ExpectBegin()
	mock.ExpectQuery(queryPattern(`
	SELECT id,max_players,room_password
	FROM rooms
	WHERE code=$1 AND status='waiting'
	FOR UPDATE
	`)).
		WithArgs("222333").
		WillReturnRows(sqlmock.NewRows([]string{"id", "max_players", "room_password"}).AddRow(83, 5, hashedPassword))
	mock.ExpectRollback()

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	req := httptest.NewRequest(http.MethodPost, "/rooms/join", strings.NewReader(`{"name":"PlayerA","room_code":"222333"}`))
	req.Header.Set("Content-Type", "application/json")
	ctx.Request = req

	controller.JoinRoom(ctx)

	if recorder.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusForbidden)
	}

	payload := mustJSONBody(t, recorder.Body)
	if payload["code"] != "password_required" {
		t.Fatalf("code = %v, want password_required", payload["code"])
	}
}

func TestJoinRoomRejectsInvalidPasswordForPrivateRoom(t *testing.T) {
	controller, mock, cleanup := newRoomControllerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)

	hashedPassword, err := hashRoomPassword("correct-pass")
	if err != nil {
		t.Fatalf("hashRoomPassword: %v", err)
	}

	mock.ExpectBegin()
	mock.ExpectQuery(queryPattern(`
	SELECT id,max_players,room_password
	FROM rooms
	WHERE code=$1 AND status='waiting'
	FOR UPDATE
	`)).
		WithArgs("444222").
		WillReturnRows(sqlmock.NewRows([]string{"id", "max_players", "room_password"}).AddRow(84, 5, hashedPassword))
	mock.ExpectRollback()

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	req := httptest.NewRequest(http.MethodPost, "/rooms/join", strings.NewReader(`{"name":"PlayerB","room_code":"444222","room_password":"wrong-pass"}`))
	req.Header.Set("Content-Type", "application/json")
	ctx.Request = req

	controller.JoinRoom(ctx)

	if recorder.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusForbidden)
	}

	payload := mustJSONBody(t, recorder.Body)
	if payload["code"] != "invalid_room_password" {
		t.Fatalf("code = %v, want invalid_room_password", payload["code"])
	}
}

func TestListRoomsIncludesPrivateFlag(t *testing.T) {
	controller, mock, cleanup := newRoomControllerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)

	mock.ExpectQuery(queryPattern(`
	SELECT r.code,r.name,r.mode,r.status,r.max_players,
	COUNT(p.id) FILTER (WHERE p.connected=true),
	(r.room_password IS NOT NULL AND BTRIM(r.room_password) <> '')
	FROM rooms r
	LEFT JOIN players p ON p.room_id=r.id
	GROUP BY r.id
	ORDER BY r.created_at DESC
	`)).
		WillReturnRows(sqlmock.NewRows([]string{
			"code", "name", "mode", "status", "max_players", "player_count", "is_private",
		}).
			AddRow("123123", "Open Room", "solo", "waiting", 8, 2, false).
			AddRow("456456", "VIP Room", "team", "waiting", 6, 4, true))

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/rooms", nil)

	controller.ListRooms(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}

	payload := mustJSONArrayBody(t, recorder.Body)
	if len(payload) != 2 {
		t.Fatalf("len(payload) = %d, want 2", len(payload))
	}
	if payload[0]["is_private"] != false {
		t.Fatalf("first is_private = %v, want false", payload[0]["is_private"])
	}
	if payload[1]["is_private"] != true {
		t.Fatalf("second is_private = %v, want true", payload[1]["is_private"])
	}
}

func TestGetRoomIncludesPrivateFlagWithoutLeakingPassword(t *testing.T) {
	controller, mock, cleanup := newRoomControllerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)

	hashedPassword, err := hashRoomPassword("keep-secret")
	if err != nil {
		t.Fatalf("hashRoomPassword: %v", err)
	}

	mock.ExpectQuery(queryPattern(`
	SELECT name,mode,status,prize,selected_booths,room_password
	FROM rooms
	WHERE code=$1
	`)).
		WithArgs("654654").
		WillReturnRows(sqlmock.NewRows([]string{
			"name", "mode", "status", "prize", "selected_booths", "room_password",
		}).AddRow("Secret Room", "team", "waiting", `["Prize"]`, `["FishScoopingScene","WorshipBoothScene"]`, hashedPassword))
	mock.ExpectQuery(queryPattern(`
	SELECT p.id,p.name,p.is_host,p.team,p.total_score,p.connected
	FROM players p
	JOIN rooms r ON r.id=p.room_id
	WHERE r.code=$1
	ORDER BY p.is_host DESC,p.id
	`)).
		WithArgs("654654").
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "name", "is_host", "team", "total_score", "connected",
		}).
			AddRow(1, "Host", true, nil, 0, true).
			AddRow(2, "Alice", false, "red", 10, true))

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/rooms/654654", nil)
	ctx.Params = gin.Params{{Key: "code", Value: "654654"}}

	controller.GetRoom(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}

	payload := mustJSONBody(t, recorder.Body)
	if payload["is_private"] != true {
		t.Fatalf("is_private = %v, want true", payload["is_private"])
	}
	if _, leaked := payload["room_password"]; leaked {
		t.Fatalf("room_password leaked in payload: %+v", payload)
	}
}

func TestStartGameSoloInitializesFirstUnlockedGame(t *testing.T) {
	controller, mock, cleanup := newRoomControllerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)

	mock.ExpectBegin()
	mock.ExpectQuery(queryPattern(`
	SELECT id,status,mode,selected_booths
	FROM rooms
	WHERE code=$1
	FOR UPDATE
	`)).
		WithArgs("444555").
		WillReturnRows(sqlmock.NewRows([]string{"id", "status", "mode", "selected_booths"}).
			AddRow(66, "waiting", "solo", `["FishScoopingScene","HorseDeliveryScene","BoxingGameScene","CookingGameScene","BalloonShootScene","DollGameScene","FlowerGameScene","HauntedHouseScene","TugOfWarScene","WorshipBoothScene"]`))
	mock.ExpectQuery(queryPattern(`
	SELECT is_host
	FROM players
	WHERE id=$1 AND room_id=$2
	`)).
		WithArgs(1, 66).
		WillReturnRows(sqlmock.NewRows([]string{"is_host"}).AddRow(true))
	mock.ExpectQuery(queryPattern(`
	SELECT COUNT(*)
	FROM players
	WHERE room_id=$1 AND connected=true
	`)).
		WithArgs(66).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(3))
	mock.ExpectExec(queryPattern(`
	UPDATE rooms
	SET status='playing'
	WHERE id=$1
	`)).
		WithArgs(66).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(queryPattern(`
			INSERT INTO player_game_progress
				(room_id, player_id, game_key, game_order, status)
			SELECT $1, p.id, $2, 1, 'unlocked'
			FROM players p
			WHERE p.room_id=$1 AND p.is_host=false
			ON CONFLICT (room_id, player_id, game_key) DO NOTHING
		`)).
		WithArgs(66, GameSequence[0]).
		WillReturnResult(sqlmock.NewResult(0, 2))
	mock.ExpectCommit()

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/rooms/444555/start?player_id=1", nil)
	ctx.Params = gin.Params{{Key: "code", Value: "444555"}}

	controller.StartGame(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}
	payload := mustJSONBody(t, recorder.Body)
	if payload["ok"] != true {
		t.Fatalf("ok = %v, want true", payload["ok"])
	}

	msg1 := <-controller.Hub.Broadcast
	msg2 := <-controller.Hub.Broadcast
	var b1 map[string]any
	var b2 map[string]any
	_ = json.Unmarshal(msg1.Data, &b1)
	_ = json.Unmarshal(msg2.Data, &b2)
	if b1["type"] != "game_start" && b2["type"] != "game_start" {
		t.Fatalf("expected game_start broadcast")
	}
}

func TestStartGameTeamAssignsTeamsAndInitializesProgress(t *testing.T) {
	controller, mock, cleanup := newRoomControllerTest(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)

	mock.ExpectBegin()
	mock.ExpectQuery(queryPattern(`
	SELECT id,status,mode,selected_booths
	FROM rooms
	WHERE code=$1
	FOR UPDATE
	`)).
		WithArgs("777333").
		WillReturnRows(sqlmock.NewRows([]string{"id", "status", "mode", "selected_booths"}).
			AddRow(70, "waiting", "team", `["FishScoopingScene","HorseDeliveryScene","BoxingGameScene","CookingGameScene","BalloonShootScene","DollGameScene","FlowerGameScene","HauntedHouseScene","TugOfWarScene","WorshipBoothScene"]`))
	mock.ExpectQuery(queryPattern(`
	SELECT is_host
	FROM players
	WHERE id=$1 AND room_id=$2
	`)).
		WithArgs(1, 70).
		WillReturnRows(sqlmock.NewRows([]string{"is_host"}).AddRow(true))
	mock.ExpectQuery(queryPattern(`
	SELECT COUNT(*)
	FROM players
	WHERE room_id=$1 AND connected=true
	`)).
		WithArgs(70).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(4))
	mock.ExpectQuery(queryPattern(`
			SELECT id
			FROM players
			WHERE room_id=$1 AND is_host=false
			ORDER BY id
		`)).
		WithArgs(70).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(2).AddRow(3).AddRow(4))
	mock.ExpectExec(queryPattern(`
				UPDATE players
				SET team=$1
				WHERE id=$2
			`)).
		WithArgs(sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(queryPattern(`
				UPDATE players
				SET team=$1
				WHERE id=$2
			`)).
		WithArgs(sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(queryPattern(`
				UPDATE players
				SET team=$1
				WHERE id=$2
			`)).
		WithArgs(sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(queryPattern(`
	UPDATE rooms
	SET status='playing'
	WHERE id=$1
	`)).
		WithArgs(70).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(queryPattern(`
			INSERT INTO player_game_progress
				(room_id, player_id, game_key, game_order, status)
			SELECT $1, p.id, $2, 1, 'unlocked'
			FROM players p
			WHERE p.room_id=$1 AND p.is_host=false
			ON CONFLICT (room_id, player_id, game_key) DO NOTHING
		`)).
		WithArgs(70, GameSequence[0]).
		WillReturnResult(sqlmock.NewResult(0, 3))
	mock.ExpectCommit()

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/rooms/777333/start?player_id=1", nil)
	ctx.Params = gin.Params{{Key: "code", Value: "777333"}}

	controller.StartGame(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}
}
