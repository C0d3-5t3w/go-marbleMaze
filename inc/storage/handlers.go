package storage

import (
	"encoding/json"
	"net/http"
	"strconv"
)

// SubmitScoreRequest represents the JSON structure for score submissions
type SubmitScoreRequest struct {
	PlayerName string  `json:"playerName"`
	Score      int     `json:"score"`
	Time       float64 `json:"time"`
	Level      int     `json:"level"`
}

// GetHighscoresHandler handles HTTP GET requests for highscores
func GetHighscoresHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get the number of scores to return (optional query parameter)
	limitStr := r.URL.Query().Get("limit")
	limit := MaxHighscores // Default
	if limitStr != "" {
		parsedLimit, err := strconv.Atoi(limitStr)
		if err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	// Get level filter (optional query parameter)
	levelStr := r.URL.Query().Get("level")

	var scores []Highscore
	var err error

	if levelStr != "" {
		// If level is specified, get scores for that level
		level, parseErr := strconv.Atoi(levelStr)
		if parseErr == nil {
			scores, err = GetTopHighscoresByLevel(level, limit)
		} else {
			http.Error(w, "Invalid level parameter", http.StatusBadRequest)
			return
		}
	} else {
		// Otherwise get top scores across all levels
		scores, err = GetTopHighscores(limit)
	}

	if err != nil {
		http.Error(w, "Failed to retrieve highscores: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Send response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(scores)
}

// SubmitHighscoreHandler handles HTTP POST requests for submitting new highscores
func SubmitHighscoreHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse request body
	var request SubmitScoreRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Validate request
	if request.PlayerName == "" {
		http.Error(w, "Player name is required", http.StatusBadRequest)
		return
	}

	// Add highscore
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

	// Prepare response
	response := struct {
		Qualified bool `json:"qualified"`
	}{
		Qualified: qualified,
	}

	// Send response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
