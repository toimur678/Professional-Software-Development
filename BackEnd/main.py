from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import numpy as np
import os
from typing import Optional, List, Dict
from datetime import datetime
import logging
import time
from collections import defaultdict
from api_integrations import (
    load_environment_variables,
    calculate_carbon_climatiq,
    get_weather_data,
    calculate_route_emissions
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Rate limiting storage
rate_limit_storage = defaultdict(list)

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
    
    # Load environment variables for API integrations
    try:
        load_environment_variables()
        print("✅ Environment variables loaded successfully!")
    except Exception as e:
        print(f"⚠️ Warning: Could not load environment variables: {e}")
    
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

class EnhancedUserStats(BaseModel):
    """Enhanced user stats with context for personalized recommendations"""
    transport_kg: float = Field(..., ge=0, description="Transport emissions in kg CO2")
    diet_kg: float = Field(..., ge=0, description="Diet emissions in kg CO2")
    energy_kg: float = Field(..., ge=0, description="Energy emissions in kg CO2")
    # User context (all optional for backward compatibility)
    household_size: Optional[int] = Field(None, ge=1, le=10)
    location_type: Optional[str] = Field(None, description="urban, suburban, or rural")
    vehicle_type: Optional[str] = Field(None, description="none, petrol, diesel, electric, hybrid")
    diet_preference: Optional[str] = Field(None, description="vegan, vegetarian, pescatarian, omnivore")
    home_type: Optional[str] = Field(None, description="apartment, house, shared")
    renewable_energy: Optional[bool] = Field(None)
    commute_distance: Optional[float] = Field(None, ge=0)
    meals_out_weekly: Optional[int] = Field(None, ge=0, le=21)
    season: Optional[str] = Field(None, description="spring, summer, fall, winter")
    climate_zone: Optional[str] = Field(None, description="temperate, tropical, cold, hot, mediterranean")

class CarbonCalculateRequest(BaseModel):
    activity_type: str = Field(..., description="Type of activity: transport_car, transport_bus, diet_meat, energy_electricity")
    value: float = Field(..., gt=0, description="Numeric amount")
    unit: str = Field(..., description="Unit: km, kg, kWh")
    location: Optional[str] = Field(None, description="Location for context")

class RouteOptimizeRequest(BaseModel):
    origin: str = Field(..., description="Starting location")
    destination: str = Field(..., description="Ending location")
    modes: List[str] = Field(..., description="List of transportation modes to compare")

# Rate limiting middleware
async def rate_limit_middleware(request: Request, call_next):
    """Simple rate limiting: max 60 requests per minute per IP"""
    client_ip = request.client.host
    current_time = time.time()
    
    # Clean old entries (older than 1 minute)
    rate_limit_storage[client_ip] = [
        timestamp for timestamp in rate_limit_storage[client_ip]
        if current_time - timestamp < 60
    ]
    
    # Check rate limit
    if len(rate_limit_storage[client_ip]) >= 60:
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
    
    # Add current request timestamp
    rate_limit_storage[client_ip].append(current_time)
    
    response = await call_next(request)
    return response

app.middleware("http")(rate_limit_middleware)

# Request/Response logging middleware
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Structured logging middleware for request tracking."""
    import uuid
    request_id = str(uuid.uuid4())[:8]
    start_time = time.time()
    
    # Log request
    logger.info(f"[{request_id}] {request.method} {request.url.path} - Started")
    
    try:
        response = await call_next(request)
        
        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000
        
        # Log response
        logger.info(
            f"[{request_id}] {request.method} {request.url.path} - "
            f"Status: {response.status_code} - Duration: {duration_ms:.2f}ms"
        )
        
        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id
        
        return response
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        logger.error(
            f"[{request_id}] {request.method} {request.url.path} - "
            f"Error: {str(e)} - Duration: {duration_ms:.2f}ms"
        )
        raise

# Metrics storage for monitoring
metrics_storage = {
    "requests_total": 0,
    "requests_by_endpoint": defaultdict(int),
    "requests_by_status": defaultdict(int),
    "errors_total": 0,
    "response_times": [],
    "start_time": time.time()
}

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    """Collect metrics for monitoring."""
    start_time = time.time()
    
    try:
        response = await call_next(request)
        
        # Update metrics
        metrics_storage["requests_total"] += 1
        metrics_storage["requests_by_endpoint"][request.url.path] += 1
        metrics_storage["requests_by_status"][response.status_code] += 1
        
        # Track response time (keep last 1000)
        duration_ms = (time.time() - start_time) * 1000
        metrics_storage["response_times"].append(duration_ms)
        if len(metrics_storage["response_times"]) > 1000:
            metrics_storage["response_times"] = metrics_storage["response_times"][-1000:]
        
        return response
    except Exception as e:
        metrics_storage["errors_total"] += 1
        raise

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

@app.get("/health/ready")
def readiness_check():
    """Readiness check - indicates if the service is ready to accept traffic."""
    ready = ml_model is not None
    if not ready:
        raise HTTPException(status_code=503, detail="Service not ready - model not loaded")
    return {
        "status": "ready",
        "model_loaded": True
    }

@app.get("/health/live")
def liveness_check():
    """Liveness check - indicates if the service is alive."""
    return {"status": "alive"}

@app.get("/metrics")
def get_metrics():
    """Prometheus-style metrics endpoint for monitoring."""
    uptime_seconds = time.time() - metrics_storage["start_time"]
    
    # Calculate response time statistics
    response_times = metrics_storage["response_times"]
    avg_response_time = sum(response_times) / len(response_times) if response_times else 0
    max_response_time = max(response_times) if response_times else 0
    p95_response_time = sorted(response_times)[int(len(response_times) * 0.95)] if len(response_times) > 20 else 0
    
    return {
        "uptime_seconds": round(uptime_seconds, 2),
        "requests_total": metrics_storage["requests_total"],
        "errors_total": metrics_storage["errors_total"],
        "requests_by_endpoint": dict(metrics_storage["requests_by_endpoint"]),
        "requests_by_status": dict(metrics_storage["requests_by_status"]),
        "response_time_ms": {
            "avg": round(avg_response_time, 2),
            "max": round(max_response_time, 2),
            "p95": round(p95_response_time, 2)
        },
        "model_status": {
            "loaded": ml_model is not None,
            "type": type(ml_model).__name__ if ml_model else None
        }
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

# Recommendation explanations and estimated impacts
RECOMMENDATION_INFO: Dict[str, Dict] = {
    "Switch_to_Public_Transit": {
        "category": "transport",
        "estimated_impact_kg": 8.5,
        "explanation": "Public transit produces 80% less emissions per passenger mile than driving alone.",
        "difficulty": "medium",
        "alternatives": ["Carpool_More", "Bike_Short_Trips"]
    },
    "Consider_EV_or_Hybrid": {
        "category": "transport",
        "estimated_impact_kg": 12.0,
        "explanation": "Electric vehicles produce zero direct emissions; hybrids reduce fuel consumption by 40-60%.",
        "difficulty": "high",
        "alternatives": ["Optimize_Route_Planning", "Carpool_More"]
    },
    "Carpool_More": {
        "category": "transport",
        "estimated_impact_kg": 5.0,
        "explanation": "Sharing rides splits emissions between passengers, reducing your share by 50% or more.",
        "difficulty": "easy",
        "alternatives": ["Switch_to_Public_Transit", "Combine_Errands"]
    },
    "Bike_Short_Trips": {
        "category": "transport",
        "estimated_impact_kg": 3.0,
        "explanation": "Biking produces zero emissions and improves health for trips under 5km.",
        "difficulty": "easy",
        "alternatives": ["Walk_When_Possible", "Switch_to_Public_Transit"]
    },
    "Combine_Errands": {
        "category": "transport",
        "estimated_impact_kg": 2.5,
        "explanation": "Planning trips to combine multiple errands reduces total distance traveled.",
        "difficulty": "easy",
        "alternatives": ["Optimize_Route_Planning", "Carpool_More"]
    },
    "Optimize_Route_Planning": {
        "category": "transport",
        "estimated_impact_kg": 2.0,
        "explanation": "Efficient route planning can reduce fuel consumption by 10-15%.",
        "difficulty": "easy",
        "alternatives": ["Combine_Errands", "Carpool_More"]
    },
    "Meatless_Monday": {
        "category": "diet",
        "estimated_impact_kg": 4.0,
        "explanation": "Skipping meat one day a week reduces your diet emissions by ~15%.",
        "difficulty": "easy",
        "alternatives": ["Reduce_Red_Meat", "Buy_Local_Produce"]
    },
    "Reduce_Red_Meat": {
        "category": "diet",
        "estimated_impact_kg": 6.5,
        "explanation": "Beef produces 10x more emissions than chicken or fish per kg.",
        "difficulty": "medium",
        "alternatives": ["Meatless_Monday", "Buy_Local_Produce"]
    },
    "Buy_Local_Produce": {
        "category": "diet",
        "estimated_impact_kg": 2.0,
        "explanation": "Local food travels less, reducing transportation emissions.",
        "difficulty": "easy",
        "alternatives": ["Reduce_Food_Waste", "Seasonal_Eating"]
    },
    "Reduce_Food_Waste": {
        "category": "diet",
        "estimated_impact_kg": 3.5,
        "explanation": "About 30% of food is wasted; reducing waste cuts emissions proportionally.",
        "difficulty": "easy",
        "alternatives": ["Buy_Local_Produce", "Cook_at_Home_More"]
    },
    "Cook_at_Home_More": {
        "category": "diet",
        "estimated_impact_kg": 2.5,
        "explanation": "Home cooking typically uses less energy and packaging than restaurants.",
        "difficulty": "medium",
        "alternatives": ["Reduce_Food_Waste", "Meatless_Monday"]
    },
    "Consider_Solar_Panels": {
        "category": "energy",
        "estimated_impact_kg": 15.0,
        "explanation": "Solar panels can reduce home energy emissions by 80% or more.",
        "difficulty": "high",
        "alternatives": ["Switch_to_Green_Energy", "Install_Smart_Thermostat"]
    },
    "Switch_to_Green_Energy": {
        "category": "energy",
        "estimated_impact_kg": 10.0,
        "explanation": "Green energy plans use renewable sources with near-zero emissions.",
        "difficulty": "easy",
        "alternatives": ["Consider_Solar_Panels", "Optimize_Thermostat"]
    },
    "Install_Smart_Thermostat": {
        "category": "energy",
        "estimated_impact_kg": 4.0,
        "explanation": "Smart thermostats optimize heating/cooling, saving 10-15% on energy.",
        "difficulty": "medium",
        "alternatives": ["Optimize_Thermostat", "Switch_to_LED_Bulbs"]
    },
    "Optimize_Thermostat": {
        "category": "energy",
        "estimated_impact_kg": 3.0,
        "explanation": "Adjusting temperature by 1-2 degrees saves significant energy.",
        "difficulty": "easy",
        "alternatives": ["Install_Smart_Thermostat", "Switch_to_LED_Bulbs"]
    },
    "Switch_to_LED_Bulbs": {
        "category": "energy",
        "estimated_impact_kg": 1.5,
        "explanation": "LEDs use 75% less energy than incandescent bulbs.",
        "difficulty": "easy",
        "alternatives": ["Optimize_Thermostat", "Unplug_Devices"]
    },
    "Improve_Home_Insulation": {
        "category": "energy",
        "estimated_impact_kg": 8.0,
        "explanation": "Better insulation reduces heating/cooling needs by up to 30%.",
        "difficulty": "high",
        "alternatives": ["Install_Smart_Thermostat", "Switch_to_Green_Energy"]
    },
    "Maintain_Good_Habits": {
        "category": "general",
        "estimated_impact_kg": 0.0,
        "explanation": "Your emissions are already low! Keep up the great work.",
        "difficulty": "easy",
        "alternatives": []
    },
    "General_Reduction": {
        "category": "general",
        "estimated_impact_kg": 5.0,
        "explanation": "Small changes across all categories add up to significant impact.",
        "difficulty": "medium",
        "alternatives": ["Meatless_Monday", "Switch_to_LED_Bulbs"]
    },
    "Comprehensive_Review": {
        "category": "general",
        "estimated_impact_kg": 10.0,
        "explanation": "Your emissions are high across categories; consider major lifestyle changes.",
        "difficulty": "high",
        "alternatives": ["Switch_to_Public_Transit", "Reduce_Red_Meat", "Switch_to_Green_Energy"]
    }
}

@app.post("/predict/enhanced")
def predict_enhanced_recommendation(stats: EnhancedUserStats):
    """
    Enhanced prediction endpoint with personalized recommendations.
    Uses user context for better recommendations when available.
    Returns confidence scores, reasoning, and alternative actions.
    """
    if ml_model is None:
        raise HTTPException(status_code=500, detail="Model not loaded. Train model first.")
    
    total_kg = stats.transport_kg + stats.diet_kg + stats.energy_kg
    
    # Try to load preprocessing pipeline for enhanced model
    preprocessing_path = "models/preprocessing.joblib"
    
    if os.path.exists(preprocessing_path) and stats.location_type is not None:
        # Use enhanced model with full features
        try:
            preprocessing = joblib.load(preprocessing_path)
            encoders = preprocessing['encoders']
            scaler = preprocessing['scaler']
            feature_cols = preprocessing['feature_cols']
            
            # Prepare enhanced features
            raw_features = {
                'transport_kg': stats.transport_kg,
                'diet_kg': stats.diet_kg,
                'energy_kg': stats.energy_kg,
                'total_kg': total_kg,
                'household_size': stats.household_size or 2,
                'commute_distance': stats.commute_distance or 15,
                'meals_out_weekly': stats.meals_out_weekly or 2,
                'renewable_energy_encoded': 1 if stats.renewable_energy else 0,
            }
            
            # Encode categorical features
            categorical_mappings = {
                'location_type': stats.location_type or 'suburban',
                'vehicle_type': stats.vehicle_type or 'petrol',
                'diet_preference': stats.diet_preference or 'omnivore',
                'home_type': stats.home_type or 'apartment',
                'income_bracket': 'medium',
                'day_of_week': 'Monday',
                'season': stats.season or 'spring',
                'climate_zone': stats.climate_zone or 'temperate',
            }
            
            for col, value in categorical_mappings.items():
                if col in encoders:
                    try:
                        encoded = encoders[col].transform([value])[0]
                        raw_features[f'{col}_encoded'] = encoded
                    except ValueError:
                        # Unknown category, use default
                        raw_features[f'{col}_encoded'] = 0
            
            # Build feature vector in correct order
            feature_vector = [raw_features.get(col, 0) for col in feature_cols]
            features = scaler.transform([feature_vector])
            
            # Get prediction with probabilities
            prediction = ml_model.predict(features)[0]
            
            # Get confidence if model supports it
            try:
                probas = ml_model.predict_proba(features)[0]
                confidence = float(max(probas))
                
                # Get top 3 predictions
                top_indices = np.argsort(probas)[-3:][::-1]
                target_encoder = encoders.get('recommendation')
                if target_encoder:
                    top_predictions = [
                        {
                            'recommendation': target_encoder.classes_[idx],
                            'confidence': float(probas[idx])
                        }
                        for idx in top_indices
                    ]
                else:
                    top_predictions = None
            except AttributeError:
                confidence = 0.75
                top_predictions = None
            
            # Decode prediction if needed
            if 'recommendation' in encoders:
                try:
                    prediction = encoders['recommendation'].inverse_transform([prediction])[0]
                except (ValueError, IndexError):
                    pass
            
            model_type = "enhanced"
            
        except Exception as e:
            logger.error(f"Enhanced prediction failed: {e}, falling back to basic")
            # Fall back to basic prediction
            features = np.array([[stats.transport_kg, stats.diet_kg, stats.energy_kg, total_kg]])
            prediction = ml_model.predict(features)[0]
            confidence = 0.7
            top_predictions = None
            model_type = "basic"
    else:
        # Use basic model
        features = np.array([[stats.transport_kg, stats.diet_kg, stats.energy_kg, total_kg]])
        prediction = ml_model.predict(features)[0]
        confidence = 0.7
        top_predictions = None
        model_type = "basic"
    
    # Get recommendation info
    rec_info = RECOMMENDATION_INFO.get(prediction, {
        "category": "general",
        "estimated_impact_kg": 5.0,
        "explanation": "This recommendation is personalized based on your emission profile.",
        "difficulty": "medium",
        "alternatives": []
    })
    
    # Calculate emission breakdown percentages
    if total_kg > 0:
        breakdown = {
            "transport_pct": round(stats.transport_kg / total_kg * 100, 1),
            "diet_pct": round(stats.diet_kg / total_kg * 100, 1),
            "energy_pct": round(stats.energy_kg / total_kg * 100, 1)
        }
        highest_category = max(breakdown.items(), key=lambda x: x[1])[0].replace("_pct", "")
    else:
        breakdown = {"transport_pct": 0, "diet_pct": 0, "energy_pct": 0}
        highest_category = "general"
    
    response = {
        "recommended_action": prediction,
        "confidence": round(confidence, 3),
        "category": rec_info["category"],
        "reasoning": rec_info["explanation"],
        "estimated_weekly_impact_kg": rec_info["estimated_impact_kg"],
        "difficulty": rec_info["difficulty"],
        "alternatives": rec_info["alternatives"],
        "emission_breakdown": breakdown,
        "highest_impact_category": highest_category,
        "input_stats": {
            "transport_kg": stats.transport_kg,
            "diet_kg": stats.diet_kg,
            "energy_kg": stats.energy_kg,
            "total_kg": total_kg
        },
        "user_context_applied": model_type == "enhanced",
        "model_type": model_type
    }
    
    if top_predictions:
        response["top_predictions"] = top_predictions
    
    return response

@app.post("/api/carbon/calculate")
def calculate_carbon(request: CarbonCalculateRequest):
    """
    Calculate carbon emissions for a given activity.
    """
    logger.info(f"Carbon calculation request: {request.activity_type}, {request.value} {request.unit}")
    
    try:
        result = calculate_carbon_climatiq(
            activity_type=request.activity_type,
            value=request.value,
            unit=request.unit
        )
        
        if not result.get('success', False):
            raise HTTPException(status_code=500, detail=result.get('error', 'Calculation failed'))
        
        response = {
            "co2_kg": result['co2_kg'],
            "confidence": result['confidence'],
            "data_source": result['data_source'],
            "calculation_method": "api",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "location": request.location
        }
        
        logger.info(f"Carbon calculation successful: {response['co2_kg']} kg CO2")
        return response
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error calculating carbon: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/weather/recommendations")
def weather_recommendations(lat: float, lon: float):
    """
    Get weather data and contextual eco-friendly recommendations.
    """
    logger.info(f"Weather recommendations request: lat={lat}, lon={lon}")
    
    try:
        weather_result = get_weather_data(latitude=lat, longitude=lon)
        
        if not weather_result.get('success', False):
            raise HTTPException(status_code=500, detail=weather_result.get('error', 'Weather fetch failed'))
        
        # Generate contextual recommendations based on weather
        recommendations = []
        temp = weather_result['temperature']
        conditions = weather_result['conditions'].lower()
        
        # Temperature-based recommendations
        if temp > 25:
            recommendations.append("Consider using a fan instead of AC to save energy")
            recommendations.append("Open windows in the evening for natural cooling")
            recommendations.append("Use window shades during peak sun hours")
        elif temp < 10:
            recommendations.append("Layer clothing before turning up the heat")
            recommendations.append("Use draft excluders to keep heat in")
            recommendations.append("Drink warm beverages to feel warmer naturally")
        else:
            recommendations.append("Perfect temperature for natural ventilation")
            recommendations.append("Consider reducing heating/cooling usage")
        
        # Condition-based recommendations
        if 'clear' in conditions or 'sun' in conditions:
            recommendations.append("Great day for line-drying laundry instead of using dryer")
            recommendations.append("Open curtains to warm your home naturally")
            recommendations.append("Excellent conditions for solar charging devices")
        elif 'rain' in conditions:
            recommendations.append("Collect rainwater for plants and garden use")
            recommendations.append("Good day to work from home and reduce transport emissions")
        elif 'cloud' in conditions:
            recommendations.append("Mild conditions - perfect for outdoor activities without AC")
        
        # Wind-based recommendations
        if weather_result.get('wind_speed', 0) > 5:
            recommendations.append("Windy day - perfect for air-drying laundry quickly")
        
        response = {
            "weather": {
                "temperature": weather_result['temperature'],
                "conditions": weather_result['conditions'],
                "description": weather_result['description'],
                "humidity": weather_result.get('humidity'),
                "wind_speed": weather_result.get('wind_speed')
            },
            "recommendations": recommendations,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        logger.info(f"Weather recommendations generated: {len(recommendations)} tips")
        return response
        
    except Exception as e:
        logger.error(f"Error getting weather recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/transport/route-optimize")
def route_optimize(request: RouteOptimizeRequest):
    """
    Compare carbon emissions across different transportation modes.
    """
    logger.info(f"Route optimization request: {request.origin} to {request.destination}")
    
    try:
        routes = []
        
        for mode in request.modes:
            result = calculate_route_emissions(
                origin=request.origin,
                destination=request.destination,
                mode=mode
            )
            
            if result.get('success', False):
                routes.append({
                    "mode": mode,
                    "distance_km": result['distance_km'],
                    "duration_min": result['duration_min'],
                    "co2_kg": result['co2_kg'],
                    "start_address": result.get('start_address'),
                    "end_address": result.get('end_address'),
                    "route_polyline": result.get('route_polyline')
                })
            else:
                logger.warning(f"Failed to calculate route for mode {mode}: {result.get('error')}")
        
        if not routes:
            raise HTTPException(status_code=500, detail="Could not calculate any routes")
        
        # Find the most eco-friendly option (lowest CO2)
        recommended_route = min(routes, key=lambda x: x['co2_kg'])
        recommended_mode = recommended_route['mode']
        
        # Calculate savings compared to highest emission mode
        highest_emission_route = max(routes, key=lambda x: x['co2_kg'])
        savings_co2_kg = round(highest_emission_route['co2_kg'] - recommended_route['co2_kg'], 2)
        
        response = {
            "routes": routes,
            "recommended": recommended_mode,
            "savings_co2_kg": savings_co2_kg,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        logger.info(f"Route optimization complete: {len(routes)} routes compared")
        return response
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error optimizing route: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/health/apis")
def api_health_check():
    """
    Test connectivity to all external APIs.
    """
    logger.info("API health check initiated")
    
    health_status = {
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    # Test Climatiq API
    try:
        result = calculate_carbon_climatiq("transport_car", 1, "km")
        health_status["climatiq"] = "healthy" if result.get('success') else "unhealthy"
    except Exception as e:
        logger.error(f"Climatiq health check failed: {str(e)}")
        health_status["climatiq"] = "unhealthy"
    
    # Test OpenWeatherMap API
    try:
        result = get_weather_data(51.5074, -0.1278)  # London coordinates
        health_status["openweathermap"] = "healthy" if result.get('success') else "unhealthy"
    except Exception as e:
        logger.error(f"OpenWeatherMap health check failed: {str(e)}")
        health_status["openweathermap"] = "unhealthy"
    
    # Test Google Maps API
    try:
        result = calculate_route_emissions("London", "Manchester", "driving")
        health_status["google_maps"] = "healthy" if result.get('success') else "unhealthy"
    except Exception as e:
        logger.error(f"Google Maps health check failed: {str(e)}")
        health_status["google_maps"] = "unhealthy"
    
    logger.info(f"API health check complete: {health_status}")
    return health_status


# =============================================================================
# SOCIAL FEATURES ENDPOINTS
# =============================================================================

# Pydantic models for social features
class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    user_name: str
    avatar_url: Optional[str] = None
    co2_saved: float
    points: int
    activities_count: int
    streak_days: int

class LeaderboardResponse(BaseModel):
    scope: str
    period: str
    entries: List[LeaderboardEntry]
    user_rank: Optional[int] = None
    total_participants: int

class ChallengeInfo(BaseModel):
    id: str
    title: str
    description: Optional[str]
    category: str
    challenge_type: str
    target_value: float
    target_unit: str
    start_date: str
    end_date: str
    points_reward: int
    difficulty: str
    participants_count: int
    user_progress: Optional[float] = None
    user_completed: Optional[bool] = None

class TeamInfo(BaseModel):
    id: str
    name: str
    description: Optional[str]
    avatar_url: Optional[str]
    member_count: int
    total_co2_saved: float
    weekly_co2_saved: float
    is_public: bool
    user_role: Optional[str] = None

class FriendInfo(BaseModel):
    id: str
    user_id: str
    full_name: str
    avatar_url: Optional[str]
    total_points: int
    level: int
    co2_saved_weekly: float

class NotificationInfo(BaseModel):
    id: str
    type: str
    title: str
    message: Optional[str]
    read: bool
    created_at: str
    action_url: Optional[str]
    priority: str


@app.get("/api/leaderboard/{scope}/{period}")
def get_leaderboard(scope: str, period: str, limit: int = 20):
    """
    Get leaderboard for specified scope and period.
    
    Scopes: global, friends, team
    Periods: daily, weekly, monthly, all_time
    """
    valid_scopes = ['global', 'friends', 'team']
    valid_periods = ['daily', 'weekly', 'monthly', 'all_time']
    
    if scope not in valid_scopes:
        raise HTTPException(status_code=400, detail=f"Invalid scope. Must be one of: {valid_scopes}")
    if period not in valid_periods:
        raise HTTPException(status_code=400, detail=f"Invalid period. Must be one of: {valid_periods}")
    
    # Generate sample leaderboard data
    # In production, this would query Supabase
    sample_users = [
        {"name": "Emma Green", "avatar": "🌱"},
        {"name": "Alex Rivers", "avatar": "🌊"},
        {"name": "Jordan Woods", "avatar": "🌲"},
        {"name": "Taylor Bloom", "avatar": "🌸"},
        {"name": "Casey Solar", "avatar": "☀️"},
        {"name": "Morgan Earth", "avatar": "🌍"},
        {"name": "Riley Wind", "avatar": "💨"},
        {"name": "Quinn Forest", "avatar": "🌳"},
        {"name": "Avery Leaf", "avatar": "🍃"},
        {"name": "Parker Rain", "avatar": "🌧️"},
    ]
    
    entries = []
    for i, user in enumerate(sample_users[:limit]):
        base_co2 = 100 - (i * 8) + np.random.uniform(-5, 5)
        entries.append(LeaderboardEntry(
            rank=i + 1,
            user_id=f"user-{i+1}",
            user_name=user["name"],
            avatar_url=None,
            co2_saved=round(max(0, base_co2), 1),
            points=1000 - (i * 80) + int(np.random.uniform(-20, 20)),
            activities_count=50 - (i * 4),
            streak_days=30 - (i * 2)
        ))
    
    return LeaderboardResponse(
        scope=scope,
        period=period,
        entries=entries,
        user_rank=5,  # Sample: current user is ranked 5th
        total_participants=len(entries)
    )


@app.get("/api/challenges")
def get_challenges(
    status: Optional[str] = "active",
    category: Optional[str] = None,
    challenge_type: Optional[str] = None
):
    """
    Get available challenges.
    
    Status: active, completed, upcoming
    Category: transport, diet, energy, general
    Type: individual, team, global
    """
    # Sample challenges (in production, query from database)
    challenges = [
        ChallengeInfo(
            id="ch-1",
            title="Green Commute Week",
            description="Use eco-friendly transport for 7 days straight",
            category="transport",
            challenge_type="individual",
            target_value=7,
            target_unit="days_streak",
            start_date=datetime.now().isoformat(),
            end_date=(datetime.now().replace(day=datetime.now().day + 14)).isoformat(),
            points_reward=100,
            difficulty="medium",
            participants_count=234,
            user_progress=3,
            user_completed=False
        ),
        ChallengeInfo(
            id="ch-2",
            title="Meatless March",
            description="Log 20 vegetarian or vegan meals this month",
            category="diet",
            challenge_type="individual",
            target_value=20,
            target_unit="meals",
            start_date=datetime.now().isoformat(),
            end_date=(datetime.now().replace(day=datetime.now().day + 30)).isoformat(),
            points_reward=200,
            difficulty="medium",
            participants_count=456,
            user_progress=8,
            user_completed=False
        ),
        ChallengeInfo(
            id="ch-3",
            title="Energy Saver",
            description="Reduce energy consumption by 50 kWh",
            category="energy",
            challenge_type="individual",
            target_value=50,
            target_unit="kwh_saved",
            start_date=datetime.now().isoformat(),
            end_date=(datetime.now().replace(day=datetime.now().day + 30)).isoformat(),
            points_reward=150,
            difficulty="hard",
            participants_count=189,
            user_progress=22,
            user_completed=False
        ),
        ChallengeInfo(
            id="ch-4",
            title="Carbon Crusher",
            description="Save 100kg of CO₂ emissions",
            category="general",
            challenge_type="individual",
            target_value=100,
            target_unit="kg_co2_saved",
            start_date=datetime.now().isoformat(),
            end_date=(datetime.now().replace(day=datetime.now().day + 60)).isoformat(),
            points_reward=500,
            difficulty="hard",
            participants_count=678,
            user_progress=45,
            user_completed=False
        ),
        ChallengeInfo(
            id="ch-5",
            title="Team Green Goals",
            description="Team challenge: Collectively save 500kg CO₂",
            category="general",
            challenge_type="team",
            target_value=500,
            target_unit="kg_co2_saved",
            start_date=datetime.now().isoformat(),
            end_date=(datetime.now().replace(day=datetime.now().day + 30)).isoformat(),
            points_reward=300,
            difficulty="hard",
            participants_count=12,
            user_progress=None,
            user_completed=None
        ),
    ]
    
    # Filter by category if specified
    if category:
        challenges = [c for c in challenges if c.category == category]
    
    # Filter by type if specified
    if challenge_type:
        challenges = [c for c in challenges if c.challenge_type == challenge_type]
    
    return {
        "status": status,
        "challenges": challenges,
        "total_count": len(challenges)
    }


@app.post("/api/challenges/{challenge_id}/join")
def join_challenge(challenge_id: str):
    """Join a challenge"""
    logger.info(f"User joining challenge: {challenge_id}")
    return {
        "success": True,
        "message": "Successfully joined the challenge!",
        "challenge_id": challenge_id
    }


@app.get("/api/teams")
def get_teams(public_only: bool = True, limit: int = 20):
    """Get list of teams"""
    # Sample teams (in production, query from database)
    teams = [
        TeamInfo(
            id="team-1",
            name="Green Warriors",
            description="Fighting climate change one action at a time",
            avatar_url=None,
            member_count=45,
            total_co2_saved=1250.5,
            weekly_co2_saved=89.3,
            is_public=True,
            user_role=None
        ),
        TeamInfo(
            id="team-2",
            name="Eco Champions",
            description="Company sustainability team",
            avatar_url=None,
            member_count=32,
            total_co2_saved=980.2,
            weekly_co2_saved=67.8,
            is_public=True,
            user_role=None
        ),
        TeamInfo(
            id="team-3",
            name="Climate Action Club",
            description="University environmental club",
            avatar_url=None,
            member_count=78,
            total_co2_saved=2100.0,
            weekly_co2_saved=145.2,
            is_public=True,
            user_role=None
        ),
    ]
    
    return {
        "teams": teams,
        "total_count": len(teams)
    }


@app.post("/api/teams/{team_id}/join")
def join_team(team_id: str, invite_code: Optional[str] = None):
    """Join a team"""
    logger.info(f"User joining team: {team_id}")
    return {
        "success": True,
        "message": "Successfully joined the team!",
        "team_id": team_id
    }


@app.get("/api/friends")
def get_friends():
    """Get user's friends list"""
    # Sample friends (in production, query from database)
    friends = [
        FriendInfo(
            id="friend-1",
            user_id="user-101",
            full_name="Emma Green",
            avatar_url=None,
            total_points=850,
            level=5,
            co2_saved_weekly=12.5
        ),
        FriendInfo(
            id="friend-2",
            user_id="user-102",
            full_name="Alex Rivers",
            avatar_url=None,
            total_points=720,
            level=4,
            co2_saved_weekly=9.8
        ),
        FriendInfo(
            id="friend-3",
            user_id="user-103",
            full_name="Jordan Woods",
            avatar_url=None,
            total_points=1100,
            level=6,
            co2_saved_weekly=15.2
        ),
    ]
    
    return {
        "friends": friends,
        "total_count": len(friends),
        "pending_requests": 2
    }


@app.post("/api/friends/request/{user_id}")
def send_friend_request(user_id: str):
    """Send a friend request"""
    logger.info(f"Sending friend request to: {user_id}")
    return {
        "success": True,
        "message": "Friend request sent!"
    }


@app.get("/api/notifications")
def get_notifications(unread_only: bool = False, limit: int = 20):
    """Get user's notifications"""
    # Sample notifications (in production, query from database)
    notifications = [
        NotificationInfo(
            id="notif-1",
            type="friend_request",
            title="New Friend Request",
            message="Alex Rivers wants to be your friend",
            read=False,
            created_at=datetime.now().isoformat(),
            action_url="/community",
            priority="normal"
        ),
        NotificationInfo(
            id="notif-2",
            type="challenge_completed",
            title="Challenge Completed! 🎉",
            message="You completed the 'Green Commute Week' challenge",
            read=False,
            created_at=datetime.now().isoformat(),
            action_url="/challenges",
            priority="high"
        ),
        NotificationInfo(
            id="notif-3",
            type="achievement_unlocked",
            title="New Achievement Unlocked!",
            message="You earned the 'Bike Enthusiast' badge",
            read=True,
            created_at=datetime.now().isoformat(),
            action_url="/achievements",
            priority="normal"
        ),
        NotificationInfo(
            id="notif-4",
            type="leaderboard_rank_up",
            title="You're Moving Up! 📈",
            message="You moved from #8 to #5 on the weekly leaderboard",
            read=True,
            created_at=datetime.now().isoformat(),
            action_url="/leaderboard",
            priority="normal"
        ),
    ]
    
    if unread_only:
        notifications = [n for n in notifications if not n.read]
    
    unread_count = len([n for n in notifications if not n.read])
    
    return {
        "notifications": notifications[:limit],
        "total_count": len(notifications),
        "unread_count": unread_count
    }


@app.post("/api/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str):
    """Mark a notification as read"""
    logger.info(f"Marking notification as read: {notification_id}")
    return {
        "success": True,
        "notification_id": notification_id
    }


@app.post("/api/notifications/read-all")
def mark_all_notifications_read():
    """Mark all notifications as read"""
    logger.info("Marking all notifications as read")
    return {
        "success": True,
        "message": "All notifications marked as read"
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