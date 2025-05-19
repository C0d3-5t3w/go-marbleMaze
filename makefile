.PHONY: all build run clean sass ts install setup help

BINARY = MarbleMaze
GO_MAIN = cmd/main.go
GO_OUTPUT = MarbleMaze.app
GO_BINARY = $(GO_OUTPUT)/$(BINARY)
TS_DIR = pkg/assets/ts
JS_DIR = $(GO_OUTPUT)/assets/js
SASS_DIR = pkg/assets/sass
CSS_DIR = $(GO_OUTPUT)/assets/css
CONFIG = pkg/config.json
STORAGE = pkg/storage.json

all: clean setup sass ts build

build:
	@go build -o $(GO_BINARY) $(GO_MAIN)

run: 
	@cd $(GO_OUTPUT) && ./$(BINARY)

sass:
	@mkdir -p $(CSS_DIR)
	@sass $(SASS_DIR)/main.scss:$(CSS_DIR)/main.css --style compressed
	@sass $(SASS_DIR)/game.module.scss:$(CSS_DIR)/game.module.css --style compressed

ts:
	@mkdir -p $(JS_DIR)
	@tsc --project tsconfig.json

clean:
	@rm -rf $(GO_OUTPUT)
	@rm -f tsconfig.json

install:
	@npm install -g typescript sass

setup:
	@mkdir -p $(GO_OUTPUT)
	@cp -r $(CONFIG) $(GO_OUTPUT)/
	@cp -r $(STORAGE) $(GO_OUTPUT)/
	@mkdir -p $(JS_DIR) $(CSS_DIR)
	@[ -f tsconfig.json ] || echo '{\n  "compilerOptions": {\n    "target": "es6",\n    "module": "es6",\n    "outDir": "./MarbleMaze.app/assets/js",\n    "rootDir": "./pkg/assets/ts",\n    "strict": true,\n    "esModuleInterop": true,\n    "skipLibCheck": true,\n    "forceConsistentCasingInFileNames": true,\n    "lib": ["dom", "es2015", "dom.iterable"]\n  },\n  "include": [\n    "pkg/assets/ts/**/*.ts"\n  ],\n  "exclude": [\n    "node_modules"\n  ]\n}' > tsconfig.json

help:
	@echo "Makefile for Go and TypeScript project"
	@echo ""
	@echo "Usage:"
	@echo "  make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  all       Build and run the project"
	@echo "  build     Build the Go binary"
	@echo "  run       Run the Go binary"
	@echo "  clean     Clean up generated files"
	@echo "  sass      Compile SASS to CSS"
	@echo "  ts        Compile TypeScript to JavaScript"
	@echo "  install   Install required packages"
	@echo "  setup     Set up the project structure"
	@echo "  help      Show this help message"
