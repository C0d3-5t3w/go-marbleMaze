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

func InitStorage() error {
	return loadHighscores()
}

func SetStoragePath(path string) {
	storagePath = path
}

func loadHighscores() error {

	if _, err := os.Stat(storagePath); os.IsNotExist(err) {

		highscores = HighscoreData{Scores: []Highscore{}}
		return saveHighscores()
	}

	data, err := ioutil.ReadFile(storagePath)
	if err != nil {
		return err
	}

	err = json.Unmarshal(data, &highscores)
	if err != nil {
		return err
	}

	sortHighscores()

	return nil
}

func saveHighscores() error {

	sortHighscores()

	data, err := json.MarshalIndent(highscores, "", "  ")
	if err != nil {
		return err
	}

	return ioutil.WriteFile(storagePath, data, 0644)
}

func GetHighscores() ([]Highscore, error) {
	mu.Lock()
	defer mu.Unlock()

	scores := make([]Highscore, len(highscores.Scores))
	copy(scores, highscores.Scores)

	return scores, nil
}

func GetTopHighscores(n int) ([]Highscore, error) {
	mu.Lock()
	defer mu.Unlock()

	sortHighscores()

	if n > len(highscores.Scores) {
		n = len(highscores.Scores)
	}

	scores := make([]Highscore, n)
	copy(scores, highscores.Scores[:n])

	return scores, nil
}

func SubmitHighscore(playerName string, level int, score int, timeValue float64) (bool, error) {
	mu.Lock()
	defer mu.Unlock()

	newScore := Highscore{
		PlayerName: playerName,
		Level:      level,
		Score:      score,
		Time:       timeValue,
		Date:       time.Now(),
	}

	highscores.Scores = append(highscores.Scores, newScore)

	sortHighscores()

	if len(highscores.Scores) > MaxHighscores {
		highscores.Scores = highscores.Scores[:MaxHighscores]
	}

	err := saveHighscores()
	if err != nil {
		return false, err
	}

	isInTop := false
	for _, s := range highscores.Scores {
		if s.PlayerName == newScore.PlayerName && s.Date == newScore.Date {
			isInTop = true
			break
		}
	}

	return isInTop, nil
}

func AddHighscore(playerName string, score int, time float64, level int) (bool, error) {
	return SubmitHighscore(playerName, level, score, time)
}

func sortHighscores() {

	sort.Slice(highscores.Scores, func(i, j int) bool {
		return highscores.Scores[i].Time < highscores.Scores[j].Time
	})

	sort.Slice(highscores.Scores, func(i, j int) bool {

		if highscores.Scores[i].Level == highscores.Scores[j].Level {
			return highscores.Scores[i].Time < highscores.Scores[j].Time
		}
		return highscores.Scores[i].Level < highscores.Scores[j].Level
	})
}

func SortHighscores() {
	mu.Lock()
	defer mu.Unlock()
	sortHighscores()
}

func GetTopHighscoresByLevel(level int, n int) ([]Highscore, error) {
	scores, err := GetHighscores()
	if err != nil {
		return nil, err
	}

	var levelScores []Highscore
	for _, score := range scores {
		if score.Level == level {
			levelScores = append(levelScores, score)
		}
	}

	sort.Slice(levelScores, func(i, j int) bool {
		return levelScores[i].Time < levelScores[j].Time
	})

	if n > len(levelScores) {
		n = len(levelScores)
	}

	return levelScores[:n], nil
}

func ClearHighscores() error {
	mu.Lock()
	defer mu.Unlock()

	highscores.Scores = []Highscore{}
	return saveHighscores()
}

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
