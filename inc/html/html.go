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
		<meta name="description" content="A 3D marble maze game where you tilt the maze to guide a marble to the goal">
		<meta name="theme-color" content="#4a90e2">
		<title>{{.Name}} - 3D Tilt Maze Game</title>
		<link rel="stylesheet" href="assets/css/main.css">
		<link rel="stylesheet" href="assets/css/game.module.css">
		<link rel="icon" href="assets/favicon.ico" type="image/x-icon">
		<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r132/three.min.js"></script>
	</head>
	<body>
		<div class="app-container">
			<!-- Top navbar with minimal game info -->
			<header class="game-header">
				<div class="game-title">{{.Name}}</div>
				<div class="game-status">
					<span id="level">Level 1</span>
					<span class="separator">|</span>
					<span id="timer">00:00</span>
				</div>
				<div class="game-controls">
					<button id="resetBtn" class="control-btn" aria-label="Reset game">↺</button>
					<button id="pauseBtn" class="control-btn" aria-label="Pause game">❚❚</button>
					<button id="muteBtn" class="control-btn" aria-label="Toggle sound">🔊</button>
					<button id="helpBtn" class="control-btn" aria-label="Help">?</button>
					<button id="leaderboardBtn" class="control-btn" aria-label="View leaderboard">🏆</button>
				</div>
			</header>

			<!-- Main game area -->
			<main class="game-main">
				<div id="gameContainer">
					<canvas id="gameCanvas"></canvas>
				</div>
			</main>

			<!-- Footer with minimal info -->
			<footer class="game-footer">
				<div class="footer-content">
					<p class="copyright">&copy; 2025 {{.Name}}. All rights reserved.</p>
					<div class="footer-links">
						<a href="#" id="aboutLink">About</a>
						<span class="separator">•</span>
						<a href="#" id="privacyLink">Privacy</a>
						<span class="separator">•</span>
						<a href="https://github.com/C0d3-5t3w/go-marbleMaze" target="_blank">GitHub</a>
					</div>
				</div>
			</footer>

			<!-- Overlay screens - absolutely positioned on top of everything -->
			<div class="overlay-container">
				<!-- Loading Screen -->
				<div id="loadingScreen" class="overlay">
					<div class="overlay-content">
						<h2>Loading {{.Name}}...</h2>
						<div class="loader"></div>
					</div>
				</div>

				<!-- Instructions panel - toggles with the help button -->
				<div id="instructionsPanel" class="side-panel hidden">
					<div class="panel-header">
						<h2>How to Play</h2>
						<button class="close-btn" aria-label="Close instructions">×</button>
					</div>
					<div class="panel-content">
						<div class="desktop-instructions">
							<h3>Desktop Controls</h3>
							<p>Move your mouse to tilt the maze and guide the marble to the green goal!</p>
							<ul>
								<li><strong>Mouse:</strong> Tilt the maze</li>
								<li><strong>R key:</strong> Reset marble</li>
								<li><strong>P key:</strong> Pause game</li>
								<li><strong>M key:</strong> Mute sound</li>
							</ul>
						</div>
						<div class="mobile-instructions">
							<h3>Mobile Controls</h3>
							<p>Tilt your device to control the maze and reach the green goal!</p>
							<ul>
								<li><strong>Device tilt:</strong> Control the maze</li>
								<li><strong>Tap ↺:</strong> Reset marble</li>
								<li><strong>Tap ❚❚:</strong> Pause game</li>
								<li><strong>Tap 🔊:</strong> Mute sound</li>
							</ul>
						</div>
					</div>
				</div>

				<!-- Highscores panel - toggles with a leaderboard button -->
				<div id="highscoresPanel" class="side-panel hidden">
					<div class="panel-header">
						<h2>Top Players</h2>
						<button class="close-btn" aria-label="Close highscores">×</button>
					</div>
					<div class="panel-content">
						<div id="highscoresList">
							<div class="loading">Loading highscores...</div>
						</div>
					</div>
				</div>

				<!-- Win Screen -->
				<div id="winScreen" class="overlay hidden">
					<div class="overlay-content">
						<h2>Level Complete!</h2>
						<p id="completionTime">Time: <span>00:30</span></p>
						<div class="btn-group">
							<button id="nextLevelBtn" class="primary-btn">Next Level</button>
							<button id="restartBtn" class="secondary-btn">Restart</button>
						</div>
					</div>
				</div>

				<!-- Game Over Screen -->
				<div id="gameOverScreen" class="overlay hidden">
					<div class="overlay-content">
						<h2>Game Over</h2>
						<div class="btn-group">
							<button id="tryAgainBtn" class="primary-btn">Try Again</button>
							<button id="mainMenuBtn" class="secondary-btn">Main Menu</button>
						</div>
					</div>
				</div>

				<!-- Pause Screen -->
				<div id="pauseScreen" class="overlay hidden">
					<div class="overlay-content">
						<h2>Game Paused</h2>
						<div class="btn-group vertical">
							<button id="resumeBtn" class="primary-btn">Resume Game</button>
							<button id="restartGameBtn" class="secondary-btn">Restart Level</button>
							<button id="quitBtn" class="secondary-btn">Quit Game</button>
						</div>
					</div>
				</div>

				<!-- Device Orientation Permission (for mobile) -->
				<div id="deviceOrientationPrompt" class="overlay hidden">
					<div class="overlay-content">
						<h2>Enable Motion Controls</h2>
						<p>This game uses device tilt to control the maze.</p>
						<button id="enableSensors" class="primary-btn">Enable Sensors</button>
					</div>
				</div>
			</div>

			<!-- Modals -->
			<div id="aboutModal" class="modal hidden">
				<div class="modal-content">
					<div class="modal-header">
						<h2>About {{.Name}}</h2>
						<button class="close-modal" aria-label="Close">×</button>
					</div>
					<div class="modal-body">
						<p>{{.Name}} is a 3D tilt maze game built with Go and Three.js. Tilt the maze to guide the marble to the goal!</p>
						<h3>How to Play</h3>
						<ul>
							<li><strong>Desktop:</strong> Move your mouse to tilt the maze</li>
							<li><strong>Mobile:</strong> Tilt your device to control the maze</li>
							<li>Press <strong>R</strong> to reset the marble position</li>
							<li>Press <strong>P</strong> to pause the game</li>
						</ul>
						<p>Created by <a href="https://github.com/C0d3-5t3w" target="_blank">C0d3-5t3w</a></p>
					</div>
				</div>
			</div>

			<div id="privacyModal" class="modal hidden">
				<div class="modal-content">
					<div class="modal-header">
						<h2>Privacy Policy</h2>
						<button class="close-modal" aria-label="Close">×</button>
					</div>
					<div class="modal-body">
						<p>This game does not collect any personal information or user data. We use device orientation sensors only for gameplay purposes and do not store or transmit this information.</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Scripts -->
		<script src="assets/js/main.js"></script>
		<script src="assets/js/game.js"></script>
	</body>
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
