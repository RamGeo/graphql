#!/bin/bash

# Health check script for GraphQL Profile Application
# Returns exit code 0 if healthy, 1 if unhealthy
# Can be used by monitoring tools, CI/CD, or cron jobs

set -e

# Configuration
CONTAINER_NAME="graphql-profile-app"
PORT=8080
HEALTH_URL="http://localhost:${PORT}"
MAX_RESPONSE_TIME=5  # Maximum acceptable response time in seconds

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Track overall health status
HEALTHY=true

echo "=========================================="
echo "  Health Check for GraphQL Profile App"
echo "=========================================="
echo ""

# Check 1: Docker is running
print_info "Checking if Docker is running..."
if ! docker info &> /dev/null; then
    print_error "Docker is not running"
    HEALTHY=false
else
    print_success "Docker is running"
fi

# Check 2: Container exists
print_info "Checking if container exists..."
if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    print_error "Container '${CONTAINER_NAME}' does not exist"
    HEALTHY=false
else
    print_success "Container exists"
fi

# Check 3: Container is running
print_info "Checking if container is running..."
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    print_error "Container '${CONTAINER_NAME}' is not running"
    HEALTHY=false
    
    # Show container status
    print_info "Container status:"
    docker ps -a --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}"
else
    print_success "Container is running"
fi

# Check 4: HTTP endpoint is responding
print_info "Checking HTTP endpoint (${HEALTH_URL})..."
START_TIME=$(date +%s)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time ${MAX_RESPONSE_TIME} ${HEALTH_URL} || echo "000")
END_TIME=$(date +%s)
RESPONSE_TIME=$((END_TIME - START_TIME))

if [ "$HTTP_CODE" == "200" ]; then
    print_success "HTTP endpoint is responding (Status: ${HTTP_CODE}, Time: ${RESPONSE_TIME}s)"
elif [ "$HTTP_CODE" == "000" ]; then
    print_error "HTTP endpoint is not responding (timeout or connection refused)"
    HEALTHY=false
else
    print_error "HTTP endpoint returned status code: ${HTTP_CODE}"
    HEALTHY=false
fi

# Check 5: Response time is acceptable
if [ $RESPONSE_TIME -gt $MAX_RESPONSE_TIME ]; then
    print_error "Response time is too slow: ${RESPONSE_TIME}s (max: ${MAX_RESPONSE_TIME}s)"
    HEALTHY=false
fi

# Check 6: Container health status (if healthcheck is configured)
print_info "Checking container health status..."
HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' ${CONTAINER_NAME} 2>/dev/null || echo "no-healthcheck")

if [ "$HEALTH_STATUS" == "healthy" ]; then
    print_success "Container health check: healthy"
elif [ "$HEALTH_STATUS" == "unhealthy" ]; then
    print_error "Container health check: unhealthy"
    HEALTHY=false
elif [ "$HEALTH_STATUS" == "no-healthcheck" ]; then
    print_info "No health check configured for container"
else
    print_info "Container health check: ${HEALTH_STATUS}"
fi

# Check 7: Recent error logs (optional - check last 50 lines for errors)
print_info "Checking for recent errors in logs..."
ERROR_COUNT=$(docker logs --tail 50 ${CONTAINER_NAME} 2>&1 | grep -i "error\|fatal\|critical" | wc -l || echo "0")

if [ "$ERROR_COUNT" -gt 0 ]; then
    print_info "Found ${ERROR_COUNT} error(s) in recent logs"
    if [ "$ERROR_COUNT" -gt 10 ]; then
        print_error "Too many errors in logs (${ERROR_COUNT})"
        HEALTHY=false
    fi
else
    print_success "No recent errors in logs"
fi

# Summary
echo ""
echo "=========================================="
if [ "$HEALTHY" == true ]; then
    echo -e "${GREEN}  Health Check: PASSED${NC}"
    echo "=========================================="
    exit 0
else
    echo -e "${RED}  Health Check: FAILED${NC}"
    echo "=========================================="
    echo ""
    print_info "Recent container logs:"
    docker logs --tail 20 ${CONTAINER_NAME} 2>&1 || true
    exit 1
fi

