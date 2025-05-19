package html

import (
	"html/template"
	"net/http"
)

var tmpl = template.Must(template.New("game").Parse(`
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
		<title>{{.Name}}</title>
		<link rel="stylesheet" href="assets/css/main.css">
		<link rel="stylesheet" href="assets/css/game.module.css">
		<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script> {{/* Added Three.js CDN */}}
	</head>
	<body>
		<div id="gameContainer">
			<canvas id="gameCanvas"></canvas>
		</div>
		<h1>Welcome to Marble Maze!</h1> {{/* This might be overlaid or removed depending on final game UI */}}
		<script src="assets/js/main.js"></script>
		<script src="assets/js/game.js"></script>
	</body>
	<footer>
		<p>&copy; 2025 Marble Maze. All rights reserved.</p>
	</footer>
	</html>
`))

func RenderGamePage(w http.ResponseWriter, r *http.Request) {
	data := struct {
		Name string
	}{
		Name: "Marble Maze",
	}
	if err := tmpl.ExecuteTemplate(w, "game", data); err != nil {
		http.Error(w, "Error rendering template", http.StatusInternalServerError)
	}
}
