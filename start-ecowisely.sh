#!/bin/bash

#===============================================================================
# EcoWisely Application Launcher
#===============================================================================
# This script runs pre-flight checks for both backend and frontend,
# then starts both services if all checks pass.
#
# Usage:
#   ./start-ecowisely.sh              # Run checks and start
#   ./start-ecowisely.sh --check-only # Only run checks, don't start
#   ./start-ecowisely.sh --skip-apis  # Skip API connectivity tests
#   ./start-ecowisely.sh --force      # Start even if some checks fail
#
# Requirements:
#   - Python 3.11+ with virtual environment
#   - Node.js 18+
#   - API keys configured in .env files
#===============================================================================

set -e

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Parse arguments
CHECK_ONLY=false
SKIP_APIS=false
FORCE_START=false
VERBOSE=false

for arg in "$@"; do
    case $arg in
        --check-only)
            CHECK_ONLY=true
            ;;
        --skip-apis)
            SKIP_APIS=true
            ;;
        --force)
            FORCE_START=true
            ;;
        --verbose|-v)
            VERBOSE=true
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --check-only    Only run checks, don't start services"
            echo "  --skip-apis     Skip API connectivity tests"
            echo "  --force         Start even if some checks fail"
            echo "  --verbose, -v   Show detailed output"
            echo "  --help, -h      Show this help message"
            exit 0
            ;;
    esac
done

# Print header
echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}🌱 ECOWISELY APPLICATION LAUNCHER${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "${WHITE}Starting pre-flight checks...${NC}"
echo ""

# Track status
BACKEND_STATUS=0
FRONTEND_STATUS=0

#===============================================================================
# Backend Pre-flight Check
#===============================================================================

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📦 BACKEND PRE-FLIGHT CHECK${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$SCRIPT_DIR/BackEnd"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found. Please install Python 3.11+${NC}"
    exit 1
fi

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo -e "${WHITE}Activating virtual environment...${NC}"
    source venv/bin/activate 2>/dev/null || true
fi

# Build command
BACKEND_CHECK_CMD="python3 preflight_check.py"
if [ "$SKIP_APIS" = true ]; then
    BACKEND_CHECK_CMD="$BACKEND_CHECK_CMD --skip-apis"
fi
if [ "$VERBOSE" = true ]; then
    BACKEND_CHECK_CMD="$BACKEND_CHECK_CMD --verbose"
fi

# Run backend checks
if [ -f "preflight_check.py" ]; then
    if $BACKEND_CHECK_CMD; then
        BACKEND_STATUS=0
    else
        BACKEND_STATUS=1
    fi
else
    echo -e "${RED}❌ preflight_check.py not found${NC}"
    BACKEND_STATUS=1
fi

#===============================================================================
# Frontend Pre-flight Check
#===============================================================================

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🎨 FRONTEND PRE-FLIGHT CHECK${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$SCRIPT_DIR/FrontEnd"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

# Build command
FRONTEND_CHECK_CMD="node preflight-check.js"
if [ "$SKIP_APIS" = true ]; then
    FRONTEND_CHECK_CMD="$FRONTEND_CHECK_CMD --skip-backend"
fi
if [ "$VERBOSE" = true ]; then
    FRONTEND_CHECK_CMD="$FRONTEND_CHECK_CMD --verbose"
fi

# Run frontend checks
if [ -f "preflight-check.js" ]; then
    if $FRONTEND_CHECK_CMD; then
        FRONTEND_STATUS=0
    else
        FRONTEND_STATUS=1
    fi
else
    echo -e "${RED}❌ preflight-check.js not found${NC}"
    FRONTEND_STATUS=1
fi

#===============================================================================
# Check Results Summary
#===============================================================================

cd "$SCRIPT_DIR"

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📋 PRE-FLIGHT SUMMARY${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $BACKEND_STATUS -eq 0 ]; then
    echo -e "  ${GREEN}✅${NC} Backend: All checks passed"
else
    echo -e "  ${RED}❌${NC} Backend: Some checks failed"
fi

if [ $FRONTEND_STATUS -eq 0 ]; then
    echo -e "  ${GREEN}✅${NC} Frontend: All checks passed"
else
    echo -e "  ${RED}❌${NC} Frontend: Some checks failed"
fi

echo ""

#===============================================================================
# Decision Point
#===============================================================================

# Check if we should proceed
SHOULD_START=false

if [ $BACKEND_STATUS -eq 0 ] && [ $FRONTEND_STATUS -eq 0 ]; then
    SHOULD_START=true
    echo -e "${GREEN}═══════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ ALL PRE-FLIGHT CHECKS PASSED!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════${NC}"
elif [ "$FORCE_START" = true ]; then
    SHOULD_START=true
    echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
    echo -e "${YELLOW}⚠️  STARTING WITH WARNINGS (--force)${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
else
    echo -e "${RED}═══════════════════════════════════════════${NC}"
    echo -e "${RED}❌ PRE-FLIGHT CHECKS FAILED${NC}"
    echo -e "${RED}═══════════════════════════════════════════${NC}"
    echo ""
    echo -e "${WHITE}Fix the issues above and try again.${NC}"
    echo -e "${WHITE}Or use --force to start anyway.${NC}"
    echo ""
    exit 1
fi

# If check only mode, exit here
if [ "$CHECK_ONLY" = true ]; then
    echo ""
    echo -e "${WHITE}Check-only mode. Exiting without starting services.${NC}"
    echo ""
    exit 0
fi

#===============================================================================
# Ask User to Proceed
#===============================================================================

echo ""
read -p "Start EcoWisely? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled.${NC}"
    exit 0
fi

#===============================================================================
# Start Services
#===============================================================================

echo ""
echo -e "${GREEN}🚀 Launching EcoWisely...${NC}"
echo ""

# Store PIDs for cleanup
BACKEND_PID=""
FRONTEND_PID=""

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping EcoWisely...${NC}"
    
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo -e "  ${WHITE}Backend stopped${NC}"
    fi
    
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo -e "  ${WHITE}Frontend stopped${NC}"
    fi
    
    # Kill any remaining processes on ports
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    
    echo ""
    echo -e "${GREEN}👋 EcoWisely stopped. Goodbye!${NC}"
    echo ""
    exit 0
}

# Set up trap for cleanup
trap cleanup INT TERM

#===============================================================================
# Start Backend
#===============================================================================

echo -e "${WHITE}Starting backend on http://localhost:8000...${NC}"

cd "$SCRIPT_DIR/BackEnd"

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate 2>/dev/null || true
fi

# Start uvicorn in background
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo -e "  ${GREEN}✓${NC} Backend starting (PID: $BACKEND_PID)"

# Wait for backend to be ready
echo -e "  ${WHITE}Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Backend is ready!"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "  ${YELLOW}⚠${NC} Backend may still be starting..."
    fi
done

#===============================================================================
# Start Frontend
#===============================================================================

echo ""
echo -e "${WHITE}Starting frontend on http://localhost:3000...${NC}"

cd "$SCRIPT_DIR/FrontEnd"

# Start Next.js dev server in background
npm run dev &
FRONTEND_PID=$!

echo -e "  ${GREEN}✓${NC} Frontend starting (PID: $FRONTEND_PID)"

# Wait for frontend to be ready
echo -e "  ${WHITE}Waiting for frontend to be ready...${NC}"
sleep 5

#===============================================================================
# Success Message
#===============================================================================

echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ ECOWISELY IS RUNNING!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "  ${WHITE}📱 Frontend:${NC}  http://localhost:3000"
echo -e "  ${WHITE}🔌 Backend:${NC}   http://localhost:8000"
echo -e "  ${WHITE}📚 API Docs:${NC}  http://localhost:8000/docs"
echo -e "  ${WHITE}❤️  Health:${NC}   http://localhost:8000/health"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Press Ctrl+C to stop both services${NC}"
echo ""

#===============================================================================
# Wait for User Interrupt
#===============================================================================

# Wait for background processes
wait
