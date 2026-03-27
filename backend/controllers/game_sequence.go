package controllers

import (
	"database/sql"
	"encoding/json"
	"strings"
)

const WorshipGameKey = "WorshipBoothScene"

var GameSequence = []string{
	"FishScoopingScene",
	"HorseDeliveryScene",
	"BoxingGameScene",
	"CookingGameScene",
	"BalloonShootScene",
	"DollGameScene",
	"FlowerGameScene",
	"HauntedHouseScene",
	"TugOfWarScene",
	WorshipGameKey,
}

var allowedGameSequenceSet = func() map[string]struct{} {
	allowed := make(map[string]struct{}, len(GameSequence))
	for _, key := range GameSequence {
		allowed[key] = struct{}{}
	}
	return allowed
}()

func cloneGameSequence(sequence []string) []string {
	cloned := make([]string, len(sequence))
	copy(cloned, sequence)
	return cloned
}

func normalizeSelectedGameSequence(selected []string) ([]string, bool) {
	if selected == nil {
		return cloneGameSequence(GameSequence), true
	}

	selectedSet := make(map[string]struct{}, len(selected))
	for _, raw := range selected {
		key := strings.TrimSpace(raw)
		if key == "" || key == WorshipGameKey {
			continue
		}
		if _, ok := allowedGameSequenceSet[key]; !ok {
			return nil, false
		}
		selectedSet[key] = struct{}{}
	}

	ordered := make([]string, 0, len(selectedSet)+1)
	for _, key := range GameSequence {
		if key == WorshipGameKey {
			continue
		}
		if _, ok := selectedSet[key]; ok {
			ordered = append(ordered, key)
		}
	}

	if len(ordered) == 0 {
		return nil, false
	}

	return append(ordered, WorshipGameKey), true
}

func encodeSelectedGameSequence(selected []string) (string, error) {
	normalized, ok := normalizeSelectedGameSequence(selected)
	if !ok {
		return "", sql.ErrNoRows
	}
	body, err := json.Marshal(normalized)
	if err != nil {
		return "", err
	}
	return string(body), nil
}

func decodeSelectedGameSequence(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return cloneGameSequence(GameSequence)
	}

	var selected []string
	if err := json.Unmarshal([]byte(raw), &selected); err != nil {
		return cloneGameSequence(GameSequence)
	}

	normalized, ok := normalizeSelectedGameSequence(selected)
	if !ok {
		return cloneGameSequence(GameSequence)
	}

	return normalized
}

func loadRoomGameSequenceTx(tx *sql.Tx, roomID int) ([]string, error) {
	var selectedText sql.NullString
	if err := tx.QueryRow(`
		SELECT selected_booths
		FROM rooms
		WHERE id=$1
	`, roomID).Scan(&selectedText); err != nil {
		return nil, err
	}
	return decodeSelectedGameSequence(selectedText.String), nil
}

func gameSequenceIndexForSequence(sequence []string, gameKey string) int {
	for idx, key := range sequence {
		if key == gameKey {
			return idx + 1
		}
	}
	return 0
}
