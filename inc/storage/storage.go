package storage

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"sort"
	"sync"
	"time"
)

// Constants
const (
	DefaultStoragePath = "storage.json"
	MaxHighscores      = 10
)

// Highscore represents a player's score record
type Highscore struct {
	PlayerName string    `json:"playerName"`
	Score      int       `json:"score"`
	Time       float64   `json:"time"` // completion time in seconds
	Level      int       `json:"level"`
	Date       time.Time `json:"date"`
}

// HighscoreList holds all highscores
type HighscoreList struct {
	Scores []Highscore `json:"scores"`
}

var (
	highscores *HighscoreList
	mu         sync.RWMutex
	loaded     bool
)

// InitStorage ensures the storage is ready, creating default storage if needed
func InitStorage() error {
	if loaded {
		return nil
	}

	mu.Lock()
	defer mu.Unlock()

	// Check if storage file exists
	if _, err := os.Stat(DefaultStoragePath); os.IsNotExist(err) {
		// Create empty highscores
		highscores = &HighscoreList{
			Scores: []Highscore{},
		}

		// Save initial empty storage
		err = saveToFile()
		if err != nil {
			return fmt.Errorf("failed to create initial storage: %w", err)
		}
	} else {
		// Load existing highscores
		err = loadFromFile()
		if err != nil {
			return fmt.Errorf("failed to load highscores: %w", err)
		}
	}

	loaded = true
	return nil
}

// loadFromFile reads highscores from the storage file
func loadFromFile() error {
	file, err := os.Open(DefaultStoragePath)
	if err != nil {
		return err
	}
	defer file.Close()

	highscores = &HighscoreList{}
	decoder := json.NewDecoder(file)
	err = decoder.Decode(highscores)
	if err != nil {
		return err
	}

	return nil
}

// saveToFile writes the current highscores to the storage file
func saveToFile() error {
	file, err := os.Create(DefaultStoragePath)
	if err != nil {
		return err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	err = encoder.Encode(highscores)
	if err != nil {
		return err
	}

	return nil
}

// AddHighscore adds a new highscore to the list if it qualifies
// Returns true if the score was added to the highscores
func AddHighscore(player string, score int, timeSeconds float64, level int) (bool, error) {
	if err := InitStorage(); err != nil {
		return false, err
	}

	if player == "" {
		return false, errors.New("player name cannot be empty")
	}

	mu.Lock()
	defer mu.Unlock()

	// Create new highscore
	newScore := Highscore{
		PlayerName: player,
		Score:      score,
		Time:       timeSeconds,
		Level:      level,
		Date:       time.Now(),
	}

	// Check if it qualifies (either we have fewer than max scores or it's better than the lowest)
	if len(highscores.Scores) < MaxHighscores {
		highscores.Scores = append(highscores.Scores, newScore)
		sortHighscores()
		err := saveToFile()
		return true, err
	}

	// Sort to ensure the lowest score is at the end
	sortHighscores()

	// Compare with the lowest score (time-based comparison - lower is better)
	if len(highscores.Scores) > 0 && highscores.Scores[len(highscores.Scores)-1].Time > newScore.Time {
		// Replace the lowest score
		highscores.Scores[len(highscores.Scores)-1] = newScore
		sortHighscores()
		err := saveToFile()
		return true, err
	}

	// Score didn't qualify
	return false, nil
}

// GetHighscores returns all stored highscores
func GetHighscores() ([]Highscore, error) {
	if err := InitStorage(); err != nil {
		return nil, err
	}

	mu.RLock()
	defer mu.RUnlock()

	// Return a copy to prevent external modification
	result := make([]Highscore, len(highscores.Scores))
	copy(result, highscores.Scores)

	return result, nil
}

// GetTopHighscores returns the top N highscores
func GetTopHighscores(n int) ([]Highscore, error) {
	scores, err := GetHighscores()
	if err != nil {
		return nil, err
	}

	if n > len(scores) {
		n = len(scores)
	}

	return scores[:n], nil
}

// sortHighscores sorts the highscores by time (ascending)
func sortHighscores() {
	sort.Slice(highscores.Scores, func(i, j int) bool {
		return highscores.Scores[i].Time < highscores.Scores[j].Time
	})
}

// ClearHighscores removes all highscores (used for testing)
func ClearHighscores() error {
	mu.Lock()
	defer mu.Unlock()

	highscores = &HighscoreList{
		Scores: []Highscore{},
	}

	return saveToFile()
}
