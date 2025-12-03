#!/bin/bash

# Deployment script for GraphQL Profile Application
# This script automates the deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="graphql-profile"
CONTAINER_NAME="graphql-profile-app"
PORT=8080
ENVIRONMENT=${1:-production}  # Default to production if not specified

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  GraphQL Profile Deployment Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed and running
print_info "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi
print_info "Docker is installed and running ✓"

# Check if docker-compose is installed
print_info "Checking docker-compose installation..."
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install docker-compose first."
    exit 1
fi
print_info "docker-compose is installed ✓"

# Determine which compose file to use
if [ "$ENVIRONMENT" == "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    print_info "Using production configuration"
else
    COMPOSE_FILE="docker-compose.yml"
    print_info "Using development configuration"
fi

# Stop existing container if running
print_info "Stopping existing containers..."
docker-compose -f "$COMPOSE_FILE" down 2>/dev/null || true

# Build the Docker image
print_info "Building Docker image..."
docker-compose -f "$COMPOSE_FILE" build --no-cache

# Start the containers
print_info "Starting containers..."
docker-compose -f "$COMPOSE_FILE" up -d

# Wait for container to be ready
print_info "Waiting for application to start..."
sleep 5

# Health check
print_info "Performing health check..."
MAX_RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:$PORT > /dev/null 2>&1; then
        print_info "Health check passed ✓"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            print_warn "Health check failed. Retrying... ($RETRY_COUNT/$MAX_RETRIES)"
            sleep 3
        else
            print_error "Health check failed after $MAX_RETRIES attempts"
            print_error "Container logs:"
            docker-compose -f "$COMPOSE_FILE" logs
            exit 1
        fi
    fi
done

# Show container status
print_info "Container status:"
docker-compose -f "$COMPOSE_FILE" ps

# Show logs
print_info "Recent logs:"
docker-compose -f "$COMPOSE_FILE" logs --tail=20

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
print_info "Application is running at: http://localhost:$PORT"
print_info "To view logs: docker-compose -f $COMPOSE_FILE logs -f"
print_info "To stop: docker-compose -f $COMPOSE_FILE down"

