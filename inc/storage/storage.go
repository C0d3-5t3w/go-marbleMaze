package storage

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"sort"
	"sync"
	"time"
)

const (
	DefaultStoragePath = "storage.json"
	MaxHighscores      = 100
)

type Highscore struct {
	PlayerName string    `json:"playerName"`
	Level      int       `json:"level"`
	Score      int       `json:"score"`
	Time       float64   `json:"time"`
	Date       time.Time `json:"date"`
}

type HighscoreData struct {
	Scores []Highscore `json:"scores"`
}

var (
	highscores  HighscoreData
	mu          sync.Mutex
	storagePath string = DefaultStoragePath
)

// Initialize the storage system
func InitStorage() error {
	return loadHighscores()
}

// Set custom storage path
func SetStoragePath(path string) {
	storagePath = path
}

// Load highscores from storage
func loadHighscores() error {
	// Check if file exists
	if _, err := os.Stat(storagePath); os.IsNotExist(err) {
		// Create empty highscores file
		highscores = HighscoreData{Scores: []Highscore{}}
		return saveHighscores()
	}

	// Read file
	data, err := ioutil.ReadFile(storagePath)
	if err != nil {
		return err
	}

	// Parse JSON
	err = json.Unmarshal(data, &highscores)
	if err != nil {
		return err
	}

	// Sort highscores
	sortHighscores()

	return nil
}

// Save highscores to storage
func saveHighscores() error {
	// Sort before saving
	sortHighscores()

	// Convert to JSON
	data, err := json.MarshalIndent(highscores, "", "  ")
	if err != nil {
		return err
	}

	// Write to file
	return ioutil.WriteFile(storagePath, data, 0644)
}

// Get highscores
func GetHighscores() ([]Highscore, error) {
	mu.Lock()
	defer mu.Unlock()

	scores := make([]Highscore, len(highscores.Scores))
	copy(scores, highscores.Scores)

	return scores, nil
}

// Get top N highscores
func GetTopHighscores(n int) ([]Highscore, error) {
	mu.Lock()
	defer mu.Unlock()

	// Sort to ensure they're in the right order
	sortHighscores()

	if n > len(highscores.Scores) {
		n = len(highscores.Scores)
	}

	scores := make([]Highscore, n)
	copy(scores, highscores.Scores[:n])

	return scores, nil
}

// Submit a new highscore
func SubmitHighscore(playerName string, level int, score int, timeValue float64) (bool, error) {
	mu.Lock()
	defer mu.Unlock()

	// Create new highscore entry
	newScore := Highscore{
		PlayerName: playerName,
		Level:      level,
		Score:      score,
		Time:       timeValue,
		Date:       time.Now(), // Now using the time package correctly
	}

	// Add to list
	highscores.Scores = append(highscores.Scores, newScore)

	// Sort highscores
	sortHighscores()

	// Trim if needed
	if len(highscores.Scores) > MaxHighscores {
		highscores.Scores = highscores.Scores[:MaxHighscores]
	}

	// Save to disk
	err := saveHighscores()
	if err != nil {
		return false, err
	}

	// Check if the new score made it to the top (is it still in the list?)
	isInTop := false
	for _, s := range highscores.Scores {
		if s.PlayerName == newScore.PlayerName && s.Date == newScore.Date {
			isInTop = true
			break
		}
	}

	return isInTop, nil
}

// AddHighscore is an alias for SubmitHighscore to maintain API compatibility
func AddHighscore(playerName string, score int, time float64, level int) (bool, error) {
	return SubmitHighscore(playerName, level, score, time)
}

// sortHighscores sorts highscores by level and then by time
func sortHighscores() {
	// First sort by time (ascending)
	sort.Slice(highscores.Scores, func(i, j int) bool {
		return highscores.Scores[i].Time < highscores.Scores[j].Time
	})

	// Then sort by level (ascending)
	sort.Slice(highscores.Scores, func(i, j int) bool {
		// If same level, keep time order
		if highscores.Scores[i].Level == highscores.Scores[j].Level {
			return highscores.Scores[i].Time < highscores.Scores[j].Time
		}
		return highscores.Scores[i].Level < highscores.Scores[j].Level
	})
}

// SortHighscores is a public function to trigger sorting (for external callers)
func SortHighscores() {
	mu.Lock()
	defer mu.Unlock()
	sortHighscores()
}

// GetTopHighscoresByLevel returns the top N highscores for a specific level
func GetTopHighscoresByLevel(level int, n int) ([]Highscore, error) {
	scores, err := GetHighscores()
	if err != nil {
		return nil, err
	}

	// Filter scores by level
	var levelScores []Highscore
	for _, score := range scores {
		if score.Level == level {
			levelScores = append(levelScores, score)
		}
	}

	// Sort by time (ascending)
	sort.Slice(levelScores, func(i, j int) bool {
		return levelScores[i].Time < levelScores[j].Time
	})

	if n > len(levelScores) {
		n = len(levelScores)
	}

	return levelScores[:n], nil
}

// Clear all highscores
func ClearHighscores() error {
	mu.Lock()
	defer mu.Unlock()

	highscores.Scores = []Highscore{}
	return saveHighscores()
}

// Get stats about highscores
func GetStats() (int, int, error) {
	mu.Lock()
	defer mu.Unlock()

	totalScores := len(highscores.Scores)
	uniquePlayers := 0

	players := make(map[string]bool)
	for _, score := range highscores.Scores {
		players[score.PlayerName] = true
	}
	uniquePlayers = len(players)

	return totalScores, uniquePlayers, nil
}
