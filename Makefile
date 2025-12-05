# Variables - can be customized
IMAGE_NAME = graphql-profile
CONTAINER_NAME = graphql-profile-app
PORT = 8080

# Default target (runs when you just type 'make')
.DEFAULT_GOAL := help

# Help target - shows all available commands
help: ## Show this help message
	@echo "Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# Build Docker image
build: ## Build the Docker image
	@echo "Building Docker image..."
	docker build -t $(IMAGE_NAME):latest .

# Run container using docker-compose
up: ## Start the application using docker-compose
	@echo "Starting application..."
	docker-compose up -d
	@echo "Application running at http://localhost:$(PORT)"

# Stop container using docker-compose
down: ## Stop the application using docker-compose
	@echo "Stopping application..."
	@docker-compose down 2>/dev/null || true
	@echo "Application stopped"

# Remove containers and volumes (keeps images)
remove: ## Remove containers, networks, and volumes (keeps images)
	@echo "Removing containers and volumes..."
	@docker-compose down -v 2>/dev/null || true
	@echo "Containers and volumes removed"

# View logs
logs: ## View application logs
	docker-compose logs -f

# Rebuild and restart
rebuild: ## Rebuild image and restart container
	@echo "Rebuilding and restarting..."
	docker-compose up -d --build

# Clean up - remove containers, images, and volumes
clean: ## Remove containers, images, and volumes
	@echo "Cleaning up..."
	@docker-compose down -v 2>/dev/null || true
	@docker rmi $(IMAGE_NAME):latest 2>/dev/null || true
	@echo "Cleanup complete"

# Run container directly (without docker-compose)
run: build ## Build and run container directly
	@echo "Running container..."
	docker run -d -p $(PORT):80 --name $(CONTAINER_NAME) $(IMAGE_NAME):latest
	@echo "Container running at http://localhost:$(PORT)"

# Stop container (direct run)
stop: ## Stop the container (if run directly)
	docker stop $(CONTAINER_NAME) 2>/dev/null || true
	docker rm $(CONTAINER_NAME) 2>/dev/null || true

# Test the application
test: ## Test if the application is running
	@echo "Testing application..."
	@curl -f http://localhost:$(PORT) > /dev/null 2>&1 && echo "✓ Application is running!" || echo "✗ Application is not responding"

# Show container status
status: ## Show container status
	@echo "Container status:"
	@docker ps -a --filter "name=$(CONTAINER_NAME)" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Shell into container (for debugging)
shell: ## Open a shell in the running container
	docker exec -it $(CONTAINER_NAME) sh

.PHONY: help build up down remove logs rebuild clean run stop test status shell

