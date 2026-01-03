# EcoWisely API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URLs](#base-urls)
4. [Rate Limits](#rate-limits)
5. [Endpoints](#endpoints)
   - [Health Checks](#health-checks)
   - [Carbon Calculation](#carbon-calculation)
   - [Weather Recommendations](#weather-recommendations)
   - [Route Optimization](#route-optimization)
   - [ML Predictions](#ml-predictions)
6. [Error Codes](#error-codes)
7. [API Key Setup](#api-key-setup)
8. [Testing Guide](#testing-guide)
9. [Security Best Practices](#security-best-practices)

---

## Overview

The EcoWisely API provides endpoints for carbon footprint calculation, weather-based recommendations, route optimization, and AI-powered sustainability recommendations.

**Version:** 1.0.0  
**Last Updated:** January 2026

---

## Authentication

Currently, the API uses API keys for external service authentication. Internal endpoints require Supabase JWT authentication.

### Headers
```
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json
```

---

## Base URLs

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:8000` |
| Production | `https://api.ecowisely.com` |

---

## Rate Limits

### Internal Rate Limits
| Limit | Value | Window |
|-------|-------|--------|
| Per IP | 60 requests | 1 minute |
| Per User | 100 requests | 1 hour |

### External API Rate Limits
| API | Free Tier Limit | How to Monitor |
|-----|-----------------|----------------|
| Climatiq | 50,000 calls/month | [Dashboard](https://app.climatiq.io/) |
| OpenWeatherMap | 1,000 calls/day | [Dashboard](https://home.openweathermap.org/) |
| Google Directions | 40,000 calls/month | [Console](https://console.cloud.google.com/) |

### Rate Limit Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704295200
```

---

## Endpoints

### Health Checks

#### GET /health
Check if the API server is running.

**Response 200:**
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

---

#### GET /health/apis
Check connectivity to all external APIs.

**Response 200:**
```json
{
  "climatiq": "healthy",
  "openweathermap": "healthy",
  "google_maps": "healthy",
  "timestamp": "2026-01-03T10:30:00Z"
}
```

**Response Values:**
- `healthy` - API is responding correctly
- `unhealthy` - API is not responding or returning errors

---

### Carbon Calculation

#### POST /api/carbon/calculate
Calculate CO2 emissions for a specific activity.

**Request Body:**
```json
{
  "activity_type": "transport_car",
  "value": 50.0,
  "unit": "km",
  "location": "Turkey"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `activity_type` | string | Yes | Type of activity (see table below) |
| `value` | number | Yes | Numeric amount (must be > 0) |
| `unit` | string | Yes | Unit of measurement |
| `location` | string | No | Location for context |

**Activity Types:**

| Activity Type | Description | Unit |
|---------------|-------------|------|
| `transport_car` | Private car travel | km |
| `transport_bus` | Bus travel | km |
| `diet_meat` | Meat consumption | kg |
| `energy_electricity` | Electricity usage | kWh |

**Response 200:**
```json
{
  "co2_kg": 10.55,
  "confidence": "high",
  "data_source": "Climatiq",
  "calculation_method": "api",
  "timestamp": "2026-01-03T10:30:00Z",
  "location": "Turkey"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `co2_kg` | number | CO2 emissions in kilograms |
| `confidence` | string | Confidence level (high, medium, low) |
| `data_source` | string | Source of emission factors |
| `calculation_method` | string | "api" or "fallback" |
| `timestamp` | string | ISO 8601 timestamp |
| `location` | string | Location if provided |

**Error Responses:**

| Code | Description |
|------|-------------|
| 400 | Invalid activity_type or unit |
| 500 | API error or calculation failed |

**Example cURL:**
```bash
curl -X POST http://localhost:8000/api/carbon/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "activity_type": "transport_car",
    "value": 50,
    "unit": "km"
  }'
```

---

### Weather Recommendations

#### GET /api/weather/recommendations
Get weather data and contextual eco-friendly recommendations.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lat` | number | Yes | Latitude (-90 to 90) |
| `lon` | number | Yes | Longitude (-180 to 180) |

**Example Request:**
```
GET /api/weather/recommendations?lat=38.619&lon=27.428
```

**Response 200:**
```json
{
  "weather": {
    "temperature": 22.5,
    "conditions": "Clear",
    "description": "clear sky",
    "humidity": 65,
    "wind_speed": 3.5
  },
  "recommendations": [
    "Perfect temperature for natural ventilation",
    "Great day for line-drying laundry instead of using dryer",
    "Open curtains to warm your home naturally",
    "Excellent conditions for solar charging devices"
  ],
  "timestamp": "2026-01-03T10:30:00Z"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `weather.temperature` | number | Temperature in Celsius |
| `weather.conditions` | string | Main weather condition |
| `weather.description` | string | Detailed description |
| `weather.humidity` | number | Humidity percentage |
| `weather.wind_speed` | number | Wind speed in m/s |
| `recommendations` | array | List of eco-friendly tips |

**Recommendation Logic:**

| Condition | Recommendations |
|-----------|-----------------|
| temp > 25°C | "Consider using fan instead of AC" |
| temp < 10°C | "Layer clothing before turning up heat" |
| Clear/Sunny | "Great day for line-drying laundry" |
| Rainy | "Collect rainwater for plants" |
| Windy | "Perfect for air-drying laundry quickly" |

**Error Responses:**

| Code | Description |
|------|-------------|
| 500 | Weather API error |

**Example cURL:**
```bash
curl "http://localhost:8000/api/weather/recommendations?lat=51.5074&lon=-0.1278"
```

---

### Route Optimization

#### POST /api/transport/route-optimize
Compare carbon emissions across different transportation modes.

**Request Body:**
```json
{
  "origin": "Istanbul",
  "destination": "Ankara",
  "modes": ["driving", "transit"]
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `origin` | string | Yes | Starting location (city name or address) |
| `destination` | string | Yes | Ending location |
| `modes` | array | Yes | Transportation modes to compare |

**Available Modes:**

| Mode | Description | CO2 Factor (kg/km) |
|------|-------------|-------------------|
| `driving` | Private car | 0.171 |
| `transit` | Public transport | 0.089 |
| `walking` | On foot | 0.0 |
| `bicycling` | Bicycle | 0.0 |

**Response 200:**
```json
{
  "routes": [
    {
      "mode": "driving",
      "distance_km": 450.5,
      "duration_min": 360.0,
      "co2_kg": 77.04,
      "start_address": "Istanbul, Turkey",
      "end_address": "Ankara, Turkey",
      "route_polyline": "..."
    },
    {
      "mode": "transit",
      "distance_km": 460.2,
      "duration_min": 420.0,
      "co2_kg": 40.96,
      "start_address": "Istanbul, Turkey",
      "end_address": "Ankara, Turkey",
      "route_polyline": "..."
    }
  ],
  "recommended": "transit",
  "savings_co2_kg": 36.08,
  "timestamp": "2026-01-03T10:30:00Z"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `routes` | array | Route details for each mode |
| `routes[].mode` | string | Transportation mode |
| `routes[].distance_km` | number | Distance in kilometers |
| `routes[].duration_min` | number | Duration in minutes |
| `routes[].co2_kg` | number | CO2 emissions in kg |
| `routes[].start_address` | string | Resolved start address |
| `routes[].end_address` | string | Resolved end address |
| `routes[].route_polyline` | string | Encoded polyline for mapping |
| `recommended` | string | Most eco-friendly mode |
| `savings_co2_kg` | number | CO2 saved vs worst option |

**Error Responses:**

| Code | Description |
|------|-------------|
| 400 | Invalid mode specified |
| 500 | Route calculation failed |

**Example cURL:**
```bash
curl -X POST http://localhost:8000/api/transport/route-optimize \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "London",
    "destination": "Manchester",
    "modes": ["driving", "transit", "bicycling"]
  }'
```

---

### ML Predictions

#### POST /predict
Get AI-powered sustainability recommendations.

**Request Body:**
```json
{
  "transport_kg": 15.0,
  "diet_kg": 5.0,
  "energy_kg": 8.0
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `transport_kg` | number | Yes | Transport emissions (kg CO2) |
| `diet_kg` | number | Yes | Diet emissions (kg CO2) |
| `energy_kg` | number | Yes | Energy emissions (kg CO2) |

**Response 200:**
```json
{
  "recommended_action": "Reduce_Transport",
  "input_stats": {
    "transport_kg": 15.0,
    "diet_kg": 5.0,
    "energy_kg": 8.0
  },
  "total_emissions": 28.0
}
```

**Possible Recommendations:**

| Action | Trigger Condition |
|--------|-------------------|
| `Reduce_Transport` | Transport > 40% of total |
| `Reduce_Diet` | Diet > 35% of total |
| `Reduce_Energy` | Energy > 35% of total |
| `Maintain_Lifestyle` | Well-balanced emissions |

**Error Responses:**

| Code | Description |
|------|-------------|
| 500 | Model not loaded |

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Request completed |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Check authentication |
| 404 | Not Found | Check endpoint URL |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Contact support |

### Error Response Format

```json
{
  "detail": "Error message describing the issue"
}
```

### Common Errors

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Invalid activity_type" | Wrong activity type | Use valid type from list |
| "API key not configured" | Missing env variable | Add key to .env file |
| "API rate limit exceeded" | Too many requests | Wait or upgrade plan |
| "Model not loaded" | ML model missing | Run train_model.py |
| "Could not connect to API" | Network issue | Check internet connection |

---

## API Key Setup

### Required API Keys

#### 1. Climatiq API
- **Purpose:** Carbon emission calculations
- **Sign up:** https://www.climatiq.io/
- **Free tier:** 50,000 requests/month
- **Environment variable:** `CLIMATIQ_API_KEY`

**Setup Steps:**
1. Create account at climatiq.io
2. Navigate to API Keys section
3. Create new API key
4. Copy to `.env` file

#### 2. OpenWeatherMap API
- **Purpose:** Weather data for recommendations
- **Sign up:** https://openweathermap.org/api
- **Free tier:** 1,000 calls/day
- **Environment variable:** `OPENWEATHERMAP_API_KEY`

**Setup Steps:**
1. Create account at openweathermap.org
2. Go to API keys section
3. Generate new key (may take 10 min to activate)
4. Copy to `.env` file

#### 3. Google Directions API
- **Purpose:** Route distance and duration
- **Sign up:** https://console.cloud.google.com/
- **Free tier:** $200 credit/month (≈40,000 requests)
- **Environment variable:** `GOOGLE_DIRECTIONS_API_KEY`

**Setup Steps:**
1. Create Google Cloud project
2. Enable Directions API
3. Create API key
4. Restrict key to Directions API only
5. Copy to `.env` file

### Environment File Template

Create `.env` in BackEnd directory:

```bash
# Carbon Calculation
CLIMATIQ_API_KEY=your_climatiq_key_here

# Weather Data
OPENWEATHERMAP_API_KEY=your_openweathermap_key_here

# Route Calculations
GOOGLE_DIRECTIONS_API_KEY=your_google_key_here

# Supabase (if using)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Monitoring (optional)
SENTRY_DSN=your_sentry_dsn
MIXPANEL_TOKEN=your_mixpanel_token
```

---

## Testing Guide

### Running Test Script

```bash
cd BackEnd
python test_apis.py
```

**Expected Output:**
```
╔══════════════════════════════════════════════════════════╗
║          EcoWisely API Integration Test Suite            ║
╚══════════════════════════════════════════════════════════╝

============================================================
  Checking API Keys
============================================================
✅ PASS: CLIMATIQ_API_KEY is configured
✅ PASS: OPENWEATHERMAP_API_KEY is configured
✅ PASS: GOOGLE_DIRECTIONS_API_KEY is configured

============================================================
  Testing Climatiq API
============================================================
✅ PASS: Car Transport (50km) - 10.55 kg CO2e

... (more tests)

============================================================
  TEST SUMMARY
============================================================
✅ PASS: API Keys
✅ PASS: Climatiq API
✅ PASS: OpenWeatherMap API
✅ PASS: Google Maps API
✅ PASS: Local API Endpoints

╔══════════════════════════════════════════════════════════╗
║              🎉 ALL TESTS PASSED! 🎉                     ║
╚══════════════════════════════════════════════════════════╝
```

### Manual Testing with cURL

**1. Health Check:**
```bash
curl http://localhost:8000/health
```

**2. Carbon Calculation:**
```bash
curl -X POST http://localhost:8000/api/carbon/calculate \
  -H "Content-Type: application/json" \
  -d '{"activity_type":"transport_car","value":50,"unit":"km"}'
```

**3. Weather Recommendations:**
```bash
curl "http://localhost:8000/api/weather/recommendations?lat=51.5074&lon=-0.1278"
```

**4. Route Optimization:**
```bash
curl -X POST http://localhost:8000/api/transport/route-optimize \
  -H "Content-Type: application/json" \
  -d '{"origin":"London","destination":"Manchester","modes":["driving","transit"]}'
```

### Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Connection refused | Server not running | Run `uvicorn main:app --reload` |
| 401 Unauthorized | Invalid API key | Check key in .env file |
| 429 Rate Limited | Too many requests | Wait or check quotas |
| Timeout errors | Network issues | Check internet connection |
| Model not loaded | Missing .joblib file | Run `python train_model.py` |

### Testing Checklist

- [ ] All API keys configured in .env
- [ ] Backend server starts without errors
- [ ] /health returns 200
- [ ] /health/apis shows all healthy
- [ ] Carbon calculation returns valid CO2
- [ ] Weather returns temperature and tips
- [ ] Route optimization compares modes
- [ ] ML prediction returns recommendation

---

## Security Best Practices

### API Key Security

1. **Never commit API keys to Git**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.production
   ```

2. **Use environment variables**
   ```python
   api_key = os.getenv('API_KEY')  # ✅ Good
   api_key = "sk_live_123..."      # ❌ Bad
   ```

3. **Rotate keys regularly**
   - Set calendar reminder for quarterly rotation
   - Update keys in production via secure deployment

4. **Restrict API key permissions**
   - Google: Restrict to Directions API only
   - Climatiq: Use read-only keys for production

5. **Use separate keys for environments**
   ```
   .env.development
   .env.production
   ```

### Request Security

1. **Validate all inputs**
   ```python
   if activity_type not in valid_activities:
       raise HTTPException(400, "Invalid activity_type")
   ```

2. **Rate limiting**
   - 60 requests/minute per IP
   - 100 requests/hour per user

3. **CORS configuration**
   ```python
   allow_origins=["http://localhost:3000", "https://ecowisely.com"]
   ```

4. **HTTPS in production**
   - Always use HTTPS
   - Redirect HTTP to HTTPS

### Monitoring

1. **Log all API calls**
   ```python
   logger.info(f"Carbon calculation: {activity_type}, {value} {unit}")
   ```

2. **Monitor for anomalies**
   - Unusual request patterns
   - High error rates
   - API quota approaching limits

3. **Set up alerts**
   - Error rate > 1%
   - Response time > 2s
   - API quota > 80%

---

## Changelog

### Version 1.0.0 (January 2026)
- Initial API release
- Carbon calculation endpoint
- Weather recommendations endpoint
- Route optimization endpoint
- ML prediction endpoint
- Comprehensive error handling
- Rate limiting implementation

---

## Support

- **Documentation:** This file
- **Issues:** GitHub Issues
- **Email:** support@ecowisely.com

---

*Last updated: January 3, 2026*
