#!/bin/bash
# EcoWisely Deployment Script
# Usage: ./deploy.sh [environment] [component]
# Example: ./deploy.sh production all

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
COMPONENT=${2:-all}
PROJECT_ROOT=$(dirname "$(dirname "$(realpath "$0")")")

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  EcoWisely Deployment Script${NC}"
echo -e "${BLUE}  Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "${BLUE}  Component: ${YELLOW}$COMPONENT${NC}"
echo -e "${BLUE}========================================${NC}"

# Validate environment
if [[ "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo -e "${RED}Invalid environment: $ENVIRONMENT${NC}"
    echo "Valid environments: development, staging, production"
    exit 1
fi

# Check prerequisites
check_prerequisites() {
    echo -e "\n${BLUE}Checking prerequisites...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker is not installed${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}Docker Compose is not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ All prerequisites met${NC}"
}

# Build backend
build_backend() {
    echo -e "\n${BLUE}Building Backend...${NC}"
    cd "$PROJECT_ROOT/BackEnd"
    
    # Run tests first
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo "Running backend tests..."
        python -m pytest tests/ -v --tb=short || {
            echo -e "${RED}Backend tests failed${NC}"
            exit 1
        }
    fi
    
    # Build Docker image
    docker build -t ecowisely-backend:latest -t ecowisely-backend:$ENVIRONMENT .
    
    echo -e "${GREEN}✓ Backend built successfully${NC}"
}

# Build frontend
build_frontend() {
    echo -e "\n${BLUE}Building Frontend...${NC}"
    cd "$PROJECT_ROOT/FrontEnd"
    
    # Install dependencies
    npm ci
    
    # Run linting
    npm run lint || {
        echo -e "${YELLOW}Linting warnings detected${NC}"
    }
    
    # Build Docker image
    docker build -t ecowisely-frontend:latest -t ecowisely-frontend:$ENVIRONMENT .
    
    echo -e "${GREEN}✓ Frontend built successfully${NC}"
}

# Deploy with Docker Compose
deploy_docker() {
    echo -e "\n${BLUE}Deploying with Docker Compose...${NC}"
    cd "$PROJECT_ROOT"
    
    # Set environment file
    if [[ -f ".env.$ENVIRONMENT" ]]; then
        export $(cat ".env.$ENVIRONMENT" | grep -v '^#' | xargs)
    elif [[ -f ".env" ]]; then
        export $(cat ".env" | grep -v '^#' | xargs)
    fi
    
    # Deploy
    if [[ "$ENVIRONMENT" == "production" ]]; then
        docker compose --profile production up -d --build
    else
        docker compose up -d --build
    fi
    
    echo -e "${GREEN}✓ Deployment complete${NC}"
}

# Health check
health_check() {
    echo -e "\n${BLUE}Running health checks...${NC}"
    
    MAX_RETRIES=30
    RETRY_INTERVAL=2
    
    # Check backend
    echo "Checking backend health..."
    for i in $(seq 1 $MAX_RETRIES); do
        if curl -s http://localhost:8000/health | grep -q "healthy"; then
            echo -e "${GREEN}✓ Backend is healthy${NC}"
            break
        fi
        if [[ $i -eq $MAX_RETRIES ]]; then
            echo -e "${RED}Backend health check failed${NC}"
            exit 1
        fi
        sleep $RETRY_INTERVAL
    done
    
    # Check frontend
    echo "Checking frontend health..."
    for i in $(seq 1 $MAX_RETRIES); do
        if curl -s http://localhost:3000/api/health | grep -q "healthy"; then
            echo -e "${GREEN}✓ Frontend is healthy${NC}"
            break
        fi
        if [[ $i -eq $MAX_RETRIES ]]; then
            echo -e "${RED}Frontend health check failed${NC}"
            exit 1
        fi
        sleep $RETRY_INTERVAL
    done
    
    echo -e "${GREEN}✓ All health checks passed${NC}"
}

# Show status
show_status() {
    echo -e "\n${BLUE}Container Status:${NC}"
    docker compose ps
    
    echo -e "\n${BLUE}Service URLs:${NC}"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:8000"
    echo "  API Docs: http://localhost:8000/docs"
    echo "  Metrics:  http://localhost:8000/metrics"
}

# Main execution
main() {
    check_prerequisites
    
    case $COMPONENT in
        backend)
            build_backend
            ;;
        frontend)
            build_frontend
            ;;
        all)
            build_backend
            build_frontend
            deploy_docker
            health_check
            ;;
        deploy)
            deploy_docker
            health_check
            ;;
        status)
            show_status
            ;;
        *)
            echo -e "${RED}Invalid component: $COMPONENT${NC}"
            echo "Valid components: backend, frontend, all, deploy, status"
            exit 1
            ;;
    esac
    
    show_status
    
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}  Deployment completed successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
}

main
