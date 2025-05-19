package storage

import (
	"encoding/json"
	"net/http"
	"strconv"
)

type SubmitScoreRequest struct {
	PlayerName string  `json:"playerName"`
	Score      int     `json:"score"`
	Time       float64 `json:"time"`
	Level      int     `json:"level"`
}

func GetHighscoresHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	limitStr := r.URL.Query().Get("limit")
	limit := MaxHighscores
	if limitStr != "" {
		parsedLimit, err := strconv.Atoi(limitStr)
		if err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	levelStr := r.URL.Query().Get("level")

	var scores []Highscore
	var err error

	if levelStr != "" {

		level, parseErr := strconv.Atoi(levelStr)
		if parseErr == nil {
			scores, err = GetTopHighscoresByLevel(level, limit)
		} else {
			http.Error(w, "Invalid level parameter", http.StatusBadRequest)
			return
		}
	} else {

		scores, err = GetTopHighscores(limit)
	}

	if err != nil {
		http.Error(w, "Failed to retrieve highscores: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(scores)
}

func SubmitHighscoreHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var request SubmitScoreRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	if request.PlayerName == "" {
		http.Error(w, "Player name is required", http.StatusBadRequest)
		return
	}

	qualified, err := AddHighscore(
		request.PlayerName,
		request.Score,
		request.Time,
		request.Level,
	)

	if err != nil {
		http.Error(w, "Failed to save highscore: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := struct {
		Qualified bool `json:"qualified"`
	}{
		Qualified: qualified,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
