# API Integration Guide

## 🚀 Backend Setup

### 1. Install Dependencies

```bash
cd BackEnd
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the BackEnd directory:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
CLIMATIQ_API_KEY=your_actual_key_here
OPENWEATHERMAP_API_KEY=your_actual_key_here
GOOGLE_DIRECTIONS_API_KEY=your_actual_key_here
```

### 3. Start the Server

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Or use the provided script:

```bash
./start.sh
```

## 📡 API Endpoints

### 1. Calculate Carbon Emissions

**POST** `/api/carbon/calculate`

Calculate CO2 emissions for various activities.

**Request:**
```json
{
  "activity_type": "transport_car",
  "value": 25.5,
  "unit": "km",
  "location": "Turkey"
}
```

**Response:**
```json
{
  "co2_kg": 5.355,
  "confidence": "high",
  "data_source": "climatiq",
  "calculation_method": "api",
  "timestamp": "2026-01-03T10:30:00Z",
  "location": "Turkey"
}
```

**Activity Types:**
- `transport_car` - Car travel (km)
- `transport_bus` - Bus travel (km)
- `diet_meat` - Meat consumption (kg)
- `energy_electricity` - Electricity usage (kWh)

---

### 2. Weather-Based Recommendations

**GET** `/api/weather/recommendations?lat=38.619&lon=27.428`

Get weather data and eco-friendly recommendations based on current conditions.

**Response:**
```json
{
  "weather": {
    "temperature": 22,
    "conditions": "Clear",
    "description": "clear sky",
    "humidity": 60,
    "wind_speed": 3.5
  },
  "recommendations": [
    "Perfect temperature for natural ventilation",
    "Great day for line-drying laundry instead of using dryer",
    "Open curtains to warm your home naturally"
  ],
  "timestamp": "2026-01-03T10:30:00Z"
}
```

---

### 3. Route Optimization

**POST** `/api/transport/route-optimize`

Compare carbon emissions across different transportation modes.

**Request:**
```json
{
  "origin": "Istanbul",
  "destination": "Manisa",
  "modes": ["driving", "transit"]
}
```

**Response:**
```json
{
  "routes": [
    {
      "mode": "driving",
      "distance_km": 450,
      "duration_min": 360,
      "co2_kg": 94.5,
      "start_address": "Istanbul, Turkey",
      "end_address": "Manisa, Turkey"
    },
    {
      "mode": "transit",
      "distance_km": 460,
      "duration_min": 420,
      "co2_kg": 41.4,
      "start_address": "Istanbul, Turkey",
      "end_address": "Manisa, Turkey"
    }
  ],
  "recommended": "transit",
  "savings_co2_kg": 53.1,
  "timestamp": "2026-01-03T10:30:00Z"
}
```

**Transport Modes:**
- `driving` - Private car
- `transit` - Public transportation
- `walking` - On foot
- `bicycling` - By bicycle

---

### 4. API Health Check

**GET** `/health/apis`

Check the status of all external API integrations.

**Response:**
```json
{
  "climatiq": "healthy",
  "openweathermap": "healthy",
  "google_maps": "healthy",
  "timestamp": "2026-01-03T10:30:00Z"
}
```

## 🎨 Frontend Usage

### Import the Service

```typescript
import {
  calculateCarbon,
  getWeatherRecommendations,
  optimizeRoute,
  checkApiHealth,
  type CarbonCalculateResponse,
  type WeatherRecommendationsResponse,
  type RouteOptimizeResponse,
} from '@/lib/api/carbon-service';
```

### Example 1: Calculate Carbon

```typescript
async function trackCarTravel() {
  try {
    const result = await calculateCarbon(
      'transport_car',
      50,
      'km',
      'Turkey'
    );
    
    console.log(`CO2 emissions: ${result.co2_kg} kg`);
    console.log(`Confidence: ${result.confidence}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### Example 2: Get Weather Recommendations

```typescript
async function getLocalRecommendations() {
  try {
    const result = await getWeatherRecommendations(38.619, 27.428);
    
    console.log(`Temperature: ${result.weather.temperature}°C`);
    console.log(`Conditions: ${result.weather.conditions}`);
    
    result.recommendations.forEach((tip, index) => {
      console.log(`${index + 1}. ${tip}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### Example 3: Compare Routes

```typescript
async function compareTransportOptions() {
  try {
    const result = await optimizeRoute(
      'Istanbul',
      'Manisa',
      ['driving', 'transit', 'bicycling']
    );
    
    console.log(`Recommended: ${result.recommended}`);
    console.log(`CO2 Savings: ${result.savings_co2_kg} kg`);
    
    result.routes.forEach(route => {
      console.log(
        `${route.mode}: ${route.distance_km} km, ` +
        `${route.duration_min} min, ${route.co2_kg} kg CO2`
      );
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### React Component Example

```typescript
'use client';

import { useState } from 'react';
import { calculateCarbon, type CarbonCalculateResponse } from '@/lib/api/carbon-service';

export default function CarbonCalculator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CarbonCalculateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await calculateCarbon('transport_car', 50, 'km');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleCalculate} disabled={loading}>
        {loading ? 'Calculating...' : 'Calculate Carbon'}
      </button>
      
      {error && <p className="error">{error}</p>}
      
      {result && (
        <div>
          <h3>Result:</h3>
          <p>CO2: {result.co2_kg} kg</p>
          <p>Source: {result.data_source}</p>
          <p>Confidence: {result.confidence}</p>
        </div>
      )}
    </div>
  );
}
```

## 🔧 Features

### Rate Limiting
- Maximum 60 requests per minute per IP address
- Automatic 429 error response when limit exceeded

### Retry Logic (Frontend)
- Automatic retry for failed requests (max 3 attempts)
- Exponential backoff between retries
- Only retries server errors (5xx), not client errors (4xx)

### Error Handling
- Comprehensive error messages
- Proper HTTP status codes
- Logging for all requests and errors

### CORS Configuration
- Allows requests from `localhost:3000`
- Supports all HTTP methods
- Credentials included

## 📝 Notes

- All API calls are logged for monitoring
- Timestamps are in UTC ISO format
- Temperature is in Celsius
- Distance is in kilometers
- Duration is in minutes
- CO2 emissions are in kilograms

## 🔑 Getting API Keys

1. **Climatiq**: https://www.climatiq.io/
2. **OpenWeatherMap**: https://openweathermap.org/api
3. **Google Directions**: https://developers.google.com/maps/documentation/directions/get-api-key
