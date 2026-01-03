# =============================================================================
# EcoWisely Backend - Makefile for Mac (Apple Silicon) Optimized Operations
# =============================================================================

.PHONY: help install run run-dev test clean

# Default target
help:
	@echo "EcoWisely ML Backend - Available Commands"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "  make install    - Install dependencies"
	@echo "  make run        - Run server (Mac M4 optimized, NO reload)"
	@echo "  make run-dev    - Run server with auto-reload (higher CPU)"
	@echo "  make train      - Train the ML model"
	@echo "  make generate   - Generate sample data"
	@echo "  make test       - Test the API endpoints"
	@echo "  make clean      - Remove cache files"
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Install dependencies
install:
	@echo "Installing dependencies..."
	pip install -r requirements.txt

# Run server - Mac M4 optimized (NO file watching)
# This prevents high CPU usage and overheating
run:
	@echo "Starting server (Mac M4 optimized - NO reload)..."
	@echo "   API available at: http://localhost:8000"
	@echo "   API docs at: http://localhost:8000/docs"
	@echo ""
	uvicorn main:app --host 0.0.0.0 --port 8000

# Run server with auto-reload (for active development only)
# WARNING: This uses more CPU due to file system watching
run-dev:
	@echo "Starting server with auto-reload (development mode)..."
	@echo "Warning: This mode uses more CPU due to file watching"
	@echo ""
	uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Train the ML model
train:
	@echo "Training ML model..."
	python train_model.py

# Generate sample data
generate:
	@echo "Generating sample data..."
	python generate_data.py

# Test API endpoints
test:
	@echo "Testing API endpoints..."
	@echo ""
	@echo "Testing root endpoint..."
	curl -s http://localhost:8000/ | python -m json.tool
	@echo ""
	@echo "Testing health endpoint..."
	curl -s http://localhost:8000/health | python -m json.tool
	@echo ""
	@echo "Testing predict endpoint..."
	curl -s -X POST http://localhost:8000/predict \
		-H "Content-Type: application/json" \
		-d '{"transport_kg": 12, "diet_kg": 2, "energy_kg": 3}' | python -m json.tool

# Clean up cache files
clean:
	@echo "Cleaning up..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name ".DS_Store" -delete 2>/dev/null || true
	@echo "Cleanup complete!"
