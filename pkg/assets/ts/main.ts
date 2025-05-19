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
        this.isLoaded = true;
    }

    private detectDevice() {
        // Detect if user is on mobile
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        console.log(`Device detected: ${this.isMobile ? 'Mobile' : 'Desktop'}`);
        
        // Add appropriate class to body
        document.body.classList.add(this.isMobile ? 'mobile' : 'desktop');
    }

    private setupUI() {
        // Create game UI elements like score, restart button, etc.
        const header = document.querySelector('h1');
        if (header) {
            // Style the header to overlay on the game
            header.style.position = 'absolute';
            header.style.top = '10px';
            header.style.left = '0';
            header.style.width = '100%';
            header.style.textAlign = 'center';
            header.style.color = 'white';
            header.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
            header.style.zIndex = '10';
            header.style.pointerEvents = 'none';
        }

        // Create instructions
        const instructions = document.createElement('div');
        instructions.innerHTML = this.isMobile ? 
            'Tilt your device to move the marble!' : 
            'Move your mouse to tilt the maze! Press R to reset.';
        instructions.style.position = 'absolute';
        instructions.style.bottom = '50px';
        instructions.style.left = '0';
        instructions.style.width = '100%';
        instructions.style.textAlign = 'center';
        instructions.style.color = 'white';
        instructions.style.background = 'rgba(0,0,0,0.5)';
        instructions.style.padding = '10px';
        instructions.style.zIndex = '10';
        document.body.appendChild(instructions);
    }

    private checkBrowserSupport() {
        // Check for WebGL support
        try {
            const canvas = document.createElement('canvas');
            const hasWebGL = !!(window.WebGLRenderingContext && 
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
            
            if (!hasWebGL) {
                this.showError('Your browser does not support WebGL, which is required for this game.');
                return false;
            }
        } catch (e) {
            this.showError('Error detecting WebGL support.');
            return false;
        }

        // Check for DeviceOrientation support if on mobile
        if (this.isMobile && !window.DeviceOrientationEvent) {
            console.warn('DeviceOrientation not supported. Falling back to touch controls.');
        }

        return true;
    }

    private showError(message: string) {
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'absolute';
        errorDiv.style.top = '50%';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translate(-50%, -50%)';
        errorDiv.style.background = 'rgba(255,0,0,0.8)';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '20px';
        errorDiv.style.borderRadius = '10px';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.zIndex = '100';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
    }
}

const main = new Main();

function initmain() {
    main.init();
}

window.addEventListener('load', function() {
    initmain();
    console.log('main.ts loaded and initialized');
});
