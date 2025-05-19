# Marble Maze Game

A 3D marble maze game where you tilt the maze to guide a marble to the end goal. This project uses Go for the backend and Three.js for 3D rendering.

## Features

- 3D maze rendered with Three.js
- Physics-based marble movement
- Tilt controls using device orientation on mobile or mouse movement on desktop
- Simple collision detection system
- Goal detection to win the game
- Responsive design for different screen sizes

## Prerequisites

- Go (version 1.16 or later)
- Node.js and NPM (for TypeScript and Sass compilation)
- TypeScript compiler (`tsc`)
- Sass compiler

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/go-marbleMaze.git
   cd go-marbleMaze
   ```

2. Set up the project:
   ```bash
   make setup
   ```

3. Install dependencies (if you don't have TypeScript and Sass globally installed):
   ```bash
   make install
   ```

## Building and Running

1. Build the project (compiles Sass, TypeScript, and Go):
   ```bash
   make build
   ```

2. Run the application:
   ```bash
   make run
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

## Controls

- **Mobile**: Tilt your device to control the maze
- **Desktop**: Move your mouse to tilt the maze
- **Reset**: Press 'R' key to reset the marble position

## Project Structure

```
go-marbleMaze/
├── assets/            # Compiled assets (generated)
│   ├── css/           # Compiled CSS files
│   └── js/            # Compiled JavaScript files
├── cmd/               # Command-line applications
│   └── main.go        # Main Go application entry point
├── inc/               # Go packages
│   ├── config/        # Configuration handling
│   └── html/          # HTML templating
├── pkg/               # Source files
│   ├── assets/        # Asset source files
│   │   ├── sass/      # SCSS stylesheets
│   │   └── ts/        # TypeScript source files
│   └── config.json    # Configuration file
├── go.mod             # Go module definition
├── makefile           # Build automation
├── README.md          # This file
└── tsconfig.json      # TypeScript configuration
```

## Browser Compatibility

This game requires a modern browser with support for:
- WebGL
- JavaScript ES6
- DeviceOrientation API (for mobile tilt controls)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Three.js for 3D rendering
- Go for backend serving

## Credits 🤘🏼

- GitHub: [@C0d3-5t3w](https://github.com/C0d3-5t3w)