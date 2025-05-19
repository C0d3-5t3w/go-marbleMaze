// Ensure Three.js is already loaded via CDN
declare var THREE: any;

// Level structure definition
interface Level {
    mazeSize: number;
    startPosition: { x: number, z: number };
    goalPosition: { x: number, z: number };
    innerWalls: [number, number, number, number][]; // [x, z, width, depth]
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
    private goalPosition: { x: number, z: number } = { x: 4, z: 4 };
    private startPosition: { x: number, z: number } = { x: -4, z: -4 };
    private gameWon: boolean = false;
    private walls: any[] = [];
    private goal: any;
    private currentLevelIndex: number = 0;
    private timerInterval: number | null = null;
    
    // Add missing property declarations
    private _isPaused: boolean = false;
    private gameStartTime: number = 0;
    private gameEndTime: number = 0;
    private elapsedTime: number = 0;
    private pauseStartTime: number = 0;
    
    // Define levels
    private levels: Level[] = [];

    // Add getter for isPaused to make it accessible
    public get isPaused(): boolean {
        return this._isPaused;
    }

    constructor() {
        console.log("Game constructor called");
        // Initialize the levels
        this.initializeLevels();
    }

    // Generate a complex maze layout procedurally
    private generateComplexMazeLayout(levelIndex: number): [number, number, number, number][] {
        // This is a simplified generator - you might want to implement a more
        // sophisticated maze generation algorithm for a real game
        const walls: [number, number, number, number][] = [];
        const seed = levelIndex * 12345; // Simple "random" seed based on level
        const random = (min: number, max: number) => {
            // Simple deterministic random function
            const x = Math.sin(seed + walls.length) * 10000;
            return min + (x - Math.floor(x)) * (max - min);
        };
        
        // Number of walls increases with level
        const numWalls = 10 + Math.min(40, Math.floor(levelIndex * 1.5));
        
        // Create some systematic walls first (to ensure it's solvable)
        const mazeSize = this.getMazeSizeForLevel(levelIndex); 
        const halfSize = Math.floor(mazeSize / 2) - 1;
        
        // Add some systematic walls
        for (let i = 0; i < 5; i++) {
            const offset = i * 2;
            // Horizontal walls with gaps
            walls.push([-halfSize + offset, -halfSize + i, halfSize * 2 - offset * 2 - 2, 0.5]);
            walls.push([-halfSize + i, halfSize - offset, halfSize * 2 - offset * 2 - 2, 0.5]);
            
            // Leave some gaps for paths
            const gapX = Math.floor(random(-halfSize + 2, halfSize - 2));
            const gapWidth = 1 + Math.floor(random(1, 3));
            // Add vertical walls
            walls.push([-halfSize + i, -halfSize + offset + 1, 0.5, 2]);
            walls.push([halfSize - i, -halfSize + offset + 1, 0.5, 2]);
        }
        
        // Add some random obstacles
        for (let i = 0; i < numWalls - 10; i++) {
            const x = Math.floor(random(-halfSize + 1, halfSize - 1));
            const z = Math.floor(random(-halfSize + 1, halfSize - 1));
            const width = Math.floor(random(1, 4));
            const depth = Math.floor(random(1, 4));
            walls.push([x, z, width, depth]);
        }
        
        return walls;
    }

    // Helper function to get maze size for a level index
    private getMazeSizeForLevel(levelIndex: number): number {
        if (levelIndex < 17) {
            // First 17 levels have explicit sizes
            const sizes = [10, 10, 10, 10, 12, 12, 12, 14, 14, 16, 16, 16, 18, 18, 20, 20, 22];
            return sizes[levelIndex];
        } else if (levelIndex < 20) {
            return 22 + (levelIndex - 17) * 2; // Levels 18-19
        } else {
            // Levels 20+ grow in size incrementally
            return Math.min(50, 26 + Math.floor((levelIndex - 20) / 5) * 2);
        }
    }

    // Initialize all levels
    private initializeLevels() {
        // Level 1 - Simple intro level
        this.levels.push({
            mazeSize: 10,
            startPosition: { x: -4, z: -4 },
            goalPosition: { x: 4, z: 4 },
            innerWalls: [
                [0, 0, 0.5, 4] // Simple vertical wall in the middle
            ]
        });

        // Level 2 - Add a second wall
        this.levels.push({
            mazeSize: 10,
            startPosition: { x: -4, z: -4 },
            goalPosition: { x: 4, z: 4 },
            innerWalls: [
                [0, 0, 0.5, 4],
                [-2, 2, 4, 0.5]
            ]
        });

        // Level 3 - More complex path
        this.levels.push({
            mazeSize: 10,
            startPosition: { x: -4, z: -4 },
            goalPosition: { x: 4, z: 4 },
            innerWalls: [
                [0, 0, 0.5, 6],
                [-3, -2, 4, 0.5],
                [3, 2, 4, 0.5]
            ]
        });

        // Level 4 - Zigzag path
        this.levels.push({
            mazeSize: 10,
            startPosition: { x: -4, z: -4 },
            goalPosition: { x: 4, z: 4 },
            innerWalls: [
                [-2, -2, 6, 0.5],
                [2, 0, 0.5, 4],
                [-2, 2, 6, 0.5]
            ]
        });

        // Level 5 - Slightly larger maze
        this.levels.push({
            mazeSize: 12,
            startPosition: { x: -5, z: -5 },
            goalPosition: { x: 5, z: 5 },
            innerWalls: [
                [-3, -3, 6, 0.5],
                [0, -1, 0.5, 6],
                [-3, 3, 6, 0.5],
                [3, 0, 0.5, 6]
            ]
        });

        // Level 6 - Enclosed goal
        this.levels.push({
            mazeSize: 12,
            startPosition: { x: -5, z: -5 },
            goalPosition: { x: 5, z: 5 },
            innerWalls: [
                [0, 0, 0.5, 8],
                [4, 0, 0.5, 8],
                [2, 4, 4, 0.5],
                [2, -4, 4, 0.5]
            ]
        });

        // Level 7 - Multiple paths
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
                [4, -4, 0.5, 8]
            ]
        });

        // Level 8 - Spiral pattern
        this.levels.push({
            mazeSize: 14,
            startPosition: { x: -6, z: -6 },
            goalPosition: { x: 0, z: 0 },
            innerWalls: [
                [-5, -5, 10, 0.5],  // Bottom horizontal
                [-5, -5, 0.5, 10],  // Left vertical
                [-5, 5, 10, 0.5],   // Top horizontal
                [5, -5, 0.5, 10],   // Right vertical
                [-3, -3, 6, 0.5],   // Inner bottom
                [-3, -3, 0.5, 6],   // Inner left
                [-3, 3, 6, 0.5],    // Inner top
                [3, -3, 0.5, 6]     // Inner right
            ]
        });

        // Level 9 - Narrow passages
        this.levels.push({
            mazeSize: 14,
            startPosition: { x: -6, z: -6 },
            goalPosition: { x: 6, z: 6 },
            innerWalls: [
                [-4, -4, 8, 0.5],
                [0, -2, 0.5, 4],
                [-4, 0, 8, 0.5],
                [0, 2, 0.5, 4],
                [-4, 4, 8, 0.5]
            ]
        });

        // Level 10 - More complex with obstacles
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
                [0, 0, 2, 2]  // Center obstacle
            ]
        });

        // Level 11 - Grid pattern
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
                [3, -5, 0.5, 10]
            ]
        });

        // Level 12 - Zigzag path 2
        this.levels.push({
            mazeSize: 16,
            startPosition: { x: -7, z: -7 },
            goalPosition: { x: 7, z: 7 },
            innerWalls: [
                [-6, -4, 12, 0.5],
                [0, -4, 0.5, 8],
                [-6, 4, 12, 0.5],
                [-6, 0, 12, 0.5]
            ]
        });

        // Level 13 - Concentric squares
        this.levels.push({
            mazeSize: 18,
            startPosition: { x: -8, z: -8 },
            goalPosition: { x: 0, z: 0 },
            innerWalls: [
                [-6, -6, 12, 0.5],  // Outer bottom
                [-6, -6, 0.5, 12],  // Outer left
                [-6, 6, 12, 0.5],   // Outer top
                [6, -6, 0.5, 12],   // Outer right
                [-3, -3, 6, 0.5],   // Inner bottom
                [-3, -3, 0.5, 6],   // Inner left
                [-3, 3, 6, 0.5],    // Inner top
                [3, -3, 0.5, 6],    // Inner right
                // Openings in the walls
                [-6, 0, 0.5, 2],    // Opening in outer left
                [0, -6, 2, 0.5],    // Opening in outer bottom
                [6, 0, 0.5, 2],     // Opening in outer right
                [0, 6, 2, 0.5],     // Opening in outer top
                [-3, -1, 0.5, 2],   // Opening in inner left
                [0, -3, 2, 0.5],    // Opening in inner bottom
                [3, 1, 0.5, 2],     // Opening in inner right
                [0, 3, 2, 0.5]      // Opening in inner top
            ]
        });

        // Level 14 - Maze with central chamber
        this.levels.push({
            mazeSize: 18,
            startPosition: { x: -8, z: -8 },
            goalPosition: { x: 0, z: 0 },
            innerWalls: [
                // Outer walls
                [-6, -6, 12, 0.5],
                [-6, -6, 0.5, 12],
                [-6, 6, 12, 0.5],
                [6, -6, 0.5, 12],
                // Inner chamber
                [-2, -2, 4, 0.5],
                [-2, -2, 0.5, 4],
                [-2, 2, 4, 0.5],
                [2, -2, 0.5, 4],
                // Access path
                [0, -6, 2, 0.5],
                [0, -6, 0.5, 4],
                [0, -2, 2, 0.5]
            ]
        });

        // Level 15 - Complex with multiple chambers
        this.levels.push({
            mazeSize: 20,
            startPosition: { x: -9, z: -9 },
            goalPosition: { x: 9, z: 9 },
            innerWalls: [
                // Outer boundary
                [-7, -7, 14, 0.5],
                [-7, -7, 0.5, 14],
                [-7, 7, 14, 0.5],
                [7, -7, 0.5, 14],
                // Internal divisions
                [-3, -7, 0.5, 10],
                [3, -3, 0.5, 10],
                [-7, -3, 8, 0.5],
                [-3, 3, 10, 0.5],
                // Passages
                [-7, -5, 2, 0.5],
                [-5, -3, 2, 0.5],
                [-3, -1, 2, 0.5],
                [-1, 3, 2, 0.5],
                [3, 5, 2, 0.5],
                [5, 7, 2, 0.5]
            ]
        });

        // Level 16
        this.levels.push({
            mazeSize: 20,
            startPosition: { x: -9, z: -9 },
            goalPosition: { x: 9, z: 9 },
            innerWalls: [
                // Create a complex pattern here
                [-8, -4, 16, 0.5],
                [-4, -8, 0.5, 16],
                [4, -8, 0.5, 16],
                [-8, 4, 16, 0.5],
                // Add obstacles
                [-2, -2, 4, 0.5],
                [-2, -2, 0.5, 4],
                [-2, 2, 4, 0.5],
                [2, -2, 0.5, 4],
                [0, 0, 2, 2]
            ]
        });

        // Level 17
        this.levels.push({
            mazeSize: 22,
            startPosition: { x: -10, z: -10 },
            goalPosition: { x: 10, z: 10 },
            innerWalls: [
                // Create a more complex spiral
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
                // Add openings
                [-8, 0, 0.5, 2],
                [-6, -2, 0.5, 2],
                [-4, 0, 0.5, 2],
                [-2, -2, 0.5, 2],
                [0, 0, 0.5, 2],
                [2, -2, 0.5, 2],
                [4, 0, 0.5, 2],
                [6, -2, 0.5, 2]
            ]
        });

        // Generate procedural levels
        this.generateProceduralLevels();
    }

    // Generate procedural levels (18-50)
    private generateProceduralLevels() {
        // Levels 18-20
        for (let i = 18; i <= 20; i++) {
            const mazeSize = this.getMazeSizeForLevel(i);
            const halfSize = Math.floor(mazeSize / 2);
            this.levels.push({
                mazeSize: mazeSize,
                startPosition: { x: -halfSize + 1, z: -halfSize + 1 },
                goalPosition: { x: halfSize - 1, z: halfSize - 1 },
                innerWalls: this.generateComplexMazeLayout(i)
            });
        }

        // Levels 21-50 - Generated programmatically
        for (let i = 21; i <= 50; i++) {
            const mazeSize = this.getMazeSizeForLevel(i);
            const halfSize = Math.floor(mazeSize / 2);
            this.levels.push({
                mazeSize: mazeSize,
                startPosition: { x: -halfSize + 1, z: -halfSize + 1 },
                goalPosition: { x: halfSize - 1, z: halfSize - 1 },
                innerWalls: this.generateComplexMazeLayout(i)
            });
        }
    }

    init() {
        console.log("Initializing 3D Marble Maze game");
        try {
            this.initThreeJS();
            this.createLights();
            
            // Load first level instead of hardcoded maze
            this.loadLevel(this.currentLevelIndex);
            
            this.setupEventListeners();
            
            // Set the start time when initializing
            this.gameStartTime = Date.now();
            
            // Start the timer
            this.startTimer();
            
            this.animate();
            
            // Load highscores on initialization
            this.loadHighscores();
            
            // Setup level UI elements
            this.updateLevelDisplay();
            
            // Connect win screen buttons
            this.setupLevelButtons();
            
            // Notify that game is ready
            window.dispatchEvent(new Event('gameReady'));
            console.log("Game initialization complete");
        } catch (error) {
            console.error("Error initializing game:", error);
            this.showErrorMessage("Failed to initialize game. Please refresh the page.");
        }
    }

    private initThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1B1B1B); // Dark background
        
        // Halloween fog
        this.scene.fog = new THREE.FogExp2(0x663399, 0.02); // Purple fog
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, window.innerWidth / window.innerHeight, 0.1, 1000
        );
        this.camera.position.set(0, 15, 10);
        this.camera.lookAt(0, 0, 0);

        // Create renderer
        const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    private createLights() {
        // Ambient light - spooky dim light
        const ambientLight = new THREE.AmbientLight(0x663399, 0.4); // Purple ambient light
        this.scene.add(ambientLight);

        // Directional light - orange like a pumpkin glow
        const directionalLight = new THREE.DirectionalLight(0xFF6600, 0.7);
        directionalLight.position.set(10, 20, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);
        
        // Add a green point light for spooky effect
        const pointLight = new THREE.PointLight(0x44D62C, 0.6, 20);
        pointLight.position.set(0, 5, 0);
        this.scene.add(pointLight);
    }

    private createMaze() {
        // Create a group to hold all maze components
        this.maze = new THREE.Group();
        this.scene.add(this.maze);

        // Floor - darker floor
        const floorGeometry = new THREE.BoxGeometry(this.mazeSize, 0.5, this.mazeSize);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x1B1B1B, // Almost black
            roughness: 0.9,
            metalness: 0.1,
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.receiveShadow = true;
        this.maze.add(floor);

        // Outer walls
        this.createOuterWalls();
        
        // Inner maze walls
        this.createInnerWalls();
    }

    private createOuterWalls() {
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x663399, // Purple walls
            roughness: 0.7,
            metalness: 0.2,
        });
        
        // Parameters for outer walls
        const wallThickness = 0.5;
        const halfSize = this.mazeSize / 2;
        
        // Create outer walls
        const outerWalls = [
            // Back wall
            { pos: [0, this.wallHeight/2, -halfSize], size: [this.mazeSize, this.wallHeight, wallThickness] },
            // Front wall
            { pos: [0, this.wallHeight/2, halfSize], size: [this.mazeSize, this.wallHeight, wallThickness] },
            // Left wall
            { pos: [-halfSize, this.wallHeight/2, 0], size: [wallThickness, this.wallHeight, this.mazeSize] },
            // Right wall
            { pos: [halfSize, this.wallHeight/2, 0], size: [wallThickness, this.wallHeight, this.mazeSize] }
        ];
        
        outerWalls.forEach(wall => {
            const geometry = new THREE.BoxGeometry(wall.size[0], wall.size[1], wall.size[2]);
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
            color: 0x8B008B, // Dark magenta for inner walls
            roughness: 0.8,
            metalness: 0.1
    });
    
        // Get current level inner walls
        const currentLevel = this.levels[this.currentLevelIndex];
        const innerWalls = currentLevel.innerWalls;
        
        innerWalls.forEach(wall => {
            const [x, z, width, depth] = wall;
            const geometry = new THREE.BoxGeometry(width, this.wallHeight, depth);
            const mesh = new THREE.Mesh(geometry, wallMaterial);
            mesh.position.set(x, this.wallHeight/2, z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.maze.add(mesh);
            this.walls.push(mesh);
        });
    }

    private createMarble() {
        // Create marble geometry and material
        const marbleGeometry = new THREE.SphereGeometry(this.marbleRadius, 32, 32);
        const marbleMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF6600, // Orange marble like a pumpkin
            metalness: 0.6,
            roughness: 0.2,
            emissive: 0xFF3300, // Slight glow
            emissiveIntensity: 0.2
        });
        
        // Create marble mesh
        this.marble = new THREE.Mesh(marbleGeometry, marbleMaterial);
        this.marble.castShadow = true;
        this.marble.receiveShadow = true;
        
        // Set initial position at start position
        this.marble.position.set(
            this.startPosition.x, 
            this.marbleRadius + 0.25, // Place on floor with offset
            this.startPosition.z
        );
        
        // Add physics properties to marble
        this.marble.velocity = new THREE.Vector3(0, 0, 0);
        this.marble.isColliding = false;
        
        // Add to scene
        this.scene.add(this.marble);
    }

    private createGoal() {
        // Create goal pad geometry and material
        const goalGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32);
        const goalMaterial = new THREE.MeshStandardMaterial({
            color: 0x44D62C, // Bright green goal
            emissive: 0x44D62C, 
            emissiveIntensity: 1.0, // Stronger glow (increased from 0.8)
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
            opacity: 0.7
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.set(
            this.goalPosition.x,
            0.3, // Same height as goal
            this.goalPosition.z
        );
        ring.rotation.x = Math.PI / 2; // Lay flat
        this.maze.add(ring);
        
        // Add animation to the goal light and ring
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
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    // Define these methods before they're used
    private handleOrientation(event: DeviceOrientationEvent) {
        if (event.beta !== null && event.gamma !== null) {
            // Convert degrees to radians and scale down for smoother control
            this.mazeTiltZ = THREE.MathUtils.degToRad(event.beta) * 0.1;
            this.mazeTiltX = THREE.MathUtils.degToRad(event.gamma) * 0.1;
        }
    }

    private handleMouseMove(event: MouseEvent) {
        // Map mouse position to tilt angle
        const sensitivity = 0.01;
        this.mazeTiltX = ((event.clientX / window.innerWidth) - 0.5) * Math.PI * sensitivity;
        this.mazeTiltZ = ((event.clientY / window.innerHeight) - 0.5) * Math.PI * sensitivity;
    }

    private togglePause(silent: boolean = false) {
        this._isPaused = !this._isPaused;
        
        // Show/hide pause screen (but only if not in silent mode)
        if (!silent) {
            const pauseScreen = document.getElementById('pauseScreen');
            if (pauseScreen) {
                pauseScreen.classList.toggle('hidden');
            }
        }
        
        // Handle timer pause/resume
        if (this._isPaused) {
            this.pauseStartTime = Date.now();
            this.pauseTimer();
        } else {
            // Adjust game start time to account for pause duration
            if (this.pauseStartTime > 0) {
                const pauseDuration = Date.now() - this.pauseStartTime;
                this.gameStartTime += pauseDuration;
                this.pauseStartTime = 0;
            }
            this.resumeTimer();
        }
        
        console.log(`Game ${this._isPaused ? 'paused' : 'resumed'}${silent ? ' (silent)' : ''}`);
    }
    
    private startTimer() {
        // Clear any existing timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Update the timer every 100ms
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
        
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = this.formatTime(this.elapsedTime);
        }
    }
    
    private formatTime(timeInSeconds: number): string {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        const ms = Math.floor((timeInSeconds % 1) * 100);
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }

    private showErrorMessage(message: string) {
        // Show error in the UI instead of console
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            const content = loadingScreen.querySelector('.overlay-content');
            if (content) {
                content.innerHTML = `<h2>Error</h2><p>${message}</p>`;
            }
        }
    }

    private setupEventListeners() {
        // Setup device orientation tilt controls
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
        }
        
        // Fallback to mouse for desktop
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        
        // Add pause functionality
        window.addEventListener('keydown', (event) => {
            if (event.key === 'p' || event.key === 'P') {
                this.togglePause();
            } else if (event.key === 'r' || event.key === 'R') {
                this.resetMarble();
            }
        });

        // Also allow the game to be controlled via virtual buttons
        this.setupButtonControls();
    }

    private setupButtonControls() {
        // Expose game methods to window for button access
        (window as any).gameInstance = this;
        
        // Reset button
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetMarble());
        }
        
        // Pause button
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }
        
        // Mute button (if implemented)
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => console.log('Mute functionality not implemented yet'));
        }
    }

    private loadLevel(levelIndex: number) {
        // Clear existing maze if any
        if (this.maze) {
            this.scene.remove(this.maze);
            this.walls = [];
        }
        
        // Get level data
        const level = this.levels[levelIndex];
        
        // Update properties
        this.mazeSize = level.mazeSize;
        this.startPosition = level.startPosition;
        this.goalPosition = level.goalPosition;
        
        // Create maze
        this.createMaze();
        
        // Create marble at start position
        if (this.marble) {
            this.scene.remove(this.marble);
        }
        this.createMarble();
        
        // Reset game state
        this.gameWon = false;
        this.gameStartTime = Date.now();
        this.gameEndTime = 0;
        this.elapsedTime = 0;
        this.pauseStartTime = 0;
        this._isPaused = false;
        
        // Reset and start the timer
        this.updateTimerDisplay();
        this.startTimer();
        
        // Update level display
        this.updateLevelDisplay();
        
        console.log(`Level ${levelIndex + 1} loaded`);
    }

    private updateLevelDisplay() {
        const levelElement = document.getElementById('level');
        if (levelElement) {
            levelElement.textContent = `Level ${this.currentLevelIndex + 1}`;
        }
    }

    private setupLevelButtons() {
        // Next Level button
        const nextLevelBtn = document.getElementById('nextLevelBtn');
        if (nextLevelBtn) {
            nextLevelBtn.addEventListener('click', () => this.nextLevel());
        }
        
        // Restart button in win screen
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restartLevel());
        }
        
        // Restart button in pause screen
        const restartGameBtn = document.getElementById('restartGameBtn');
        if (restartGameBtn) {
            restartGameBtn.addEventListener('click', () => {
                const pauseScreen = document.getElementById('pauseScreen');
                if (pauseScreen) {
                    pauseScreen.classList.add('hidden');
                }
                this.restartLevel();
            });
        }
    }

    public nextLevel() {
        // Hide win screen
        const winScreen = document.getElementById('winScreen');
        if (winScreen) {
            winScreen.classList.add('hidden');
        }
        
        // Go to next level if not at max
        if (this.currentLevelIndex < this.levels.length - 1) {
            this.currentLevelIndex++;
            this.loadLevel(this.currentLevelIndex);
        } else {
            // Show game completion screen or loop back to first level
            console.log("All levels completed! Starting from the beginning.");
            this.currentLevelIndex = 0;
            this.loadLevel(this.currentLevelIndex);
        }
    }

    public restartLevel() {
        // Hide any overlay screens
        const winScreen = document.getElementById('winScreen');
        if (winScreen) {
            winScreen.classList.add('hidden');
        }
        
        // Reload current level
        this.loadLevel(this.currentLevelIndex);
    }

    public resetMarble() {
        // Reset marble position to start position
        this.marble.position.set(
            this.startPosition.x, 
            this.marbleRadius + 0.25, // Place on floor with slight offset
            this.startPosition.z
        );
        
        // Reset velocity
        this.marble.velocity.set(0, 0, 0);
        
        // Reset win state if needed
        if (this.gameWon) {
            this.gameWon = false;
            
            // Reset the marble color back to pumpkin orange
            this.marble.material.color.set(0xFF6600);
            
            // Reset timer if needed
            this.gameStartTime = Date.now();
            this.gameEndTime = 0;
            this.elapsedTime = 0;
            this.updateTimerDisplay();
            
            // Restart timer if it was stopped
            if (!this.timerInterval) {
                this.startTimer();
            }
        }
        
        console.log("Marble reset to start position");
    }

    private updateMarblePhysics() {
        if (this.gameWon) return;
        
        // Constants for physics simulation
        const gravity = 0.05;
        const friction = 0.98;
        const bounceFactor = 0.7;
        
        // Apply gravity based on maze tilt
        const gravityX = Math.sin(this.mazeTiltX) * gravity;
        const gravityZ = Math.sin(this.mazeTiltZ) * gravity;
        
        // Update velocity
        this.marble.velocity.x += gravityX;
        this.marble.velocity.z += gravityZ;
        
        // Apply friction
        this.marble.velocity.x *= friction;
        this.marble.velocity.z *= friction;
        
        // Store previous position for collision handling
        const prevX = this.marble.position.x;
        const prevZ = this.marble.position.z;
        
        // Update position
        this.marble.position.x += this.marble.velocity.x;
        this.marble.position.z += this.marble.velocity.z;
        
        // Check collision with outer boundaries
        const halfSize = this.mazeSize / 2 - this.marbleRadius;
        
        // X-axis boundaries
        if (this.marble.position.x > halfSize) {
            this.marble.position.x = halfSize;
            this.marble.velocity.x *= -bounceFactor;
        } else if (this.marble.position.x < -halfSize) {
            this.marble.position.x = -halfSize;
            this.marble.velocity.x *= -bounceFactor;
        }
        
        // Z-axis boundaries
        if (this.marble.position.z > halfSize) {
            this.marble.position.z = halfSize;
            this.marble.velocity.z *= -bounceFactor;
        } else if (this.marble.position.z < -halfSize) {
            this.marble.position.z = -halfSize;
            this.marble.velocity.z *= -bounceFactor;
        }
        
        // Check collision with inner walls
        this.checkWallCollisions(prevX, prevZ);
        
        // Check if marble reached goal
        this.checkGoal();
    }

    private checkWallCollisions(prevX: number, prevZ: number) {
        // Basic collision detection with walls
        for (const wall of this.walls) {
            // Get wall dimensions and position
            const wallWidth = wall.geometry.parameters.width;
            const wallDepth = wall.geometry.parameters.depth;
            const wallX = wall.position.x;
            const wallZ = wall.position.z;
            
            // Calculate wall boundaries
            const wallMinX = wallX - wallWidth / 2 - this.marbleRadius;
            const wallMaxX = wallX + wallWidth / 2 + this.marbleRadius;
            const wallMinZ = wallZ - wallDepth / 2 - this.marbleRadius;
            const wallMaxZ = wallZ + wallDepth / 2 + this.marbleRadius;
            
            // Check if marble is colliding with this wall
            if (
                this.marble.position.x > wallMinX && 
                this.marble.position.x < wallMaxX && 
                this.marble.position.z > wallMinZ && 
                this.marble.position.z < wallMaxZ
            ) {
                // Determine which side of the wall was hit
                // Calculate distances to each edge
                const distToMinX = Math.abs(this.marble.position.x - wallMinX);
                const distToMaxX = Math.abs(this.marble.position.x - wallMaxX);
                const distToMinZ = Math.abs(this.marble.position.z - wallMinZ);
                const distToMaxZ = Math.abs(this.marble.position.z - wallMaxZ);
                
                // Find minimum distance
                const minDist = Math.min(distToMinX, distToMaxX, distToMinZ, distToMaxZ);
                
                // Bounce based on which side was hit
                if (minDist === distToMinX) {
                    // Hit from right side
                    this.marble.position.x = wallMinX;
                    this.marble.velocity.x *= -0.5;
                } else if (minDist === distToMaxX) {
                    // Hit from left side
                    this.marble.position.x = wallMaxX;
                    this.marble.velocity.x *= -0.5;
                } else if (minDist === distToMinZ) {
                    // Hit from bottom side
                    this.marble.position.z = wallMinZ;
                    this.marble.velocity.z *= -0.5;
                } else if (minDist === distToMaxZ) {
                    // Hit from top side
                    this.marble.position.z = wallMaxZ;
                    this.marble.velocity.z *= -0.5;
                }
                
                break; // Only handle one collision per frame for simplicity
            }
        }
    }

    private checkGoal() {
        // Calculate distance between marble and goal
        const dx = this.marble.position.x - this.goalPosition.x;
        const dz = this.marble.position.z - this.goalPosition.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // If marble is inside goal area
        if (distance < 0.7 && !this.gameWon) {
            console.log("Goal reached! You win!");
            this.gameWon = true;
            
            // Record end time and calculate duration
            this.gameEndTime = Date.now();
            this.elapsedTime = (this.gameEndTime - this.gameStartTime) / 1000;
            
            // Pause the timer
            this.pauseTimer();
            
            // Visual feedback for winning - change to green
            this.marble.material.color.set(0x44D62C); // Green marble on win
            
            // Add particle effect for winning
            this.createWinParticles();
            
            // Show win screen with time
            this.showWinScreen(this.elapsedTime);
            
            // Submit score to server
            this.promptForNameAndSubmitScore(this.elapsedTime);
        }
    }
    
    // Add a simple particle effect for winning
    private createWinParticles() {
        // Create particles
        const particleCount = 50;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 8, 8),
                new THREE.MeshBasicMaterial({ 
                    color: i % 2 === 0 ? 0xFF6600 : 0x44D62C, // Alternate orange and green
                    transparent: true,
                    opacity: 0.8
                })
            );
            
            // Random positions around the goal
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 2;
            particle.position.set(
                this.goalPosition.x + Math.cos(angle) * radius,
                0.5 + Math.random() * 2,
                this.goalPosition.z + Math.sin(angle) * radius
            );
            
            // Store initial position and velocity
            particle.userData = {
                velocity: new THREE.Vector3(
                    Math.random() * 0.05 - 0.025,
                    Math.random() * 0.1 + 0.05,
                    Math.random() * 0.05 - 0.025
                ),
                life: 60 + Math.random() * 60 // Frames to live
            };
            
            particles.add(particle);
        }
        
        this.scene.add(particles);
        
        // Animate particles
        const animateParticles = () => {
            if (particles.children.length === 0) {
                this.scene.remove(particles);
                return;
            }
            
            for (let i = particles.children.length - 1; i >= 0; i--) {
                const particle = particles.children[i];
                const userData = particle.userData;
                
                // Update position
                particle.position.add(userData.velocity);
                
                // Apply gravity
                userData.velocity.y -= 0.002;
                
                // Reduce opacity
                particle.material.opacity -= 0.01;
                
                // Remove if expired
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
        const winScreen = document.getElementById('winScreen');
        const timeSpan = document.querySelector('#completionTime span');
        
        if (winScreen && timeSpan) {
            // Format time nicely (MM:SS.ms)
            const minutes = Math.floor(timeSeconds / 60);
            const seconds = Math.floor(timeSeconds % 60);
            const ms = Math.floor((timeSeconds % 1) * 100);
            
            const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
            timeSpan.textContent = formattedTime;
            
            // Update text to show level completed
            const winTitle = winScreen.querySelector('h2');
            if (winTitle) {
                winTitle.textContent = `Level ${this.currentLevelIndex + 1} Complete!`;
            }
            
            // Show/hide next level button based on current level
            const nextLevelBtn = document.getElementById('nextLevelBtn');
            if (nextLevelBtn) {
                if (this.currentLevelIndex >= this.levels.length - 1) {
                    nextLevelBtn.textContent = "Back to Level 1";
                } else {
                    nextLevelBtn.textContent = "Next Level";
                }
            }
            
            winScreen.classList.remove('hidden');
        }
    }
    
    private promptForNameAndSubmitScore(timeSeconds: number) {
        // Create a simple prompt for the player's name
        // You could integrate this with your UI system rather than using alert/prompt
        const playerName = prompt('Congratulations! Enter your name for the leaderboard:', 'Player');
        
        if (playerName) {
            this.submitHighscore(playerName, 0, timeSeconds, 1);
        }
    }
    
    private async submitHighscore(playerName: string, score: number, timeSeconds: number, level: number) {
        try {
            const response = await fetch('/api/submit-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerName: playerName,
                    score: score,
                    time: timeSeconds,
                    level: this.currentLevelIndex + 1 // Use the actual level number
                })
            });
            
            const result = await response.json();
            console.log('Score submission result:', result);
            
            // Optionally update UI based on qualification status
            if (result.qualified) {
                console.log('New highscore!');
                
                // Show leaderboard after a successful submission
                this.showHighscoresPanel();
            }
            
        } catch (error) {
            console.error('Failed to submit score:', error);
        }
    }
    
    private showHighscoresPanel() {
        const highscoresPanel = document.getElementById('highscoresPanel');
        if (highscoresPanel) {
            highscoresPanel.classList.add('active');
            // Trigger highscore update
            this.loadHighscores();
        }
    }
    
    // Replace the existing loadHighscores method
    private async loadHighscores() {
        try {
            const response = await fetch('/api/highscores');
            const highscores = await response.json();
            
            console.log('Highscores loaded:', highscores);
            
            // Update the highscores panel in the UI
            this.displayHighscoresInUI(highscores);
            
        } catch (error) {
            console.error('Failed to load highscores:', error);
        }
    }
    
    private displayHighscoresInUI(highscores: any[]) {
        const highscoresList = document.getElementById('highscoresList');
        if (!highscoresList) return;
        
        if (highscores.length === 0) {
            highscoresList.innerHTML = '<p>No highscores yet. Be the first!</p>';
            return;
        }
        
        // Create a table to display highscores
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
        
        html += '</tbody></table>';
        highscoresList.innerHTML = html;
    }

    private animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Don't update physics if game is paused
        if (!this._isPaused) {
            // Apply tilt to maze based on orientation/mouse
            this.maze.rotation.z = this.mazeTiltX;
            this.maze.rotation.x = this.mazeTiltZ;
            
            // Update marble physics
            this.updateMarblePhysics();
        }
        
        // Render scene (we still render even when paused)
        this.renderer.render(this.scene, this.camera);
    }
}

const game = new Game();

function initgame() {
    game.init();
}

window.addEventListener('load', function() {
    initgame();
    console.log('3D Marble Maze Game initialized');
});