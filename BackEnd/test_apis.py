#!/usr/bin/env python3
"""
API Integration Test Script
Tests all external API integrations (Climatiq, OpenWeatherMap, Google Maps)
Run: python test_apis.py
"""

import os
import sys
import json
import time
import requests
from datetime import datetime
from typing import Dict, Any, Tuple
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header(text: str):
    """Print a styled header"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}  {text}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")

def print_success(text: str):
    """Print success message"""
    print(f"{Colors.GREEN}✅ PASS: {text}{Colors.END}")

def print_failure(text: str):
    """Print failure message"""
    print(f"{Colors.RED}❌ FAIL: {text}{Colors.END}")

def print_warning(text: str):
    """Print warning message"""
    print(f"{Colors.YELLOW}⚠️  WARN: {text}{Colors.END}")

def print_info(text: str):
    """Print info message"""
    print(f"{Colors.CYAN}ℹ️  INFO: {text}{Colors.END}")

def print_sample(title: str, data: Any):
    """Print API response sample"""
    print(f"\n{Colors.BOLD}📦 Sample Response - {title}:{Colors.END}")
    if isinstance(data, dict):
        print(json.dumps(data, indent=2, default=str))
    else:
        print(data)

# ============================================================================
# API KEY VALIDATION
# ============================================================================

def check_api_keys() -> Dict[str, bool]:
    """Check if all required API keys are configured"""
    print_header("Checking API Keys")
    
    keys = {
        'CLIMATIQ_API_KEY': os.getenv('CLIMATIQ_API_KEY'),
        'OPENWEATHERMAP_API_KEY': os.getenv('OPENWEATHERMAP_API_KEY'),
        'GOOGLE_DIRECTIONS_API_KEY': os.getenv('GOOGLE_DIRECTIONS_API_KEY'),
    }
    
    results = {}
    for key_name, key_value in keys.items():
        if key_value and len(key_value) > 10:
            print_success(f"{key_name} is configured (length: {len(key_value)})")
            results[key_name] = True
        else:
            print_failure(f"{key_name} is missing or too short")
            results[key_name] = False
    
    return results

# ============================================================================
# CLIMATIQ API TESTS
# ============================================================================

def test_climatiq_api() -> Tuple[bool, Dict]:
    """Test Climatiq API for carbon emission calculations"""
    print_header("Testing Climatiq API")
    
    api_key = os.getenv('CLIMATIQ_API_KEY')
    if not api_key:
        print_failure("CLIMATIQ_API_KEY not found")
        return False, {}
    
    endpoint = "https://api.climatiq.io/data/v1/estimate"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Test 1: Car transport emissions
    test_cases = [
        {
            "name": "Car Transport (50km)",
            "body": {
                "emission_factor": {
                    "activity_id": "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
                    "source": "BEIS",
                    "region": "GB",
                    "year": "2023"
                },
                "parameters": {
                    "distance": 50,
                    "distance_unit": "km"
                }
            }
        },
        {
            "name": "Electricity Usage (100 kWh)",
            "body": {
                "emission_factor": {
                    "activity_id": "electricity-supply_grid-source_grid_mix",
                    "source": "BEIS",
                    "region": "GB",
                    "year": "2023"
                },
                "parameters": {
                    "energy": 100,
                    "energy_unit": "kWh"
                }
            }
        }
    ]
    
    all_passed = True
    results = {}
    
    for test in test_cases:
        print(f"\n{Colors.BOLD}Testing: {test['name']}{Colors.END}")
        
        try:
            start_time = time.time()
            response = requests.post(
                endpoint,
                headers=headers,
                json=test['body'],
                timeout=10
            )
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                co2e = data.get('co2e', 0)
                print_success(f"{test['name']} - {co2e:.2f} kg CO2e (Response time: {duration:.2f}s)")
                results[test['name']] = {
                    'success': True,
                    'co2e': co2e,
                    'response_time': duration
                }
                print_sample(test['name'], {
                    'co2e': data.get('co2e'),
                    'co2e_unit': data.get('co2e_unit'),
                    'emission_factor': data.get('emission_factor', {}).get('activity_id')
                })
            elif response.status_code == 401:
                print_failure(f"{test['name']} - Invalid API key (401)")
                all_passed = False
                results[test['name']] = {'success': False, 'error': 'Invalid API key'}
            elif response.status_code == 429:
                print_warning(f"{test['name']} - Rate limit exceeded (429)")
                results[test['name']] = {'success': False, 'error': 'Rate limit exceeded'}
            else:
                print_failure(f"{test['name']} - HTTP {response.status_code}: {response.text[:200]}")
                all_passed = False
                results[test['name']] = {'success': False, 'error': f'HTTP {response.status_code}'}
                
        except requests.exceptions.Timeout:
            print_failure(f"{test['name']} - Request timed out")
            all_passed = False
            results[test['name']] = {'success': False, 'error': 'Timeout'}
        except requests.exceptions.ConnectionError:
            print_failure(f"{test['name']} - Connection error (check network)")
            all_passed = False
            results[test['name']] = {'success': False, 'error': 'Connection error'}
        except Exception as e:
            print_failure(f"{test['name']} - {str(e)}")
            all_passed = False
            results[test['name']] = {'success': False, 'error': str(e)}
    
    return all_passed, results

# ============================================================================
# OPENWEATHERMAP API TESTS
# ============================================================================

def test_openweathermap_api() -> Tuple[bool, Dict]:
    """Test OpenWeatherMap API for weather data"""
    print_header("Testing OpenWeatherMap API")
    
    api_key = os.getenv('OPENWEATHERMAP_API_KEY')
    if not api_key:
        print_failure("OPENWEATHERMAP_API_KEY not found")
        return False, {}
    
    endpoint = "https://api.openweathermap.org/data/2.5/weather"
    
    # Test locations
    test_locations = [
        {"name": "London, UK", "lat": 51.5074, "lon": -0.1278},
        {"name": "Istanbul, Turkey", "lat": 41.0082, "lon": 28.9784},
        {"name": "New York, USA", "lat": 40.7128, "lon": -74.0060}
    ]
    
    all_passed = True
    results = {}
    
    for location in test_locations:
        print(f"\n{Colors.BOLD}Testing: {location['name']}{Colors.END}")
        
        try:
            start_time = time.time()
            response = requests.get(
                endpoint,
                params={
                    'lat': location['lat'],
                    'lon': location['lon'],
                    'appid': api_key,
                    'units': 'metric'
                },
                timeout=10
            )
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                temp = data['main']['temp']
                conditions = data['weather'][0]['main']
                print_success(f"{location['name']} - {temp}°C, {conditions} (Response time: {duration:.2f}s)")
                results[location['name']] = {
                    'success': True,
                    'temperature': temp,
                    'conditions': conditions,
                    'response_time': duration
                }
                print_sample(location['name'], {
                    'temperature': temp,
                    'conditions': conditions,
                    'description': data['weather'][0]['description'],
                    'humidity': data['main']['humidity'],
                    'wind_speed': data['wind']['speed']
                })
            elif response.status_code == 401:
                print_failure(f"{location['name']} - Invalid API key (401)")
                all_passed = False
                results[location['name']] = {'success': False, 'error': 'Invalid API key'}
            else:
                print_failure(f"{location['name']} - HTTP {response.status_code}")
                all_passed = False
                results[location['name']] = {'success': False, 'error': f'HTTP {response.status_code}'}
                
        except requests.exceptions.Timeout:
            print_failure(f"{location['name']} - Request timed out")
            all_passed = False
            results[location['name']] = {'success': False, 'error': 'Timeout'}
        except requests.exceptions.ConnectionError:
            print_failure(f"{location['name']} - Connection error")
            all_passed = False
            results[location['name']] = {'success': False, 'error': 'Connection error'}
        except Exception as e:
            print_failure(f"{location['name']} - {str(e)}")
            all_passed = False
            results[location['name']] = {'success': False, 'error': str(e)}
    
    return all_passed, results

# ============================================================================
# GOOGLE MAPS DIRECTIONS API TESTS
# ============================================================================

def test_google_maps_api() -> Tuple[bool, Dict]:
    """Test Google Maps Directions API for route calculations"""
    print_header("Testing Google Maps Directions API")
    
    api_key = os.getenv('GOOGLE_DIRECTIONS_API_KEY')
    if not api_key:
        print_failure("GOOGLE_DIRECTIONS_API_KEY not found")
        return False, {}
    
    endpoint = "https://maps.googleapis.com/maps/api/directions/json"
    
    # Test routes
    test_routes = [
        {"origin": "Istanbul", "destination": "Ankara", "mode": "driving"},
        {"origin": "London", "destination": "Manchester", "mode": "driving"},
        {"origin": "London", "destination": "Manchester", "mode": "transit"}
    ]
    
    all_passed = True
    results = {}
    
    for route in test_routes:
        route_name = f"{route['origin']} → {route['destination']} ({route['mode']})"
        print(f"\n{Colors.BOLD}Testing: {route_name}{Colors.END}")
        
        try:
            start_time = time.time()
            response = requests.get(
                endpoint,
                params={
                    'origin': route['origin'],
                    'destination': route['destination'],
                    'mode': route['mode'],
                    'key': api_key
                },
                timeout=15
            )
            duration = time.time() - start_time
            
            data = response.json()
            status = data.get('status')
            
            if status == 'OK':
                leg = data['routes'][0]['legs'][0]
                distance = leg['distance']['text']
                travel_time = leg['duration']['text']
                print_success(f"{route_name} - {distance}, {travel_time} (Response time: {duration:.2f}s)")
                results[route_name] = {
                    'success': True,
                    'distance': distance,
                    'duration': travel_time,
                    'response_time': duration
                }
                print_sample(route_name, {
                    'distance': distance,
                    'duration': travel_time,
                    'start_address': leg['start_address'],
                    'end_address': leg['end_address']
                })
            elif status == 'REQUEST_DENIED':
                print_failure(f"{route_name} - API key invalid or Directions API not enabled")
                print_info("Enable Directions API at: https://console.cloud.google.com/apis/library/directions-backend.googleapis.com")
                all_passed = False
                results[route_name] = {'success': False, 'error': 'REQUEST_DENIED'}
            elif status == 'ZERO_RESULTS':
                print_warning(f"{route_name} - No route found")
                results[route_name] = {'success': False, 'error': 'No route found'}
            else:
                print_failure(f"{route_name} - Status: {status}")
                all_passed = False
                results[route_name] = {'success': False, 'error': status}
                
        except requests.exceptions.Timeout:
            print_failure(f"{route_name} - Request timed out")
            all_passed = False
            results[route_name] = {'success': False, 'error': 'Timeout'}
        except requests.exceptions.ConnectionError:
            print_failure(f"{route_name} - Connection error")
            all_passed = False
            results[route_name] = {'success': False, 'error': 'Connection error'}
        except Exception as e:
            print_failure(f"{route_name} - {str(e)}")
            all_passed = False
            results[route_name] = {'success': False, 'error': str(e)}
    
    return all_passed, results

# ============================================================================
# LOCAL API ENDPOINT TESTS
# ============================================================================

def test_local_api_endpoints() -> Tuple[bool, Dict]:
    """Test local FastAPI endpoints"""
    print_header("Testing Local API Endpoints")
    
    base_url = "http://localhost:8000"
    all_passed = True
    results = {}
    
    # Test 1: Health check
    print(f"\n{Colors.BOLD}Testing: Health Check{Colors.END}")
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print_success("Health check passed")
            results['health'] = {'success': True}
        else:
            print_failure(f"Health check failed: {response.status_code}")
            all_passed = False
            results['health'] = {'success': False}
    except requests.exceptions.ConnectionError:
        print_failure("Cannot connect to local server. Is it running?")
        print_info("Start server with: uvicorn main:app --reload")
        return False, {'error': 'Server not running'}
    
    # Test 2: API Health
    print(f"\n{Colors.BOLD}Testing: API Health Check{Colors.END}")
    try:
        response = requests.get(f"{base_url}/health/apis", timeout=30)
        if response.status_code == 200:
            data = response.json()
            print_success("API health check passed")
            print_sample("API Health", data)
            results['api_health'] = {'success': True, 'data': data}
        else:
            print_failure(f"API health check failed: {response.status_code}")
            all_passed = False
            results['api_health'] = {'success': False}
    except Exception as e:
        print_failure(f"API health check error: {str(e)}")
        all_passed = False
    
    # Test 3: Carbon calculation
    print(f"\n{Colors.BOLD}Testing: Carbon Calculation Endpoint{Colors.END}")
    try:
        response = requests.post(
            f"{base_url}/api/carbon/calculate",
            json={
                "activity_type": "transport_car",
                "value": 50,
                "unit": "km"
            },
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            print_success(f"Carbon calculation passed: {data.get('co2_kg', 'N/A')} kg CO2")
            print_sample("Carbon Calculation", data)
            results['carbon_calculate'] = {'success': True, 'data': data}
        else:
            print_failure(f"Carbon calculation failed: {response.status_code}")
            print_info(f"Response: {response.text[:200]}")
            all_passed = False
            results['carbon_calculate'] = {'success': False}
    except Exception as e:
        print_failure(f"Carbon calculation error: {str(e)}")
        all_passed = False
    
    # Test 4: Weather recommendations
    print(f"\n{Colors.BOLD}Testing: Weather Recommendations Endpoint{Colors.END}")
    try:
        response = requests.get(
            f"{base_url}/api/weather/recommendations",
            params={"lat": 51.5074, "lon": -0.1278},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            print_success(f"Weather recommendations passed: {data.get('weather', {}).get('temperature', 'N/A')}°C")
            print_sample("Weather Recommendations", {
                'weather': data.get('weather'),
                'recommendations_count': len(data.get('recommendations', []))
            })
            results['weather'] = {'success': True, 'data': data}
        else:
            print_failure(f"Weather recommendations failed: {response.status_code}")
            all_passed = False
            results['weather'] = {'success': False}
    except Exception as e:
        print_failure(f"Weather recommendations error: {str(e)}")
        all_passed = False
    
    # Test 5: Route optimization
    print(f"\n{Colors.BOLD}Testing: Route Optimization Endpoint{Colors.END}")
    try:
        response = requests.post(
            f"{base_url}/api/transport/route-optimize",
            json={
                "origin": "London",
                "destination": "Manchester",
                "modes": ["driving", "transit"]
            },
            timeout=20
        )
        if response.status_code == 200:
            data = response.json()
            print_success(f"Route optimization passed: Recommended {data.get('recommended', 'N/A')}")
            print_sample("Route Optimization", {
                'routes': len(data.get('routes', [])),
                'recommended': data.get('recommended'),
                'savings_co2_kg': data.get('savings_co2_kg')
            })
            results['route_optimize'] = {'success': True, 'data': data}
        else:
            print_failure(f"Route optimization failed: {response.status_code}")
            all_passed = False
            results['route_optimize'] = {'success': False}
    except Exception as e:
        print_failure(f"Route optimization error: {str(e)}")
        all_passed = False
    
    return all_passed, results

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

def run_all_tests():
    """Run all API integration tests"""
    print(f"\n{Colors.BOLD}{Colors.CYAN}")
    print("╔══════════════════════════════════════════════════════════╗")
    print("║          EcoWisely API Integration Test Suite            ║")
    print("║                                                          ║")
    print(f"║  Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}                        ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print(Colors.END)
    
    results = {
        'timestamp': datetime.now().isoformat(),
        'tests': {}
    }
    
    # Check API keys first
    key_results = check_api_keys()
    results['api_keys'] = key_results
    
    # Run external API tests
    climatiq_passed, climatiq_results = test_climatiq_api()
    results['tests']['climatiq'] = {
        'passed': climatiq_passed,
        'results': climatiq_results
    }
    
    weather_passed, weather_results = test_openweathermap_api()
    results['tests']['openweathermap'] = {
        'passed': weather_passed,
        'results': weather_results
    }
    
    google_passed, google_results = test_google_maps_api()
    results['tests']['google_maps'] = {
        'passed': google_passed,
        'results': google_results
    }
    
    # Run local API tests
    local_passed, local_results = test_local_api_endpoints()
    results['tests']['local_api'] = {
        'passed': local_passed,
        'results': local_results
    }
    
    # Summary
    print_header("TEST SUMMARY")
    
    all_passed = True
    
    test_summary = [
        ("API Keys", all(key_results.values())),
        ("Climatiq API", climatiq_passed),
        ("OpenWeatherMap API", weather_passed),
        ("Google Maps API", google_passed),
        ("Local API Endpoints", local_passed)
    ]
    
    for test_name, passed in test_summary:
        if passed:
            print_success(f"{test_name}")
        else:
            print_failure(f"{test_name}")
            all_passed = False
    
    # Final verdict
    print(f"\n{Colors.BOLD}")
    if all_passed:
        print(f"{Colors.GREEN}╔══════════════════════════════════════════════════════════╗")
        print(f"║              🎉 ALL TESTS PASSED! 🎉                     ║")
        print(f"╚══════════════════════════════════════════════════════════╝{Colors.END}")
    else:
        print(f"{Colors.RED}╔══════════════════════════════════════════════════════════╗")
        print(f"║              ⚠️  SOME TESTS FAILED ⚠️                     ║")
        print(f"╚══════════════════════════════════════════════════════════╝{Colors.END}")
        print(f"\n{Colors.YELLOW}Troubleshooting Tips:{Colors.END}")
        print("1. Check .env file has all API keys")
        print("2. Verify API keys are valid and not expired")
        print("3. Ensure network connectivity")
        print("4. Check if backend server is running (uvicorn main:app --reload)")
        print("5. Check API rate limits haven't been exceeded")
    
    # Save results to file
    results_file = 'tests/api_test_results.json'
    os.makedirs('tests', exist_ok=True)
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\n{Colors.CYAN}Results saved to: {results_file}{Colors.END}")
    
    return all_passed

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
