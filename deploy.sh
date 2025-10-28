#!/bin/bash

# Production Deployment Script for HopeNest NGO Application
# This script builds and deploys the application using Docker

set -e

echo "🚀 Starting HopeNest Production Deployment..."

# Configuration
DOCKER_COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed and running
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Check if environment file exists
check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        print_warning "Environment file not found. Creating from template..."
        cp .env.docker .env
        print_error "Please update the .env file with your production values before continuing."
        exit 1
    fi
}

# Backup current deployment
backup_current() {
    if [ -d "$BACKUP_DIR" ]; then
        rm -rf "$BACKUP_DIR"
    fi
    
    mkdir -p "$BACKUP_DIR"
    
    print_status "Creating backup of current deployment..."
    
    # Backup environment file
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "$BACKUP_DIR/"
    fi
    
    # Backup docker-compose file
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        cp "$DOCKER_COMPOSE_FILE" "$BACKUP_DIR/"
    fi
    
    # Backup database (if container is running)
    if docker ps | grep -q hopenest-mongo; then
        print_status "Backing up database..."
        docker exec hopenest-mongo mongodump --out /tmp/backup
        docker cp hopenest-mongo:/tmp/backup "$BACKUP_DIR/mongodb_backup"
    fi
    
    print_status "Backup created at: $BACKUP_DIR"
}

# Build and deploy
deploy() {
    print_status "Building Docker images..."
    docker-compose build --no-cache
    
    print_status "Stopping existing containers..."
    docker-compose down
    
    print_status "Starting new deployment..."
    docker-compose up -d
    
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Check if services are healthy
    if docker-compose ps | grep -q "Up"; then
        print_status "✅ Deployment successful!"
        
        print_status "Service URLs:"
        echo "  Frontend: http://localhost"
        echo "  Backend API: http://localhost:5000"
        echo "  Health Check: http://localhost:5000/health"
        
        print_status "Checking service health..."
        
        # Check backend health
        if curl -f http://localhost:5000/health > /dev/null 2>&1; then
            print_status "✅ Backend is healthy"
        else
            print_warning "⚠️  Backend health check failed"
        fi
        
        # Check frontend
        if curl -f http://localhost > /dev/null 2>&1; then
            print_status "✅ Frontend is accessible"
        else
            print_warning "⚠️  Frontend is not accessible"
        fi
        
    else
        print_error "❌ Deployment failed!"
        print_error "Check logs with: docker-compose logs"
        exit 1
    fi
}

# Rollback function
rollback() {
    print_warning "Rolling back to previous deployment..."
    
    if [ ! -d "$BACKUP_DIR" ]; then
        print_error "No backup found to rollback to."
        exit 1
    fi
    
    print_status "Stopping current deployment..."
    docker-compose down
    
    print_status "Restoring backup..."
    cp "$BACKUP_DIR/.env" ./ 2>/dev/null || true
    cp "$BACKUP_DIR/docker-compose.yml" ./ 2>/dev/null || true
    
    print_status "Starting previous deployment..."
    docker-compose up -d
    
    print_status "✅ Rollback completed!"
}

# Main deployment flow
main() {
    case "${1:-deploy}" in
        "deploy")
            check_docker
            check_env_file
            backup_current
            deploy
            ;;
        "rollback")
            rollback
            ;;
        "backup")
            backup_current
            ;;
        "logs")
            docker-compose logs -f
            ;;
        "status")
            docker-compose ps
            ;;
        "stop")
            print_status "Stopping services..."
            docker-compose down
            ;;
        "restart")
            print_status "Restarting services..."
            docker-compose restart
            ;;
        *)
            echo "Usage: $0 {deploy|rollback|backup|logs|status|stop|restart}"
            echo ""
            echo "Commands:"
            echo "  deploy   - Deploy the application (default)"
            echo "  rollback - Rollback to previous deployment"
            echo "  backup   - Create backup of current deployment"
            echo "  logs     - Show application logs"
            echo "  status   - Show service status"
            echo "  stop     - Stop all services"
            echo "  restart  - Restart all services"
            exit 1
            ;;
    esac
}

main "$@"