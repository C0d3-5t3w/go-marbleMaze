declare var THREE: any;

interface Level {
    mazeSize: number;
    startPosition: { x: number; z: number };
    goalPosition: { x: number; z: number };
    innerWalls: [number, number, number, number][];
}

class Game {
    private scene: any;
    private camera: any;
    private renderer: any;
    private maze: any;
    private marble: any;
    private marbleRadius: number = 0.3;
    private mazeSize: number = 10;
    private wallHeight: number = 1;
    private mazeTiltX: number = 0;
    private mazeTiltZ: number = 0;
    private goalPosition: { x: number; z: number } = { x: 4, z: 4 };
    private startPosition: { x: number; z: number } = { x: -4, z: -4 };
    private gameWon: boolean = false;
    private walls: any[] = [];
    private goal: any;
    private currentLevelIndex: number = 0;
    private timerInterval: number | null = null;

    private _isPaused: boolean = false;
    private gameStartTime: number = 0;
    private gameEndTime: number = 0;
    private elapsedTime: number = 0;
    private pauseStartTime: number = 0;

    private levels: Level[] = [];

    public get isPaused(): boolean {
        return this._isPaused;
    }

    constructor() {
        console.log("Game constructor called");

        this.initializeLevels();
    }

    private generateComplexMazeLayout(
        levelIndex: number
    ): [number, number, number, number][] {
        const walls: [number, number, number, number][] = [];
        const seed = levelIndex * 12345;

        // Deterministic pseudo-random function
        const random = (min: number, max: number) => {
            const x = Math.sin(seed + walls.length) * 10000;
            return min + (x - Math.floor(x)) * (max - min);
        };

        const mazeSize = this.getMazeSizeForLevel(levelIndex);
        const halfSize = Math.floor(mazeSize / 2) - 1;

        // Grid size for the maze cells
        const gridSize = Math.floor(mazeSize / 2);

        // Create a grid for maze generation (true = wall, false = path)
        const grid: boolean[][] = [];
        for (let i = 0; i < gridSize; i++) {
            grid[i] = [];
            for (let j = 0; j < gridSize; j++) {
                grid[i][j] = true; // Start with all walls
            }
        }

        // Generate maze using a simplified recursive backtracking algorithm
        // This ensures a path exists from start to end
        const generateMazePaths = (x: number, y: number, grid: boolean[][]) => {
            const directions = [
                [0, -1],
                [1, 0],
                [0, 1],
                [-1, 0],
            ]; // Up, Right, Down, Left

            // Shuffle directions using our deterministic random
            for (let i = directions.length - 1; i > 0; i--) {
                const j = Math.floor(random(0, i + 1));
                [directions[i], directions[j]] = [directions[j], directions[i]];
            }

            grid[x][y] = false; // Mark current cell as path

            // Try each direction
            for (const [dx, dy] of directions) {
                const nx = x + dx * 2; // Move two cells (to skip walls between cells)
                const ny = y + dy * 2;

                // Check if next cell is within bounds and not visited
                if (
                    nx >= 0 &&
                    nx < gridSize &&
                    ny >= 0 &&
                    ny < gridSize &&
                    grid[nx][ny]
                ) {
                    // Carve a path by making the wall between current and next cell a path
                    grid[x + dx][y + dy] = false;
                    generateMazePaths(nx, ny, grid);
                }
            }
        };

        // Start from a cell near the entrance
        const startX = 1;
        const startY = 1;
        generateMazePaths(startX, startY, grid);

        // Ensure path to goal
        // Find a cell near the goal
        const goalX = gridSize - 2;
        const goalY = gridSize - 2;

        // Make sure there's a path to the goal
        grid[goalX][goalY] = false;

        // Connect the goal to the maze if it's not already connected
        if (
            grid[goalX - 1][goalY] &&
            grid[goalX][goalY - 1] &&
            grid[goalX + 1][goalY] &&
            grid[goalX][goalY + 1]
        ) {
            // If the goal is surrounded by walls, break one wall
            grid[goalX - 1][goalY] = false; // Break the left wall
        }

        // Convert grid to wall segments
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (grid[i][j]) {
                    // Convert grid coordinates to maze coordinates
                    const x = (i - gridSize / 2) * 2;
                    const z = (j - gridSize / 2) * 2;

                    // Create wall segments with varying sizes for visual interest
                    const width = 0.5 + random(0, 0.3);
                    const depth = 0.5 + random(0, 0.3);

                    // Add wall to the list
                    walls.push([x, z, width, depth]);
                }
            }
        }

        // Add some additional random obstacles for complexity
        const numObstacles = 5 + Math.floor(levelIndex / 2);

        for (let i = 0; i < numObstacles; i++) {
            // Make sure obstacles don't block the start or goal
            const x = Math.floor(random(-halfSize + 3, halfSize - 3));
            const z = Math.floor(random(-halfSize + 3, halfSize - 3));

            // Don't place obstacles near start or goal positions
            const distanceToStart = Math.sqrt(
                Math.pow(x - (-halfSize + 1), 2) +
                    Math.pow(z - (-halfSize + 1), 2)
            );

            const distanceToGoal = Math.sqrt(
                Math.pow(x - (halfSize - 1), 2) +
                    Math.pow(z - (halfSize - 1), 2)
            );

            // Only place if far enough from start and goal
            if (distanceToStart > 3 && distanceToGoal > 3) {
                const width = 0.5 + random(0, 1.5);
                const depth = 0.5 + random(0, 1.5);
                walls.push([x, z, width, depth]);
            }
        }

        // Add larger structures for visual interest
        const numStructures = 2 + Math.floor(levelIndex / 5);

        for (let i = 0; i < numStructures; i++) {
            const structureType = Math.floor(random(0, 3));

            if (structureType === 0) {
                // Create a cross structure
                const x = Math.floor(random(-halfSize + 5, halfSize - 5));
                const z = Math.floor(random(-halfSize + 5, halfSize - 5));

                // Check distance from start and goal
                const distanceToStart = Math.sqrt(
                    Math.pow(x - (-halfSize + 1), 2) +
                        Math.pow(z - (-halfSize + 1), 2)
                );

                const distanceToGoal = Math.sqrt(
                    Math.pow(x - (halfSize - 1), 2) +
                        Math.pow(z - (halfSize - 1), 2)
                );

                if (distanceToStart > 5 && distanceToGoal > 5) {
                    walls.push([x, z, 3, 0.5]); // Horizontal bar
                    walls.push([x, z, 0.5, 3]); // Vertical bar
                }
            } else if (structureType === 1) {
                // Create a square chamber
                const size = 2 + Math.floor(random(0, 3));
                const x = Math.floor(
                    random(-halfSize + size + 3, halfSize - size - 3)
                );
                const z = Math.floor(
                    random(-halfSize + size + 3, halfSize - size - 3)
                );

                // Check distance from start and goal
                const distanceToStart = Math.sqrt(
                    Math.pow(x - (-halfSize + 1), 2) +
                        Math.pow(z - (-halfSize + 1), 2)
                );

                const distanceToGoal = Math.sqrt(
                    Math.pow(x - (halfSize - 1), 2) +
                        Math.pow(z - (halfSize - 1), 2)
                );

                if (distanceToStart > size + 3 && distanceToGoal > size + 3) {
                    walls.push([x, z - size, size * 2, 0.5]); // Top wall
                    walls.push([x, z + size, size * 2, 0.5]); // Bottom wall
                    walls.push([x - size, z, 0.5, size * 2]); // Left wall
                    walls.push([x + size, z, 0.5, size * 2]); // Right wall

                    // Add a gap in one random wall
                    const wallToBreak = Math.floor(random(0, 4));
                    if (wallToBreak === 0) {
                        walls.pop(); // Remove the last wall (right)
                        walls.push([x + size, z - size / 2, 0.5, size]); // Upper half
                        walls.push([x + size, z + size / 2, 0.5, size]); // Lower half
                    } else if (wallToBreak === 1) {
                        walls.pop(); // Remove the last wall
                        walls.pop(); // Remove the second-to-last wall
                        walls.push([x - size, z - size / 2, 0.5, size]); // Upper half of left wall
                        walls.push([x - size, z + size / 2, 0.5, size]); // Lower half of left wall
                        walls.push([x + size, z, 0.5, size * 2]); // Right wall (re-add)
                    }
                    // Otherwise leave the top or bottom wall with a gap
                }
            }
        }

        return walls;
    }

    private getMazeSizeForLevel(levelIndex: number): number {
        if (levelIndex < 17) {
            // First 17 levels have explicit sizes
            const sizes = [
                10, 10, 10, 10, 12, 12, 12, 14, 14, 16, 16, 16, 18, 18, 20, 20,
                22,
            ];
            return sizes[levelIndex];
        } else if (levelIndex < 25) {
            return 22 + (levelIndex - 17) * 2; // Levels 18-24
        } else if (levelIndex < 35) {
            return 38 + (levelIndex - 25) * 3; // Levels 25-34: bigger increases
        } else {
            // Levels 35+ grow in size incrementally with larger jumps
            return Math.min(80, 68 + Math.floor((levelIndex - 35) / 2) * 4);
        }
    }

    private initializeLevels() {
        this.levels.push({
            mazeSize: 10,
            startPosition: { x: -4, z: -4 },
            goalPosition: { x: 4, z: 4 },
            innerWalls: [[0, 0, 0.5, 4]],
        });

        this.levels.push({
            mazeSize: 10,
            startPosition: { x: -4, z: -4 },
            goalPosition: { x: 4, z: 4 },
            innerWalls: [
                [0, 0, 0.5, 4],
                [-2, 2, 4, 0.5],
            ],
        });

        this.levels.push({
            mazeSize: 10,
            startPosition: { x: -4, z: -4 },
            goalPosition: { x: 4, z: 4 },
            innerWalls: [
                [0, 0, 0.5, 6],
                [-3, -2, 4, 0.5],
                [3, 2, 4, 0.5],
            ],
        });

        this.levels.push({
            mazeSize: 10,
            startPosition: { x: -4, z: -4 },
            goalPosition: { x: 4, z: 4 },
            innerWalls: [
                [-2, -2, 6, 0.5],
                [2, 0, 0.5, 4],
                [-2, 2, 6, 0.5],
            ],
        });

        this.levels.push({
            mazeSize: 12,
            startPosition: { x: -5, z: -5 },
            goalPosition: { x: 5, z: 5 },
            innerWalls: [
                [-3, -3, 6, 0.5],
                [0, -1, 0.5, 6],
                [-3, 3, 6, 0.5],
                [3, 0, 0.5, 6],
            ],
        });

        this.levels.push({
            mazeSize: 12,
            startPosition: { x: -5, z: -5 },
            goalPosition: { x: 5, z: 5 },
            innerWalls: [
                [0, 0, 0.5, 8],
                [4, 0, 0.5, 8],
                [2, 4, 4, 0.5],
                [2, -4, 4, 0.5],
            ],
        });

        this.levels.push({
            mazeSize: 12,
            startPosition: { x: -5, z: -5 },
            goalPosition: { x: 5, z: 5 },
            innerWalls: [
                [-2, -2, 8, 0.5],
                [-2, 0, 8, 0.5],
                [-2, 2, 8, 0.5],
                [-4, -4, 0.5, 8],
                [0, -4, 0.5, 8],
                [4, -4, 0.5, 8],
            ],
        });

        this.levels.push({
            mazeSize: 14,
            startPosition: { x: -6, z: -6 },
            goalPosition: { x: 0, z: 0 },
            innerWalls: [
                [-5, -5, 10, 0.5],
                [-5, -5, 0.5, 10],
                [-5, 5, 10, 0.5],
                [5, -5, 0.5, 10],
                [-3, -3, 6, 0.5],
                [-3, -3, 0.5, 6],
                [-3, 3, 6, 0.5],
                [3, -3, 0.5, 6],
            ],
        });

        this.levels.push({
            mazeSize: 14,
            startPosition: { x: -6, z: -6 },
            goalPosition: { x: 6, z: 6 },
            innerWalls: [
                [-4, -4, 8, 0.5],
                [0, -2, 0.5, 4],
                [-4, 0, 8, 0.5],
                [0, 2, 0.5, 4],
                [-4, 4, 8, 0.5],
            ],
        });

        this.levels.push({
            mazeSize: 16,
            startPosition: { x: -7, z: -7 },
            goalPosition: { x: 7, z: 7 },
            innerWalls: [
                [-5, -5, 10, 0.5],
                [-5, -5, 0.5, 10],
                [-5, 5, 10, 0.5],
                [5, -5, 0.5, 10],
                [-3, -3, 6, 0.5],
                [-3, -3, 0.5, 6],
                [-3, 3, 6, 0.5],
                [3, -3, 0.5, 6],
                [0, 0, 2, 2],
            ],
        });

        this.levels.push({
            mazeSize: 16,
            startPosition: { x: -7, z: -7 },
            goalPosition: { x: 7, z: 7 },
            innerWalls: [
                [-5, -3, 10, 0.5],
                [-5, 0, 10, 0.5],
                [-5, 3, 10, 0.5],
                [-3, -5, 0.5, 10],
                [0, -5, 0.5, 10],
                [3, -5, 0.5, 10],
            ],
        });

        this.levels.push({
            mazeSize: 16,
            startPosition: { x: -7, z: -7 },
            goalPosition: { x: 7, z: 7 },
            innerWalls: [
                [-6, -4, 12, 0.5],
                [0, -4, 0.5, 8],
                [-6, 4, 12, 0.5],
                [-6, 0, 12, 0.5],
            ],
        });

        this.levels.push({
            mazeSize: 18,
            startPosition: { x: -8, z: -8 },
            goalPosition: { x: 0, z: 0 },
            innerWalls: [
                [-6, -6, 12, 0.5],
                [-6, -6, 0.5, 12],
                [-6, 6, 12, 0.5],
                [6, -6, 0.5, 12],
                [-3, -3, 6, 0.5],
                [-3, -3, 0.5, 6],
                [-3, 3, 6, 0.5],
                [3, -3, 0.5, 6],

                [-6, 0, 0.5, 2],
                [0, -6, 2, 0.5],
                [6, 0, 0.5, 2],
                [0, 6, 2, 0.5],
                [-3, -1, 0.5, 2],
                [0, -3, 2, 0.5],
                [3, 1, 0.5, 2],
                [0, 3, 2, 0.5],
            ],
        });

        this.levels.push({
            mazeSize: 18,
            startPosition: { x: -8, z: -8 },
            goalPosition: { x: 0, z: 0 },
            innerWalls: [
                [-6, -6, 12, 0.5],
                [-6, -6, 0.5, 12],
                [-6, 6, 12, 0.5],
                [6, -6, 0.5, 12],

                [-2, -2, 4, 0.5],
                [-2, -2, 0.5, 4],
                [-2, 2, 4, 0.5],
                [2, -2, 0.5, 4],

                [0, -6, 2, 0.5],
                [0, -6, 0.5, 4],
                [0, -2, 2, 0.5],
            ],
        });

        this.levels.push({
            mazeSize: 20,
            startPosition: { x: -9, z: -9 },
            goalPosition: { x: 9, z: 9 },
            innerWalls: [
                [-7, -7, 14, 0.5],
                [-7, -7, 0.5, 14],
                [-7, 7, 14, 0.5],
                [7, -7, 0.5, 14],

                [-3, -7, 0.5, 10],
                [3, -3, 0.5, 10],
                [-7, -3, 8, 0.5],
                [-3, 3, 10, 0.5],

                [-7, -5, 2, 0.5],
                [-5, -3, 2, 0.5],
                [-3, -1, 2, 0.5],
                [-1, 3, 2, 0.5],
                [3, 5, 2, 0.5],
                [5, 7, 2, 0.5],
            ],
        });

        this.levels.push({
            mazeSize: 20,
            startPosition: { x: -9, z: -9 },
            goalPosition: { x: 9, z: 9 },
            innerWalls: [
                [-8, -4, 16, 0.5],
                [-4, -8, 0.5, 16],
                [4, -8, 0.5, 16],
                [-8, 4, 16, 0.5],

                [-2, -2, 4, 0.5],
                [-2, -2, 0.5, 4],
                [-2, 2, 4, 0.5],
                [2, -2, 0.5, 4],
                [0, 0, 2, 2],
            ],
        });

        this.levels.push({
            mazeSize: 22,
            startPosition: { x: -10, z: -10 },
            goalPosition: { x: 10, z: 10 },
            innerWalls: [
                [-8, -8, 16, 0.5],
                [-8, -8, 0.5, 16],
                [-8, 8, 16, 0.5],
                [8, -8, 0.5, 16],
                [-6, -6, 12, 0.5],
                [-6, -6, 0.5, 12],
                [-6, 6, 12, 0.5],
                [6, -6, 0.5, 12],
                [-4, -4, 8, 0.5],
                [-4, -4, 0.5, 8],
                [-4, 4, 8, 0.5],
                [4, -4, 0.5, 8],

                [-8, 0, 0.5, 2],
                [-6, -2, 0.5, 2],
                [-4, 0, 0.5, 2],
                [-2, -2, 0.5, 2],
                [0, 0, 0.5, 2],
                [2, -2, 0.5, 2],
                [4, 0, 0.5, 2],
                [6, -2, 0.5, 2],
            ],
        });

        this.generateProceduralLevels();
    }

    private generateProceduralLevels() {
        for (let i = 18; i <= 20; i++) {
            const mazeSize = this.getMazeSizeForLevel(i);
            const halfSize = Math.floor(mazeSize / 2);
            this.levels.push({
                mazeSize: mazeSize,
                startPosition: { x: -halfSize + 1, z: -halfSize + 1 },
                goalPosition: { x: halfSize - 1, z: halfSize - 1 },
                innerWalls: this.generateComplexMazeLayout(i),
            });
        }

        for (let i = 21; i <= 50; i++) {
            const mazeSize = this.getMazeSizeForLevel(i);
            const halfSize = Math.floor(mazeSize / 2);
            this.levels.push({
                mazeSize: mazeSize,
                startPosition: { x: -halfSize + 1, z: -halfSize + 1 },
                goalPosition: { x: halfSize - 1, z: halfSize - 1 },
                innerWalls: this.generateComplexMazeLayout(i),
            });
        }
    }

    init() {
        console.log("Initializing 3D Marble Maze game");
        try {
            this.initThreeJS();
            this.createLights();

            this.loadLevel(this.currentLevelIndex);

            this.setupEventListeners();

            this.gameStartTime = Date.now();

            this.startTimer();

            this.animate();

            this.loadHighscores();

            this.updateLevelDisplay();

            this.setupLevelButtons();

            window.dispatchEvent(new Event("gameReady"));
            console.log("Game initialization complete");
        } catch (error) {
            console.error("Error initializing game:", error);
            this.showErrorMessage(
                "Failed to initialize game. Please refresh the page."
            );
        }
    }

    private initThreeJS() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1b1b1b);

        this.scene.fog = new THREE.FogExp2(0x663399, 0.02);

        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 15, 10);
        this.camera.lookAt(0, 0, 0);

        const canvas = document.getElementById(
            "gameCanvas"
        ) as HTMLCanvasElement;
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;

        window.addEventListener("resize", () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    private createLights() {
        const ambientLight = new THREE.AmbientLight(0x663399, 0.4);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xff6600, 0.7);
        directionalLight.position.set(10, 20, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0x44d62c, 0.6, 20);
        pointLight.position.set(0, 5, 0);
        this.scene.add(pointLight);
    }

    private createMaze() {
        this.maze = new THREE.Group();
        this.scene.add(this.maze);

        const floorGeometry = new THREE.BoxGeometry(
            this.mazeSize,
            0.5,
            this.mazeSize
        );
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x1b1b1b,
            roughness: 0.9,
            metalness: 0.1,
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.receiveShadow = true;
        this.maze.add(floor);

        this.createOuterWalls();

        this.createInnerWalls();
    }

    private createOuterWalls() {
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x663399,
            roughness: 0.7,
            metalness: 0.2,
        });

        const wallThickness = 0.5;
        const halfSize = this.mazeSize / 2;

        const outerWalls = [
            {
                pos: [0, this.wallHeight / 2, -halfSize],
                size: [this.mazeSize, this.wallHeight, wallThickness],
            },

            {
                pos: [0, this.wallHeight / 2, halfSize],
                size: [this.mazeSize, this.wallHeight, wallThickness],
            },

            {
                pos: [-halfSize, this.wallHeight / 2, 0],
                size: [wallThickness, this.wallHeight, this.mazeSize],
            },

            {
                pos: [halfSize, this.wallHeight / 2, 0],
                size: [wallThickness, this.wallHeight, this.mazeSize],
            },
        ];

        outerWalls.forEach((wall) => {
            const geometry = new THREE.BoxGeometry(
                wall.size[0],
                wall.size[1],
                wall.size[2]
            );
            const mesh = new THREE.Mesh(geometry, wallMaterial);
            mesh.position.set(wall.pos[0], wall.pos[1], wall.pos[2]);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.maze.add(mesh);
            this.walls.push(mesh);
        });
    }

    private createInnerWalls() {
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b008b,
            roughness: 0.8,
            metalness: 0.1,
        });

        const currentLevel = this.levels[this.currentLevelIndex];
        const innerWalls = currentLevel.innerWalls;

        innerWalls.forEach((wall) => {
            const [x, z, width, depth] = wall;
            const geometry = new THREE.BoxGeometry(
                width,
                this.wallHeight,
                depth
            );
            const mesh = new THREE.Mesh(geometry, wallMaterial);
            mesh.position.set(x, this.wallHeight / 2, z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.maze.add(mesh);
            this.walls.push(mesh);
        });
    }

    private createMarble() {
        const marbleGeometry = new THREE.SphereGeometry(
            this.marbleRadius,
            32,
            32
        );
        const marbleMaterial = new THREE.MeshStandardMaterial({
            color: 0xff6600,
            metalness: 0.6,
            roughness: 0.2,
            emissive: 0xff3300,
            emissiveIntensity: 0.2,
        });

        this.marble = new THREE.Mesh(marbleGeometry, marbleMaterial);
        this.marble.castShadow = true;
        this.marble.receiveShadow = true;

        this.marble.position.set(
            this.startPosition.x,
            this.marbleRadius + 0.25,
            this.startPosition.z
        );

        this.marble.velocity = new THREE.Vector3(0, 0, 0);
        this.marble.isColliding = false;

        this.scene.add(this.marble);
    }

    private createGoal() {
        // Create goal pad geometry and material
        const goalGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32);
        const goalMaterial = new THREE.MeshStandardMaterial({
            color: 0x44D62C, // Bright green goal
            emissive: 0x44D62C,
            emissiveIntensity: 1.0, // Increased intensity
        });

        // Create goal mesh
        this.goal = new THREE.Mesh(goalGeometry, goalMaterial);
        this.goal.position.set(
            this.goalPosition.x,
            0.3, // Slightly above floor
            this.goalPosition.z
        );
        this.goal.receiveShadow = true;

        // Add to maze
        this.maze.add(this.goal);

        // Add a pulsating light above the goal
        const goalLight = new THREE.PointLight(0x44D62C, 1, 5);
        goalLight.position.set(
            this.goalPosition.x,
            1.5, // Above the goal
            this.goalPosition.z
        );
        this.maze.add(goalLight);

        // Create a halo/ring around the goal
        const ringGeometry = new THREE.TorusGeometry(1.2, 0.1, 16, 32);
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0x44D62C,
            emissive: 0x44D62C,
            emissiveIntensity: 0.7,
            transparent: true,
            opacity: 0.7,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.set(
            this.goalPosition.x,
            0.3, // Same height as goal
            this.goalPosition.z
        );
        ring.rotation.x = Math.PI / 2; // Lay flat
        this.maze.add(ring);

        // Add floating arrow pointing to goal
        const arrowHeight = 2.5;
        const arrowGeometry = new THREE.ConeGeometry(0.5, 1, 8);
        const arrowMaterial = new THREE.MeshStandardMaterial({
            color: 0x44D62C,
            emissive: 0x44D62C,
            emissiveIntensity: 0.7,
            transparent: true,
            opacity: 0.8,
        });
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        arrow.position.set(
            this.goalPosition.x,
            arrowHeight, // Above the goal
            this.goalPosition.z
        );
        arrow.rotation.x = Math.PI; // Point downward
        this.maze.add(arrow);

        // Add particle system around the goal
        const particleCount = 30;
        const particleGroup = new THREE.Group();

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 8, 8),
                new THREE.MeshBasicMaterial({
                    color: 0x44D62C,
                    transparent: true,
                    opacity: 0.7,
                })
            );

            // Calculate initial position on a circle around the goal
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 1.5;
            const vertOffset = Math.sin(i * 0.5) * 0.5; // Vertical offset for variation

            particle.position.set(
                this.goalPosition.x + Math.cos(angle) * radius,
                0.5 + vertOffset,
                this.goalPosition.z + Math.sin(angle) * radius
            );

            // Store initial angle and other animation parameters
            particle.userData = {
                angle: angle,
                radius: radius,
                speed: 0.01 + Math.random() * 0.01,
                vertSpeed: 0.005 + Math.random() * 0.01,
                vertDirection: Math.random() > 0.5 ? 1 : -1,
                initialY: 0.5 + vertOffset,
            };

            particleGroup.add(particle);
        }

        this.maze.add(particleGroup);

        // Add animation to the goal light, ring, arrow and particles
        const animate = () => {
            // Pulsating light intensity
            if (goalLight) {
                const time = Date.now() * 0.001;
                goalLight.intensity = 0.8 + Math.sin(time * 2) * 0.4;
            }

            // Rotating ring
            if (ring) {
                ring.rotation.z += 0.005;
            }

            // Floating arrow animation
            if (arrow) {
                const time = Date.now() * 0.001;
                arrow.position.y = arrowHeight + Math.sin(time * 1.5) * 0.2;
                arrow.rotation.z = Math.sin(time) * 0.1;
            }

            // Animate particles
            if (particleGroup) {
                particleGroup.children.forEach((particle: any) => {
                    const data = particle.userData;

                    // Update angle
                    data.angle += data.speed;

                    // Calculate new position
                    particle.position.x =
                        this.goalPosition.x + Math.cos(data.angle) * data.radius;
                    particle.position.z =
                        this.goalPosition.z + Math.sin(data.angle) * data.radius;

                    // Update vertical position
                    const vertOffset =
                        Math.sin(Date.now() * 0.001 + data.angle * 3) * 0.3;
                    particle.position.y = data.initialY + vertOffset;

                    // Pulse opacity
                    particle.material.opacity =
                        0.4 + Math.sin(Date.now() * 0.002 + data.angle) * 0.3;
                });
            }

            requestAnimationFrame(animate);
        };

        animate();
    }

    private handleOrientation(event: DeviceOrientationEvent) {
        if (event.beta !== null && event.gamma !== null) {
            this.mazeTiltZ = THREE.MathUtils.degToRad(event.beta) * 0.1;
            this.mazeTiltX = THREE.MathUtils.degToRad(event.gamma) * 0.1;
        }
    }

    private handleMouseMove(event: MouseEvent) {
        const sensitivity = 0.01;
        this.mazeTiltX =
            (event.clientX / window.innerWidth - 0.5) * Math.PI * sensitivity;
        this.mazeTiltZ =
            (event.clientY / window.innerHeight - 0.5) * Math.PI * sensitivity;
    }

    private togglePause(silent: boolean = false) {
        this._isPaused = !this._isPaused;

        if (!silent) {
            const pauseScreen = document.getElementById("pauseScreen");
            if (pauseScreen) {
                pauseScreen.classList.toggle("hidden");
            }
        }

        if (this._isPaused) {
            this.pauseStartTime = Date.now();
            this.pauseTimer();
        } else {
            if (this.pauseStartTime > 0) {
                const pauseDuration = Date.now() - this.pauseStartTime;
                this.gameStartTime += pauseDuration;
                this.pauseStartTime = 0;
            }
            this.resumeTimer();
        }

        console.log(
            `Game ${this._isPaused ? "paused" : "resumed"}${
                silent ? " (silent)" : ""
            }`
        );
    }

    private startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = window.setInterval(() => {
            if (!this._isPaused && !this.gameWon) {
                this.updateTimerDisplay();
            }
        }, 100);
    }

    private pauseTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    private resumeTimer() {
        this.startTimer();
    }

    private updateTimerDisplay() {
        const currentTime = Date.now();
        this.elapsedTime = (currentTime - this.gameStartTime) / 1000;

        const timerElement = document.getElementById("timer");
        if (timerElement) {
            timerElement.textContent = this.formatTime(this.elapsedTime);
        }
    }

    private formatTime(timeInSeconds: number): string {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        const ms = Math.floor((timeInSeconds % 1) * 100);

        return `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
    }

    private showErrorMessage(message: string) {
        const loadingScreen = document.getElementById("loadingScreen");
        if (loadingScreen) {
            const content = loadingScreen.querySelector(".overlay-content");
            if (content) {
                content.innerHTML = `<h2>Error</h2><p>${message}</p>`;
            }
        }
    }

    private setupEventListeners() {
        if (window.DeviceOrientationEvent) {
            window.addEventListener(
                "deviceorientation",
                this.handleOrientation.bind(this)
            );
        }

        document.addEventListener("mousemove", this.handleMouseMove.bind(this));

        window.addEventListener("keydown", (event) => {
            if (event.key === "p" || event.key === "P") {
                this.togglePause();
            } else if (event.key === "r" || event.key === "R") {
                this.resetMarble();
            }
        });

        this.setupButtonControls();
    }

    private setupButtonControls() {
        (window as any).gameInstance = this;

        const resetBtn = document.getElementById("resetBtn");
        if (resetBtn) {
            resetBtn.addEventListener("click", () => this.resetMarble());
        }

        const pauseBtn = document.getElementById("pauseBtn");
        if (pauseBtn) {
            pauseBtn.addEventListener("click", () => this.togglePause());
        }

        const muteBtn = document.getElementById("muteBtn");
        if (muteBtn) {
            muteBtn.addEventListener("click", () =>
                console.log("Mute functionality not implemented yet")
            );
        }
    }

    private loadLevel(levelIndex: number) {
        if (this.maze) {
            this.scene.remove(this.maze);
            this.walls = [];
        }

        const level = this.levels[levelIndex];

        this.mazeSize = level.mazeSize;
        this.startPosition = level.startPosition;
        this.goalPosition = level.goalPosition;

        this.createMaze();

        if (this.marble) {
            this.scene.remove(this.marble);
        }
        this.createMarble();

        this.gameWon = false;
        this.gameStartTime = Date.now();
        this.gameEndTime = 0;
        this.elapsedTime = 0;
        this.pauseStartTime = 0;
        this._isPaused = false;

        this.updateTimerDisplay();
        this.startTimer();

        this.updateLevelDisplay();

        console.log(`Level ${levelIndex + 1} loaded`);
    }

    private updateLevelDisplay() {
        const levelElement = document.getElementById("level");
        if (levelElement) {
            levelElement.textContent = `Level ${this.currentLevelIndex + 1}`;
        }
    }

    private setupLevelButtons() {
        const nextLevelBtn = document.getElementById("nextLevelBtn");
        if (nextLevelBtn) {
            nextLevelBtn.addEventListener("click", () => this.nextLevel());
        }

        const restartBtn = document.getElementById("restartBtn");
        if (restartBtn) {
            restartBtn.addEventListener("click", () => this.restartLevel());
        }

        const restartGameBtn = document.getElementById("restartGameBtn");
        if (restartGameBtn) {
            restartGameBtn.addEventListener("click", () => {
                const pauseScreen = document.getElementById("pauseScreen");
                if (pauseScreen) {
                    pauseScreen.classList.add("hidden");
                }
                this.restartLevel();
            });
        }
    }

    public nextLevel() {
        const winScreen = document.getElementById("winScreen");
        if (winScreen) {
            winScreen.classList.add("hidden");
        }

        if (this.currentLevelIndex < this.levels.length - 1) {
            this.currentLevelIndex++;
            this.loadLevel(this.currentLevelIndex);
        } else {
            console.log("All levels completed! Starting from the beginning.");
            this.currentLevelIndex = 0;
            this.loadLevel(this.currentLevelIndex);
        }
    }

    public restartLevel() {
        const winScreen = document.getElementById("winScreen");
        if (winScreen) {
            winScreen.classList.add("hidden");
        }

        this.loadLevel(this.currentLevelIndex);
    }

    public resetMarble() {
        this.marble.position.set(
            this.startPosition.x,
            this.marbleRadius + 0.25,
            this.startPosition.z
        );

        this.marble.velocity.set(0, 0, 0);

        if (this.gameWon) {
            this.gameWon = false;

            this.marble.material.color.set(0xff6600);

            this.gameStartTime = Date.now();
            this.gameEndTime = 0;
            this.elapsedTime = 0;
            this.updateTimerDisplay();

            if (!this.timerInterval) {
                this.startTimer();
            }
        }

        console.log("Marble reset to start position");
    }

    private updateMarblePhysics() {
        if (this.gameWon) return;

        const gravity = 0.05;
        const friction = 0.98;
        const bounceFactor = 0.7;

        const gravityX = Math.sin(this.mazeTiltX) * gravity;
        const gravityZ = Math.sin(this.mazeTiltZ) * gravity;

        this.marble.velocity.x += gravityX;
        this.marble.velocity.z += gravityZ;

        this.marble.velocity.x *= friction;
        this.marble.velocity.z *= friction;

        const prevX = this.marble.position.x;
        const prevZ = this.marble.position.z;

        this.marble.position.x += this.marble.velocity.x;
        this.marble.position.z += this.marble.velocity.z;

        const halfSize = this.mazeSize / 2 - this.marbleRadius;

        if (this.marble.position.x > halfSize) {
            this.marble.position.x = halfSize;
            this.marble.velocity.x *= -bounceFactor;
        } else if (this.marble.position.x < -halfSize) {
            this.marble.position.x = -halfSize;
            this.marble.velocity.x *= -bounceFactor;
        }

        if (this.marble.position.z > halfSize) {
            this.marble.position.z = halfSize;
            this.marble.velocity.z *= -bounceFactor;
        } else if (this.marble.position.z < -halfSize) {
            this.marble.position.z = -halfSize;
            this.marble.velocity.z *= -bounceFactor;
        }

        this.checkWallCollisions(prevX, prevZ);

        this.checkGoal();
    }

    private checkWallCollisions(prevX: number, prevZ: number) {
        for (const wall of this.walls) {
            const wallWidth = wall.geometry.parameters.width;
            const wallDepth = wall.geometry.parameters.depth;
            const wallX = wall.position.x;
            const wallZ = wall.position.z;

            const wallMinX = wallX - wallWidth / 2 - this.marbleRadius;
            const wallMaxX = wallX + wallWidth / 2 + this.marbleRadius;
            const wallMinZ = wallZ - wallDepth / 2 - this.marbleRadius;
            const wallMaxZ = wallZ + wallDepth / 2 + this.marbleRadius;

            if (
                this.marble.position.x > wallMinX &&
                this.marble.position.x < wallMaxX &&
                this.marble.position.z > wallMinZ &&
                this.marble.position.z < wallMaxZ
            ) {
                const distToMinX = Math.abs(this.marble.position.x - wallMinX);
                const distToMaxX = Math.abs(this.marble.position.x - wallMaxX);
                const distToMinZ = Math.abs(this.marble.position.z - wallMinZ);
                const distToMaxZ = Math.abs(this.marble.position.z - wallMaxZ);

                const minDist = Math.min(
                    distToMinX,
                    distToMaxX,
                    distToMinZ,
                    distToMaxZ
                );

                if (minDist === distToMinX) {
                    this.marble.position.x = wallMinX;
                    this.marble.velocity.x *= -0.5;
                } else if (minDist === distToMaxX) {
                    this.marble.position.x = wallMaxX;
                    this.marble.velocity.x *= -0.5;
                } else if (minDist === distToMinZ) {
                    this.marble.position.z = wallMinZ;
                    this.marble.velocity.z *= -0.5;
                } else if (minDist === distToMaxZ) {
                    this.marble.position.z = wallMaxZ;
                    this.marble.velocity.z *= -0.5;
                }

                break;
            }
        }
    }

    private checkGoal() {
        const dx = this.marble.position.x - this.goalPosition.x;
        const dz = this.marble.position.z - this.goalPosition.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < 0.7 && !this.gameWon) {
            console.log("Goal reached! You win!");
            this.gameWon = true;

            this.gameEndTime = Date.now();
            this.elapsedTime = (this.gameEndTime - this.gameStartTime) / 1000;

            this.pauseTimer();

            this.marble.material.color.set(0x44d62c);

            this.createWinParticles();

            this.showWinScreen(this.elapsedTime);

            this.promptForNameAndSubmitScore(this.elapsedTime);
        }
    }

    private createWinParticles() {
        const particleCount = 50;
        const particles = new THREE.Group();

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 8, 8),
                new THREE.MeshBasicMaterial({
                    color: i % 2 === 0 ? 0xff6600 : 0x44d62c,
                    transparent: true,
                    opacity: 0.8,
                })
            );

            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 2;
            particle.position.set(
                this.goalPosition.x + Math.cos(angle) * radius,
                0.5 + Math.random() * 2,
                this.goalPosition.z + Math.sin(angle) * radius
            );

            particle.userData = {
                velocity: new THREE.Vector3(
                    Math.random() * 0.05 - 0.025,
                    Math.random() * 0.1 + 0.05,
                    Math.random() * 0.05 - 0.025
                ),
                life: 60 + Math.random() * 60,
            };

            particles.add(particle);
        }

        this.scene.add(particles);

        const animateParticles = () => {
            if (particles.children.length === 0) {
                this.scene.remove(particles);
                return;
            }

            for (let i = particles.children.length - 1; i >= 0; i--) {
                const particle = particles.children[i];
                const userData = particle.userData;

                particle.position.add(userData.velocity);

                userData.velocity.y -= 0.002;

                particle.material.opacity -= 0.01;

                userData.life--;
                if (userData.life <= 0 || particle.position.y < 0) {
                    particles.remove(particle);
                }
            }

            if (particles.children.length > 0) {
                requestAnimationFrame(animateParticles);
            }
        };

        animateParticles();
    }

    private showWinScreen(timeSeconds: number) {
        const winScreen = document.getElementById("winScreen");
        const timeSpan = document.querySelector("#completionTime span");

        if (winScreen && timeSpan) {
            const minutes = Math.floor(timeSeconds / 60);
            const seconds = Math.floor(timeSeconds % 60);
            const ms = Math.floor((timeSeconds % 1) * 100);

            const formattedTime = `${minutes
                .toString()
                .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${ms
                .toString()
                .padStart(2, "0")}`;
            timeSpan.textContent = formattedTime;

            const winTitle = winScreen.querySelector("h2");
            if (winTitle) {
                winTitle.textContent = `Level ${
                    this.currentLevelIndex + 1
                } Complete!`;
            }

            const nextLevelBtn = document.getElementById("nextLevelBtn");
            if (nextLevelBtn) {
                if (this.currentLevelIndex >= this.levels.length - 1) {
                    nextLevelBtn.textContent = "Back to Level 1";
                } else {
                    nextLevelBtn.textContent = "Next Level";
                }
            }

            winScreen.classList.remove("hidden");
        }
    }

    private promptForNameAndSubmitScore(timeSeconds: number) {
        const playerName = prompt(
            "Congratulations! Enter your name for the leaderboard:",
            "Player"
        );

        if (playerName) {
            this.submitHighscore(playerName, 0, timeSeconds, 1);
        }
    }

    private async submitHighscore(
        playerName: string,
        score: number,
        timeSeconds: number,
        level: number
    ) {
        try {
            const response = await fetch("/api/submit-score", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    playerName: playerName,
                    score: score,
                    time: timeSeconds,
                    level: this.currentLevelIndex + 1,
                }),
            });

            const result = await response.json();
            console.log("Score submission result:", result);

            if (result.qualified) {
                console.log("New highscore!");

                this.showHighscoresPanel();
            }
        } catch (error) {
            console.error("Failed to submit score:", error);
        }
    }

    private showHighscoresPanel() {
        const highscoresPanel = document.getElementById("highscoresPanel");
        if (highscoresPanel) {
            highscoresPanel.classList.add("active");

            this.loadHighscores();
        }
    }

    private async loadHighscores() {
        try {
            const response = await fetch("/api/highscores");
            const highscores = await response.json();

            console.log("Highscores loaded:", highscores);

            this.displayHighscoresInUI(highscores);
        } catch (error) {
            console.error("Failed to load highscores:", error);
        }
    }

    private displayHighscoresInUI(highscores: any[]) {
        const highscoresList = document.getElementById("highscoresList");
        if (!highscoresList) return;

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

        highscores.forEach((score, index) => {
            const date = new Date(score.date).toLocaleDateString();
            const formattedTime = this.formatTime(score.time);

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
    }

    private animate() {
        requestAnimationFrame(this.animate.bind(this));

        if (!this._isPaused) {
            this.maze.rotation.z = this.mazeTiltX;
            this.maze.rotation.x = this.mazeTiltZ;

            this.updateMarblePhysics();
        }

        this.renderer.render(this.scene, this.camera);
    }
}

const game = new Game();

function initgame() {
    game.init();
}

window.addEventListener("load", function () {
    initgame();
    console.log("3D Marble Maze Game initialized");
});
