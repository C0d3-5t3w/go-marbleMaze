// Ensure Three.js is already loaded via CDN
declare var THREE: any;

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

    constructor() {
        console.log("Game constructor called");
    }

    init() {
        console.log("Initializing 3D Marble Maze game");
        try {
            this.initThreeJS();
            this.createLights();
            this.createMaze();
            this.createMarble();
            this.createGoal();
            this.setupEventListeners();
            this.animate();
            
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
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue

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
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);
    }

    private createMaze() {
        // Create a group to hold all maze components
        this.maze = new THREE.Group();
        this.scene.add(this.maze);

        // Floor
        const floorGeometry = new THREE.BoxGeometry(this.mazeSize, 0.5, this.mazeSize);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.7,
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.receiveShadow = true;
        this.maze.add(floor);

        // Outer walls
        this.createOuterWalls();
        
        // Inner maze walls (create a simple maze layout)
        this.createInnerWalls();
    }

    private createOuterWalls() {
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513, // Brown
            roughness: 0.8
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
            color: 0x8b4513, // Brown
            roughness: 0.8
        });
        
        // Define inner maze walls - these coordinates create a simple maze pattern
        // Each entry is [x, z, width, depth] where:
        // - (x,z) is the center position of the wall
        // - width is the width along x-axis
        // - depth is the depth along z-axis
        const innerWalls = [
            [-3, -2, 4, 0.5],  // Horizontal wall
            [0, 0, 0.5, 4],    // Vertical wall
            [3, 2, 4, 0.5],    // Horizontal wall
            [-2, 3, 0.5, 4],   // Vertical wall
            [2, -3, 0.5, 4],   // Vertical wall
            [0, -3, 4, 0.5],   // Horizontal wall
        ];
        
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
            color: 0xff0000,
            metalness: 0.3,
            roughness: 0.2,
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
        const goalGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.1, 32);
        const goalMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5,
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
    }
    
    private togglePause() {
        // Toggle the pause screen via DOM
        const pauseScreen = document.getElementById('pauseScreen');
        if (pauseScreen) {
            pauseScreen.classList.toggle('hidden');
        }
        
        // You could also pause the game logic here
        // this.isPaused = !this.isPaused;
    }

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

    // Make resetMarble public so it can be called from UI
    public resetMarble() {
        this.marble.position.set(
            this.startPosition.x, 
            this.marbleRadius + 0.25,
            this.startPosition.z
        );
        this.marble.velocity.set(0, 0, 0);
        this.gameWon = false;
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
        if (distance < 0.7) {
            console.log("Goal reached! You win!");
            this.gameWon = true;
            
            // Visual feedback for winning
            this.marble.material.color.set(0x00ff00);
            
            // Optional: add more visual/audio feedback here
            
            // Reset the game after a delay
            setTimeout(() => {
                this.resetMarble();
                this.marble.material.color.set(0xff0000);
            }, 3000);
        }
    }

    private animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Apply tilt to maze based on orientation/mouse
        this.maze.rotation.z = this.mazeTiltX;
        this.maze.rotation.x = this.mazeTiltZ;
        
        // Update marble physics
        this.updateMarblePhysics();
        
        // Render scene
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