package main

import (
	"log"
	"net/http"

	"github.com/C0d3-5t3w/go-marbleMaze/inc/config"
	"github.com/C0d3-5t3w/go-marbleMaze/inc/html"
)

var (
	ass     = "assets"
	assPath = "/assets/"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Error: %v", err)
	}
	fs := http.FileServer(http.Dir(ass))
	http.Handle(assPath, http.StripPrefix(assPath, fs))
	http.HandleFunc("/", html.RenderGamePage)
	log.Fatal(http.ListenAndServe(":"+cfg.GetPort(), nil))
}
