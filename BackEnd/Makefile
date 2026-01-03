# =============================================================================
# EcoWisely Backend - Makefile for Mac (Apple Silicon) Optimized Operations
# =============================================================================

.PHONY: help install run run-dev test clean train train-enhanced generate generate-enhanced test-apis

# Default target
help:
	@echo "EcoWisely ML Backend - Available Commands"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "  make install          - Install dependencies"
	@echo "  make run              - Run server (Mac M4 optimized, NO reload)"
	@echo "  make run-dev          - Run server with auto-reload (higher CPU)"
	@echo ""
	@echo "  Data Generation:"
	@echo "  make generate         - Generate basic sample data (1000 samples)"
	@echo "  make generate-enhanced - Generate enhanced data (10000 samples)"
	@echo ""
	@echo "  Model Training:"
	@echo "  make train            - Train basic ML model"
	@echo "  make train-enhanced   - Train enhanced model (RF + AdaBoost + GB)"
	@echo ""
	@echo "  Testing:"
	@echo "  make test             - Test basic API endpoints"
	@echo "  make test-apis        - Run comprehensive API tests"
	@echo ""
	@echo "  make clean            - Remove cache files"
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
	@echo "Training basic ML model..."
	python train_model.py

# Train enhanced model with multiple algorithms
train-enhanced:
	@echo "Training enhanced ML model (RF + AdaBoost + GB)..."
	python train_enhanced_model.py

# Generate sample data
generate:
	@echo "Generating basic sample data (1000 samples)..."
	python generate_data.py

# Generate enhanced sample data
generate-enhanced:
	@echo "Generating enhanced sample data (10000 samples)..."
	python generate_enhanced_data.py

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

# Run comprehensive API tests
test-apis:
	@echo "Running comprehensive API tests..."
	python test_apis.py

# Clean up cache files
clean:
	@echo "Cleaning up..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name ".DS_Store" -delete 2>/dev/null || true
	@echo "Cleanup complete!"
