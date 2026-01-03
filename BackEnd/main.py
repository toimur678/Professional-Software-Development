from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import os
from typing import Optional

# Global model storage - loaded once at startup
ml_model: Optional[object] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for FastAPI.
    Loads the ML model once at startup and cleans up on shutdown.
    This prevents model reloading on every request and reduces CPU usage.
    """
    global ml_model
    model_path = "models/eco_recommender.joblib"
    
    # Startup: Load model once
    if os.path.exists(model_path):
        print(f"🔄 Loading ML model from {model_path}...")
        ml_model = joblib.load(model_path)
        print("✅ Model loaded successfully!")
    else:
        print(f"⚠️ Warning: Model not found at {model_path}")
        ml_model = None
    
    yield  # Application runs here
    
    # Shutdown: Cleanup (optional)
    print("🛑 Shutting down ML service...")
    ml_model = None

app = FastAPI(
    title="EcoWisely ML API",
    lifespan=lifespan
)

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define input data structure
class UserStats(BaseModel):
    transport_kg: float
    diet_kg: float
    energy_kg: float

@app.get("/")
def read_root():
    return {"status": "ML Service is Online"}

@app.get("/health")
def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "model_loaded": ml_model is not None
    }

@app.post("/predict")
def predict_recommendation(stats: UserStats):
    if ml_model is None:
        raise HTTPException(status_code=500, detail="Model not loaded. Train model first.")
    
    total_kg = stats.transport_kg + stats.diet_kg + stats.energy_kg
    
    # Prepare features for the model [transport, diet, energy, total]
    features = np.array([[
        stats.transport_kg, 
        stats.diet_kg, 
        stats.energy_kg, 
        total_kg
    ]])
    
    # Predict
    prediction = ml_model.predict(features)[0]
    
    # Return readable format
    return {
        "recommended_action": prediction,
        "input_stats": stats,
        "total_emissions": total_kg
    }

# =============================================================================
# HOW TO RUN (Mac M4 / Apple Silicon optimized):
# =============================================================================
# For development (with auto-reload - uses more CPU):
#   uvicorn main:app --reload --host 127.0.0.1 --port 8000
#
# For production/low-heat operation (RECOMMENDED for Mac M4):
#   uvicorn main:app --host 0.0.0.0 --port 8000
#
# Or use the provided start.sh script:
#   ./start.sh
# =============================================================================