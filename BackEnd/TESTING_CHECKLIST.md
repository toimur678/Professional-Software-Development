# EcoWisely Testing Checklist

## Pre-Testing Setup

### Backend
```bash
cd BackEnd
source venv/bin/activate  # or your virtual environment
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
```bash
cd FrontEnd
npm install
npm run dev
```

---

## Part 1: API Integration Tests

### 1. Automated API Tests
```bash
cd BackEnd
python test_apis.py
```

**Expected:** All tests pass with ✅

---

### 2. Health Check Endpoints

| Test | Command | Expected Result |
|------|---------|-----------------|
| Basic Health | `curl http://localhost:8000/health` | `{"status": "healthy", "model_loaded": true}` |
| API Health | `curl http://localhost:8000/health/apis` | All services "healthy" |

---

### 3. Carbon Calculation

```bash
curl -X POST http://localhost:8000/api/carbon/calculate \
  -H "Content-Type: application/json" \
  -d '{"activity_type":"transport_car","value":50,"unit":"km"}'
```

**Expected Response:**
```json
{
  "co2_kg": <number>,
  "confidence": "high",
  "data_source": "Climatiq",
  "calculation_method": "api",
  "timestamp": "..."
}
```

**Test Cases:**
- [ ] transport_car with km
- [ ] transport_bus with km
- [ ] diet_meat with kg
- [ ] energy_electricity with kWh
- [ ] Invalid activity_type → 400 error
- [ ] Negative value → 422 error

---

### 4. Weather Recommendations

```bash
curl "http://localhost:8000/api/weather/recommendations?lat=51.5074&lon=-0.1278"
```

**Expected Response:**
```json
{
  "weather": {
    "temperature": <number>,
    "conditions": "...",
    "description": "..."
  },
  "recommendations": ["tip1", "tip2", ...]
}
```

**Test Cases:**
- [ ] Valid coordinates (London: 51.5074, -0.1278)
- [ ] Valid coordinates (Istanbul: 41.0082, 28.9784)
- [ ] Invalid coordinates → Error handling

---

### 5. Route Optimization

```bash
curl -X POST http://localhost:8000/api/transport/route-optimize \
  -H "Content-Type: application/json" \
  -d '{"origin":"London","destination":"Manchester","modes":["driving","transit"]}'
```

**Expected Response:**
```json
{
  "routes": [...],
  "recommended": "transit",
  "savings_co2_kg": <number>
}
```

**Test Cases:**
- [ ] Two cities, two modes
- [ ] Three modes (driving, transit, bicycling)
- [ ] Same origin and destination
- [ ] Invalid city names → Error handling

---

## Part 2: Frontend Tests

### 1. Track Activity Page (http://localhost:3000/track)

#### Transport Form
- [ ] Select transport mode (car)
- [ ] Enter distance (50 km)
- [ ] Click "Log Transport"
- [ ] **Verify:** Loading spinner shows "Calculating..."
- [ ] **Verify:** Success toast appears
- [ ] **Verify:** Data source badge shows (Climatiq/API/Fallback)
- [ ] **Verify:** Confidence level displayed

#### Diet Form
- [ ] Select meal type (lunch)
- [ ] Select diet type (red-meat)
- [ ] Click "Log Meal"
- [ ] **Verify:** Loading spinner shows
- [ ] **Verify:** Success toast with CO2 value

#### Energy Form
- [ ] Select energy type (electricity)
- [ ] Enter usage (100 kWh)
- [ ] Click "Log Energy"
- [ ] **Verify:** Loading and success states

---

### 2. Dashboard Page (http://localhost:3000/dashboard)

- [ ] Weather widget loads
- [ ] Temperature displayed
- [ ] Weather icon matches conditions
- [ ] 3-5 eco tips shown
- [ ] Stats cards display correctly
- [ ] Chart shows weekly data
- [ ] Recent activity list populated

---

### 3. Browser Console Checks

Open DevTools (F12) → Console tab:

- [ ] No red errors on page load
- [ ] API calls visible in Network tab
- [ ] Responses are 200 OK
- [ ] No CORS errors

---

## Part 3: Error Handling Tests

### 1. Backend Unavailable

1. Stop backend server (Ctrl+C)
2. Try logging activity in frontend
3. **Expected:** 
   - [ ] Error message shows
   - [ ] Fallback calculation used (if implemented)
   - [ ] "Using estimated calculation" warning

### 2. Invalid API Key

1. Change API key in .env to invalid value
2. Restart backend
3. Call carbon calculate endpoint
4. **Expected:**
   - [ ] Error response returned
   - [ ] Meaningful error message

### 3. Extreme Values

Test these inputs:
- [ ] Distance: 0 → Should reject or handle
- [ ] Distance: 10000 km → Should calculate
- [ ] Distance: -50 → Should reject
- [ ] Very long city name → Should handle

---

## Part 4: Integration Tests

### 1. Activity Flow

1. Log 5 different activities:
   - [ ] Car trip (50 km)
   - [ ] Bus trip (30 km)
   - [ ] Vegetarian lunch
   - [ ] Red meat dinner
   - [ ] Electricity (20 kWh)

2. Check Dashboard:
   - [ ] Total CO2 updates
   - [ ] Recent activity shows all 5
   - [ ] Chart reflects new data

### 2. Weather Widget Updates

1. Note current weather
2. Wait 30 minutes (or force refresh)
3. **Verify:** Weather data updated

---

## Test Results Summary

| Test Category | Passed | Failed | Notes |
|---------------|--------|--------|-------|
| API Health | | | |
| Carbon Calculation | | | |
| Weather API | | | |
| Route Optimization | | | |
| Frontend Track Page | | | |
| Dashboard | | | |
| Error Handling | | | |
| Integration | | | |

---

## Quick Commands Reference

```bash
# Start backend
cd BackEnd && uvicorn main:app --reload

# Start frontend
cd FrontEnd && npm run dev

# Run API tests
python BackEnd/test_apis.py

# Check API health
curl http://localhost:8000/health/apis

# View logs
tail -f BackEnd/app.log
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Connection refused" | Start backend server |
| CORS error | Check CORS config in main.py |
| "Model not loaded" | Run `python train_model.py` |
| 401 Unauthorized | Check API keys in .env |
| Weather not loading | Check geolocation permissions |
| Data not saving | Check Supabase connection |

---

*Testing Checklist v1.0 - January 2026*
