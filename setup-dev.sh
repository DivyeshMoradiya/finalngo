#!/bin/bash

# Development Setup Script
# This script sets up the development environment

set -e

echo "🛠️  Setting up HopeNest Development Environment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check Node.js installation
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18 or later."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
    
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        print_error "Node.js version $NODE_VERSION is too old. Please install Node.js 18 or later."
        exit 1
    fi
    
    print_status "Node.js version: $NODE_VERSION ✅"
}

# Check MongoDB installation (optional for development)
check_mongodb() {
    if command -v mongod &> /dev/null; then
        print_status "MongoDB is installed ✅"
    else
        print_warning "MongoDB is not installed. You can use Docker or install MongoDB separately."
    fi
}

# Install backend dependencies
setup_backend() {
    print_status "Setting up backend..."
    cd backend
    
    if [ ! -f ".env" ]; then
        print_status "Creating backend environment file..."
        cp .env.development .env
    fi
    
    print_status "Installing backend dependencies..."
    npm install
    
    cd ..
}

# Install frontend dependencies
setup_frontend() {
    print_status "Setting up frontend..."
    cd HopeNest
    
    if [ ! -f ".env" ]; then
        print_status "Creating frontend environment file..."
        cp .env.development .env
    fi
    
    print_status "Installing frontend dependencies..."
    npm install
    
    cd ..
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    mkdir -p backend/logs
    mkdir -p backend/uploads/crowdfunding
    mkdir -p backups
}

# Start development servers
start_dev_servers() {
    print_status "Starting development servers..."
    
    # Start MongoDB if installed
    if command -v mongod &> /dev/null; then
        print_status "Starting MongoDB..."
        mongod --fork --logpath /tmp/mongodb.log --dbpath ./data/db 2>/dev/null || true
    fi
    
    # Create tmux session for development
    if command -v tmux &> /dev/null; then
        print_status "Creating tmux session 'hopenest-dev'..."
        
        tmux new-session -d -s hopenest-dev
        tmux send-keys -t hopenest-dev 'cd backend && npm run dev' Enter
        tmux split-window -t hopenest-dev -h
        tmux send-keys -t hopenest-dev 'cd HopeNest && npm run dev' Enter
        
        print_status "Development servers started in tmux session 'hopenest-dev'"
        print_status "Attach to session with: tmux attach -t hopenest-dev"
        print_status "Detach from session with: Ctrl+B then D"
    else
        print_warning "tmux not found. Starting servers in background..."
        cd backend && npm run dev &
        cd ../HopeNest && npm run dev &
        print_status "Development servers started in background"
    fi
}

# Main setup flow
main() {
    case "${1:-setup}" in
        "setup")
            check_node
            check_mongodb
            create_directories
            setup_backend
            setup_frontend
            print_status "✅ Development environment setup complete!"
            print_status ""
            print_status "Next steps:"
            print_status "1. Update backend/.env with your MongoDB connection string"
            print_status "2. Update backend/.env with your SMTP settings for email"
            print_status "3. Run 'npm run dev' in backend directory"
            print_status "4. Run 'npm run dev' in HopeNest directory"
            print_status "5. Open http://localhost:5173 in your browser"
            ;;
        "start")
            start_dev_servers
            ;;
        "stop")
            print_status "Stopping development servers..."
            pkill -f "npm run dev" || true
            tmux kill-session -t hopenest-dev 2>/dev/null || true
            print_status "Development servers stopped"
            ;;
        *)
            echo "Usage: $0 {setup|start|stop}"
            echo ""
            echo "Commands:"
            echo "  setup - Set up development environment (default)"
            echo "  start - Start development servers"
            echo "  stop  - Stop development servers"
            exit 1
            ;;
    esac
}

main "$@"