.PHONY: help build run test clean docker-build docker-up docker-down

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build the Go application
	@echo "Building backend..."
	@go build -o backend main.go

run: ## Run the application locally
	@echo "Running backend..."
	@go run main.go

test: ## Run tests
	@echo "Running tests..."
	@go test ./...

clean: ## Clean build artifacts
	@echo "Cleaning..."
	@rm -f backend
	@go clean

docker-build: ## Build Docker image for backend
	@echo "Building Docker image..."
	@docker build -t gift-planner-backend:latest -f Dockerfile .

docker-up: ## Start all services with Docker Compose
	@echo "Starting services..."
	@docker-compose up -d

docker-down: ## Stop all services
	@echo "Stopping services..."
	@docker-compose down

docker-logs: ## View Docker Compose logs
	@docker-compose logs -f

tidy: ## Run go mod tidy
	@echo "Running go mod tidy..."
	@go mod tidy

fmt: ## Format Go code
	@echo "Formatting code..."
	@go fmt ./...

vet: ## Run go vet
	@echo "Running go vet..."
	@go vet ./...

