interface Highscore {
    playerName: string;
    score: number;
    time: number;
    level: number;
    date: string;
}

class Main {
    private isLoaded: boolean = false;
    private isMobile: boolean = false;

    constructor() {
        console.log("Main constructor called");
        this.detectDevice();
    }

    init() {
        console.log("Initializing main application");
        this.setupUI();
        this.checkBrowserSupport();

        this.hideLoadingScreen();

        this.setupEventListeners();

        this.isLoaded = true;
    }

    private detectDevice() {
        this.isMobile =
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            );
        console.log(`Device detected: ${this.isMobile ? "Mobile" : "Desktop"}`);

        document.body.classList.add(this.isMobile ? "mobile" : "desktop");
    }

    private hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById("loadingScreen");
            if (loadingScreen) {
                loadingScreen.classList.add("hidden");
                console.log("Loading screen hidden");
            } else {
                console.error("Loading screen element not found");
            }
        }, 1000);
    }

    private setupEventListeners() {
        this.setupControlButtons();
        this.setupModalHandlers();
        this.setupLevelButtons();
    }

    private setupControlButtons() {
        const resetBtn = document.getElementById("resetBtn");
        if (resetBtn) {
            resetBtn.addEventListener("click", () => {
                console.log("Reset button clicked");

                if ((window as any).gameInstance) {
                    (window as any).gameInstance.resetMarble();
                } else {
                    const resetEvent = new KeyboardEvent("keydown", {
                        key: "r",
                    });
                    window.dispatchEvent(resetEvent);
                }
            });
        }

        const pauseBtn = document.getElementById("pauseBtn");
        if (pauseBtn) {
            pauseBtn.addEventListener("click", () => {
                console.log("Pause button clicked");
                if ((window as any).gameInstance) {
                    (window as any).gameInstance.togglePause();
                } else {
                    this.togglePauseScreen();
                }
            });
        }

        const helpBtn = document.getElementById("helpBtn");
        if (helpBtn) {
            helpBtn.addEventListener("click", () => {
                console.log("Help button clicked");
                this.toggleInstructionsPanel();
            });
        }

        const resumeBtn = document.getElementById("resumeBtn");
        if (resumeBtn) {
            resumeBtn.addEventListener("click", () => {
                this.togglePauseScreen();
            });
        }

        const closeBtn = document.querySelector(".close-btn");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                this.toggleInstructionsPanel();
            });
        }
    }

    private setupModalHandlers() {
        const aboutLink = document.getElementById("aboutLink");
        if (aboutLink) {
            aboutLink.addEventListener("click", (e) => {
                e.preventDefault();
                this.showModal("aboutModal");
            });
        }

        const privacyLink = document.getElementById("privacyLink");
        if (privacyLink) {
            privacyLink.addEventListener("click", (e) => {
                e.preventDefault();
                this.showModal("privacyModal");
            });
        }

        const closeModalBtns = document.querySelectorAll(".close-modal");
        closeModalBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                const modal = btn.closest(".modal") as HTMLElement;
                if (modal) {
                    modal.classList.remove("active");
                }
            });
        });
    }

    private setupLevelButtons() {
        const leaderboardBtn = document.getElementById("leaderboardBtn");
        if (leaderboardBtn) {
            leaderboardBtn.addEventListener("click", () => {
                console.log("Leaderboard button clicked");
                this.toggleHighscoresPanel();

                if ((window as any).gameInstance) {
                    (window as any).gameInstance.loadHighscores();
                } else {
                    this.fetchAndDisplayHighscores();
                }
            });
        }

        const closeHighscoresBtn = document.querySelector(
            "#highscoresPanel .close-btn"
        );
        if (closeHighscoresBtn) {
            closeHighscoresBtn.addEventListener("click", () => {
                this.toggleHighscoresPanel();
            });
        }
    }

    private showModal(modalId: string) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add("active");
        }
    }

    private togglePauseScreen() {
        const pauseScreen = document.getElementById("pauseScreen");
        if (pauseScreen) {
            pauseScreen.classList.toggle("hidden");
        }
    }

    private toggleInstructionsPanel() {
        const instructionsPanel = document.getElementById("instructionsPanel");
        if (instructionsPanel) {
            instructionsPanel.classList.toggle("active");
        }
    }

    private toggleHighscoresPanel() {
        const highscoresPanel = document.getElementById("highscoresPanel");
        if (highscoresPanel) {
            highscoresPanel.classList.toggle("active");

            if (highscoresPanel.classList.contains("active")) {
                this.fetchAndDisplayHighscores();
            }
        }
    }

    private async fetchAndDisplayHighscores() {
        const highscoresList = document.getElementById("highscoresList");
        if (!highscoresList) return;

        highscoresList.innerHTML =
            '<div class="loading">Loading highscores...</div>';

        try {
            const response = await fetch("/api/highscores");
            const highscores = (await response.json()) as Highscore[];

            if (highscores.length === 0) {
                highscoresList.innerHTML =
                    "<p>No highscores yet. Be the first!</p>";
                return;
            }

            let html = `
                <table class="highscores-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Player</th>
                            <th>Level</th>
                            <th>Time</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            highscores.forEach((score: Highscore, index: number) => {
                const date = new Date(score.date).toLocaleDateString();
                const minutes = Math.floor(score.time / 60);
                const seconds = Math.floor(score.time % 60);
                const ms = Math.floor((score.time % 1) * 100);
                const formattedTime = `${minutes
                    .toString()
                    .padStart(2, "0")}:${seconds
                    .toString()
                    .padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;

                html += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${score.playerName}</td>
                        <td>${score.level}</td>
                        <td>${formattedTime}</td>
                        <td>${date}</td>
                    </tr>
                `;
            });

            html += "</tbody></table>";
            highscoresList.innerHTML = html;
        } catch (error) {
            console.error("Failed to load highscores:", error);
            highscoresList.innerHTML =
                "<p>Error loading highscores. Please try again later.</p>";
        }
    }

    private setupUI() {
        console.log("UI setup handled by HTML template");
    }

    private checkBrowserSupport() {
        try {
            const canvas = document.createElement("canvas");
            const hasWebGL = !!(
                window.WebGLRenderingContext &&
                (canvas.getContext("webgl") ||
                    canvas.getContext("experimental-webgl"))
            );

            if (!hasWebGL) {
                this.showError(
                    "Your browser does not support WebGL, which is required for this game."
                );
                return false;
            }
        } catch (e) {
            this.showError("Error detecting WebGL support.");
            return false;
        }

        if (this.isMobile && !window.DeviceOrientationEvent) {
            console.warn(
                "DeviceOrientation not supported. Falling back to touch controls."
            );
        }

        return true;
    }

    private showError(message: string) {
        const errorDiv = document.createElement("div");
        errorDiv.style.position = "absolute";
        errorDiv.style.top = "50%";
        errorDiv.style.left = "50%";
        errorDiv.style.transform = "translate(-50%, -50%)";
        errorDiv.style.background = "rgba(255,0,0,0.8)";
        errorDiv.style.color = "white";
        errorDiv.style.padding = "20px";
        errorDiv.style.borderRadius = "10px";
        errorDiv.style.textAlign = "center";
        errorDiv.style.zIndex = "100";
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
    }
}

const main = new Main();

function initmain() {
    main.init();
}

window.addEventListener("load", function () {
    initmain();
    console.log("main.ts loaded and initialized");
});
