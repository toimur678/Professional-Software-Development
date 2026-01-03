#!/bin/bash
# =============================================================================
# EcoWisely Backend - Mac (Apple Silicon) Optimized Startup Script
# =============================================================================
# This script runs the FastAPI server WITHOUT the --reload flag to prevent
# high CPU usage and overheating on Mac M4 / Apple Silicon machines.
#
# The --reload flag constantly watches thousands of files for changes,
# which causes significant CPU load. Only use --reload when actively
# developing backend code.
# =============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}EcoWisely ML Backend${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check if we're in the right directory
if [ ! -f "main.py" ]; then
    echo -e "${YELLOW}main.py not found. Navigating to BackEnd directory...${NC}"
    cd "$(dirname "$0")"
fi

# Check if virtual environment exists and activate it
if [ -d "venv" ]; then
    echo -e "${GREEN}Activating virtual environment...${NC}"
    source venv/bin/activate
elif [ -d ".venv" ]; then
    echo -e "${GREEN}Activating virtual environment...${NC}"
    source .venv/bin/activate
else
    echo -e "${YELLOW}No virtual environment found. Using system Python.${NC}"
fi

# Check if uvicorn is installed
if ! command -v uvicorn &> /dev/null; then
    echo -e "${YELLOW}Installing uvicorn...${NC}"
    pip install uvicorn
fi

echo ""
echo -e "${GREEN}Starting server (Mac M4 optimized - NO file watching)${NC}"
echo -e "${BLUE}   Host: 0.0.0.0${NC}"
echo -e "${BLUE}   Port: 8000${NC}"
echo -e "${BLUE}   API Docs: http://localhost:8000/docs${NC}"
echo ""
echo -e "${YELLOW}Tip: Use Ctrl+C to stop the server${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Run uvicorn WITHOUT --reload flag for optimal Mac M4 performance
# The --reload flag causes high CPU usage due to file system watching
uvicorn main:app --host 0.0.0.0 --port 8000
