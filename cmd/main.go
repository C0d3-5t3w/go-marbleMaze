package main

import (
	"log"
	"net/http"

	"github.com/C0d3-5t3w/go-marbleMaze/inc/config"
	"github.com/C0d3-5t3w/go-marbleMaze/inc/html"
	"github.com/C0d3-5t3w/go-marbleMaze/inc/storage"
)

var (
	ass     = "assets"
	assPath = "/assets/"
)

func main() {

	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Error loading config: %v", err)
	}

	if err := storage.InitStorage(); err != nil {
		log.Fatalf("Error initializing storage: %v", err)
	}

	fs := http.FileServer(http.Dir(ass))
	http.Handle(assPath, http.StripPrefix(assPath, fs))

	http.HandleFunc("/api/highscores", storage.GetHighscoresHandler)
	http.HandleFunc("/api/submit-score", storage.SubmitHighscoreHandler)

	http.HandleFunc("/", html.RenderGamePage)

	log.Printf("Starting server on port %s", cfg.GetPort())
	log.Fatal(http.ListenAndServe(":"+cfg.GetPort(), nil))
}
