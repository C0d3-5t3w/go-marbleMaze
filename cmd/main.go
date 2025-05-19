package main

import (
	"log"
	"net/http"
	"sync"

	"github.com/C0d3-5t3w/go-marbleMaze/inc/config"
	"github.com/C0d3-5t3w/go-marbleMaze/inc/html"
)

var (
	ass      = "assets"
	assPath  = "/assets/"
	mu       *sync.Mutex
	visitors = make(map[string]int)
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Error: %v", err)
	}
	// mu.Lock()
	fs := http.FileServer(http.Dir(ass))
	http.Handle(assPath, http.StripPrefix(assPath, fs))
	http.HandleFunc("/", html.RenderGamePage)
	log.Fatal(http.ListenAndServe(":"+cfg.GetPort(), nil))
	// time.Sleep(100 * time.Millisecond)
	// defer mu.Unlock()

}
