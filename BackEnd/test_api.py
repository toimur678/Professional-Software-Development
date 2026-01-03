"""
API Testing Script
Run this to test all the new API endpoints
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def print_section(title):
    """Print a formatted section header"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def test_carbon_calculate():
    """Test carbon calculation endpoint"""
    print_section("Testing Carbon Calculate API")
    
    endpoint = f"{BASE_URL}/api/carbon/calculate"
    payload = {
        "activity_type": "transport_car",
        "value": 25.5,
        "unit": "km",
        "location": "Turkey"
    }
    
    print(f"POST {endpoint}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(endpoint, json=payload, timeout=10)
        print(f"\nStatus Code: {response.status_code}")
        
        if response.ok:
            data = response.json()
            print(f"✅ Success!")
            print(json.dumps(data, indent=2))
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Request failed: {str(e)}")

def test_weather_recommendations():
    """Test weather recommendations endpoint"""
    print_section("Testing Weather Recommendations API")
    
    lat, lon = 38.619, 27.428  # Manisa, Turkey
    endpoint = f"{BASE_URL}/api/weather/recommendations?lat={lat}&lon={lon}"
    
    print(f"GET {endpoint}")
    
    try:
        response = requests.get(endpoint, timeout=10)
        print(f"\nStatus Code: {response.status_code}")
        
        if response.ok:
            data = response.json()
            print(f"✅ Success!")
            print(f"\nTemperature: {data['weather']['temperature']}°C")
            print(f"Conditions: {data['weather']['conditions']}")
            print(f"Description: {data['weather']['description']}")
            print(f"\nRecommendations:")
            for i, rec in enumerate(data['recommendations'], 1):
                print(f"  {i}. {rec}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Request failed: {str(e)}")

def test_route_optimize():
    """Test route optimization endpoint"""
    print_section("Testing Route Optimization API")
    
    endpoint = f"{BASE_URL}/api/transport/route-optimize"
    payload = {
        "origin": "Istanbul",
        "destination": "Manisa",
        "modes": ["driving", "transit"]
    }
    
    print(f"POST {endpoint}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(endpoint, json=payload, timeout=15)
        print(f"\nStatus Code: {response.status_code}")
        
        if response.ok:
            data = response.json()
            print(f"✅ Success!")
            print(f"\nRecommended Mode: {data['recommended']}")
            print(f"CO2 Savings: {data['savings_co2_kg']} kg")
            print(f"\nRoute Comparison:")
            for route in data['routes']:
                print(f"  {route['mode'].upper()}:")
                print(f"    - Distance: {route['distance_km']} km")
                print(f"    - Duration: {route['duration_min']} min")
                print(f"    - CO2: {route['co2_kg']} kg")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Request failed: {str(e)}")

def test_api_health():
    """Test API health check endpoint"""
    print_section("Testing API Health Check")
    
    endpoint = f"{BASE_URL}/health/apis"
    
    print(f"GET {endpoint}")
    
    try:
        response = requests.get(endpoint, timeout=10)
        print(f"\nStatus Code: {response.status_code}")
        
        if response.ok:
            data = response.json()
            print(f"✅ Success!")
            print(f"\nAPI Status:")
            print(f"  Climatiq: {data['climatiq']}")
            print(f"  OpenWeatherMap: {data['openweathermap']}")
            print(f"  Google Maps: {data['google_maps']}")
            print(f"  Checked at: {data['timestamp']}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Request failed: {str(e)}")

def test_rate_limiting():
    """Test rate limiting (warning: makes 65 requests)"""
    print_section("Testing Rate Limiting (Optional)")
    
    response = input("This will make 65 requests to test rate limiting. Continue? (y/n): ")
    if response.lower() != 'y':
        print("Skipped rate limiting test")
        return
    
    endpoint = f"{BASE_URL}/health"
    
    print(f"\nMaking 65 requests to {endpoint}...")
    
    success_count = 0
    rate_limited = False
    
    for i in range(65):
        try:
            response = requests.get(endpoint, timeout=1)
            if response.status_code == 200:
                success_count += 1
            elif response.status_code == 429:
                rate_limited = True
                print(f"\n✅ Rate limit triggered at request #{i + 1}")
                break
        except Exception as e:
            print(f"Request {i + 1} failed: {str(e)}")
    
    if rate_limited:
        print(f"✅ Rate limiting working! {success_count} successful requests before limit")
    else:
        print(f"⚠️ No rate limit hit after 65 requests. Check configuration.")

def main():
    """Run all API tests"""
    print("\n" + "=" * 60)
    print("  EcoWisely API Test Suite")
    print("  Make sure the backend server is running on port 8000")
    print("=" * 60)
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=2)
        if not response.ok:
            print("\n❌ Server is not responding. Please start the backend server:")
            print("   cd BackEnd && uvicorn main:app --reload")
            return
    except Exception as e:
        print("\n❌ Cannot connect to backend server. Please start it:")
        print("   cd BackEnd && uvicorn main:app --reload")
        return
    
    print("\n✅ Server is running!\n")
    
    # Run all tests
    tests = [
        ("1", "Carbon Calculate", test_carbon_calculate),
        ("2", "Weather Recommendations", test_weather_recommendations),
        ("3", "Route Optimization", test_route_optimize),
        ("4", "API Health Check", test_api_health),
        ("5", "Rate Limiting", test_rate_limiting),
    ]
    
    while True:
        print("\n" + "=" * 60)
        print("  Select a test to run:")
        print("=" * 60)
        for num, name, _ in tests:
            print(f"  {num}. {name}")
        print("  0. Run all tests (except rate limiting)")
        print("  q. Quit")
        print("=" * 60)
        
        choice = input("\nEnter your choice: ").strip().lower()
        
        if choice == 'q':
            print("\n👋 Goodbye!")
            break
        elif choice == '0':
            for num, name, test_func in tests[:-1]:  # Skip rate limiting in "run all"
                test_func()
            print("\n" + "=" * 60)
            print("  All tests completed!")
            print("=" * 60)
        else:
            for num, name, test_func in tests:
                if choice == num:
                    test_func()
                    break
            else:
                print("❌ Invalid choice. Please try again.")

if __name__ == "__main__":
    main()
