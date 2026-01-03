"""
API Integrations Module
Handles external API calls for carbon calculations, weather data, and route emissions.
"""

import os
import logging
import requests
from typing import Dict, Optional, Tuple
from dotenv import load_dotenv
from geopy.geocoders import Nominatim
from geopy.distance import geodesic

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def load_environment_variables() -> None:
    """
    Load environment variables from .env file and validate required API keys.
    
    Raises:
        EnvironmentError: If any required API key is missing
    """
    try:
        load_dotenv()
        logger.info("Loaded environment variables from .env file")
        
        # Required API keys
        required_keys = [
            'CLIMATIQ_API_KEY',
            'OPENWEATHERMAP_API_KEY',
            'GOOGLE_DIRECTIONS_API_KEY'
        ]
        
        missing_keys = []
        for key in required_keys:
            if not os.getenv(key):
                missing_keys.append(key)
                logger.error(f"Missing required API key: {key}")
        
        if missing_keys:
            raise EnvironmentError(
                f"Missing required API keys: {', '.join(missing_keys)}. "
                "Please ensure these are set in your .env file."
            )
        
        logger.info("All required API keys validated successfully")
        
    except Exception as e:
        logger.error(f"Error loading environment variables: {str(e)}")
        raise


def calculate_carbon_climatiq(
    activity_type: str, 
    value: float, 
    unit: str
) -> Dict[str, any]:
    """
    Calculate carbon emissions using the Climatiq API.
    
    Args:
        activity_type: Type of activity - "transport_car", "transport_bus", 
                      "diet_meat", "energy_electricity"
        value: Numeric amount (km, kg, kWh)
        unit: Unit of measurement - "km", "kg", "kWh"
    
    Returns:
        Dict containing:
            - co2_kg: CO2 emissions in kilograms
            - confidence: Confidence level of the calculation
            - data_source: Source of the emission factor data
            - success: Boolean indicating success
            - error: Error message if failed
    
    Raises:
        ValueError: If invalid activity_type or unit provided
    """
    valid_activities = ["transport_car", "transport_bus", "diet_meat", "energy_electricity"]
    valid_units = ["km", "kg", "kWh"]
    
    if activity_type not in valid_activities:
        raise ValueError(f"Invalid activity_type. Must be one of: {valid_activities}")
    
    if unit not in valid_units:
        raise ValueError(f"Invalid unit. Must be one of: {valid_units}")
    
    try:
        api_key = os.getenv('CLIMATIQ_API_KEY')
        if not api_key:
            logger.error("CLIMATIQ_API_KEY not found")
            return {
                'success': False,
                'error': 'API key not configured'
            }
        
        endpoint = "https://api.climatiq.io/data/v1/estimate"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Map activity types to Climatiq emission factor IDs
        activity_mapping = {
            "transport_car": {
                "emission_factor": {
                    "activity_id": "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
                    "source": "BEIS",
                    "region": "GB",
                    "year": "2023"
                }
            },
            "transport_bus": {
                "emission_factor": {
                    "activity_id": "passenger_vehicle-vehicle_type_bus-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
                    "source": "BEIS",
                    "region": "GB",
                    "year": "2023"
                }
            },
            "diet_meat": {
                "emission_factor": {
                    "activity_id": "consumer_goods-type_meat_products",
                    "source": "EXIOBASE",
                    "region": "GB",
                    "year": "2023"
                }
            },
            "energy_electricity": {
                "emission_factor": {
                    "activity_id": "electricity-supply_grid-source_grid_mix",
                    "source": "BEIS",
                    "region": "GB",
                    "year": "2023"
                }
            }
        }
        
        # Construct request body
        body = {
            "emission_factor": activity_mapping[activity_type]["emission_factor"],
            "parameters": {
                "distance": value if unit == "km" else None,
                "weight": value if unit == "kg" else None,
                "energy": value if unit == "kWh" else None
            }
        }
        
        # Remove None values from parameters
        body["parameters"] = {k: v for k, v in body["parameters"].items() if v is not None}
        
        logger.info(f"Calling Climatiq API for {activity_type} with {value} {unit}")
        
        response = requests.post(
            endpoint,
            headers=headers,
            json=body,
            timeout=10
        )
        
        # Handle rate limiting
        if response.status_code == 429:
            logger.warning("Climatiq API rate limit exceeded")
            return {
                'success': False,
                'error': 'API rate limit exceeded. Please try again later.'
            }
        
        # Handle API errors
        if response.status_code != 200:
            logger.error(f"Climatiq API error: {response.status_code} - {response.text}")
            return {
                'success': False,
                'error': f'API request failed with status {response.status_code}'
            }
        
        data = response.json()
        
        result = {
            'success': True,
            'co2_kg': data.get('co2e', 0),
            'confidence': data.get('co2e_calculation_origin', 'unknown'),
            'data_source': data.get('emission_factor', {}).get('source', 'Climatiq')
        }
        
        logger.info(f"Successfully calculated carbon: {result['co2_kg']} kg CO2")
        return result
        
    except requests.exceptions.Timeout:
        logger.error("Climatiq API request timed out")
        return {
            'success': False,
            'error': 'API request timed out'
        }
    
    except requests.exceptions.ConnectionError:
        logger.error("Could not connect to Climatiq API")
        return {
            'success': False,
            'error': 'Could not connect to API. Please check your internet connection.'
        }
    
    except requests.exceptions.RequestException as e:
        logger.error(f"Climatiq API request failed: {str(e)}")
        return {
            'success': False,
            'error': f'API request failed: {str(e)}'
        }
    
    except Exception as e:
        logger.error(f"Unexpected error in calculate_carbon_climatiq: {str(e)}")
        return {
            'success': False,
            'error': f'Unexpected error: {str(e)}'
        }


def get_weather_data(latitude: float, longitude: float) -> Dict[str, any]:
    """
    Fetch weather data from OpenWeatherMap API.
    
    Args:
        latitude: Latitude coordinate
        longitude: Longitude coordinate
    
    Returns:
        Dict containing:
            - temperature: Temperature in Celsius
            - conditions: Main weather condition (e.g., "Clear", "Rain")
            - description: Detailed weather description
            - success: Boolean indicating success
            - error: Error message if failed
    """
    try:
        api_key = os.getenv('OPENWEATHERMAP_API_KEY')
        if not api_key:
            logger.error("OPENWEATHERMAP_API_KEY not found")
            return {
                'success': False,
                'error': 'API key not configured'
            }
        
        endpoint = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            'lat': latitude,
            'lon': longitude,
            'appid': api_key,
            'units': 'metric'  # Use Celsius
        }
        
        logger.info(f"Fetching weather data for coordinates: ({latitude}, {longitude})")
        
        response = requests.get(
            endpoint,
            params=params,
            timeout=10
        )
        
        if response.status_code == 401:
            logger.error("Invalid OpenWeatherMap API key")
            return {
                'success': False,
                'error': 'Invalid API key'
            }
        
        if response.status_code == 404:
            logger.error("Location not found in OpenWeatherMap")
            return {
                'success': False,
                'error': 'Location not found'
            }
        
        if response.status_code != 200:
            logger.error(f"OpenWeatherMap API error: {response.status_code}")
            return {
                'success': False,
                'error': f'API request failed with status {response.status_code}'
            }
        
        data = response.json()
        
        result = {
            'success': True,
            'temperature': data['main']['temp'],
            'conditions': data['weather'][0]['main'],
            'description': data['weather'][0]['description'],
            'humidity': data['main']['humidity'],
            'wind_speed': data['wind']['speed']
        }
        
        logger.info(f"Successfully fetched weather: {result['temperature']}°C, {result['conditions']}")
        return result
        
    except requests.exceptions.Timeout:
        logger.error("OpenWeatherMap API request timed out")
        return {
            'success': False,
            'error': 'API request timed out'
        }
    
    except requests.exceptions.ConnectionError:
        logger.error("Could not connect to OpenWeatherMap API")
        return {
            'success': False,
            'error': 'Could not connect to API. Please check your internet connection.'
        }
    
    except requests.exceptions.RequestException as e:
        logger.error(f"OpenWeatherMap API request failed: {str(e)}")
        return {
            'success': False,
            'error': f'API request failed: {str(e)}'
        }
    
    except KeyError as e:
        logger.error(f"Unexpected API response format: {str(e)}")
        return {
            'success': False,
            'error': 'Invalid API response format'
        }
    
    except Exception as e:
        logger.error(f"Unexpected error in get_weather_data: {str(e)}")
        return {
            'success': False,
            'error': f'Unexpected error: {str(e)}'
        }


def calculate_route_emissions(
    origin: str, 
    destination: str, 
    mode: str = "driving"
) -> Dict[str, any]:
    """
    Calculate route emissions using Google Directions API.
    
    Args:
        origin: Starting location (address or place name)
        destination: Ending location (address or place name)
        mode: Transportation mode - "driving", "transit", "walking", "bicycling"
    
    Returns:
        Dict containing:
            - distance_km: Distance in kilometers
            - duration_min: Duration in minutes
            - co2_kg: Estimated CO2 emissions in kg
            - route_polyline: Encoded polyline for route visualization
            - success: Boolean indicating success
            - error: Error message if failed
    """
    valid_modes = ["driving", "transit", "walking", "bicycling"]
    
    if mode not in valid_modes:
        raise ValueError(f"Invalid mode. Must be one of: {valid_modes}")
    
    try:
        api_key = os.getenv('GOOGLE_DIRECTIONS_API_KEY')
        if not api_key:
            logger.error("GOOGLE_DIRECTIONS_API_KEY not found")
            return {
                'success': False,
                'error': 'API key not configured'
            }
        
        endpoint = "https://maps.googleapis.com/maps/api/directions/json"
        params = {
            'origin': origin,
            'destination': destination,
            'mode': mode,
            'key': api_key
        }
        
        logger.info(f"Calculating route from {origin} to {destination} via {mode}")
        
        response = requests.get(
            endpoint,
            params=params,
            timeout=15
        )
        
        if response.status_code != 200:
            logger.error(f"Google Directions API error: {response.status_code}")
            return {
                'success': False,
                'error': f'API request failed with status {response.status_code}'
            }
        
        data = response.json()
        
        if data['status'] != 'OK':
            logger.error(f"Google Directions API returned status: {data['status']}")
            error_messages = {
                'NOT_FOUND': 'One or more locations could not be found',
                'ZERO_RESULTS': 'No route could be found between the locations',
                'MAX_WAYPOINTS_EXCEEDED': 'Too many waypoints provided',
                'INVALID_REQUEST': 'Invalid request parameters',
                'OVER_QUERY_LIMIT': 'API query limit exceeded',
                'REQUEST_DENIED': 'API request denied',
                'UNKNOWN_ERROR': 'Unknown error occurred'
            }
            return {
                'success': False,
                'error': error_messages.get(data['status'], f"API error: {data['status']}")
            }
        
        # Extract route information
        route = data['routes'][0]
        leg = route['legs'][0]
        
        distance_meters = leg['distance']['value']
        distance_km = distance_meters / 1000
        duration_seconds = leg['duration']['value']
        duration_min = duration_seconds / 60
        polyline = route['overview_polyline']['points']
        
        # Calculate CO2 emissions based on mode and distance
        # Emission factors (kg CO2 per km)
        emission_factors = {
            'driving': 0.171,      # Average car emissions
            'transit': 0.089,      # Average public transport
            'walking': 0.0,        # No emissions
            'bicycling': 0.0       # No emissions
        }
        
        co2_kg = distance_km * emission_factors.get(mode, 0)
        
        result = {
            'success': True,
            'distance_km': round(distance_km, 2),
            'duration_min': round(duration_min, 1),
            'co2_kg': round(co2_kg, 3),
            'route_polyline': polyline,
            'start_address': leg['start_address'],
            'end_address': leg['end_address']
        }
        
        logger.info(
            f"Route calculated: {result['distance_km']} km, "
            f"{result['duration_min']} min, {result['co2_kg']} kg CO2"
        )
        return result
        
    except requests.exceptions.Timeout:
        logger.error("Google Directions API request timed out")
        return {
            'success': False,
            'error': 'API request timed out'
        }
    
    except requests.exceptions.ConnectionError:
        logger.error("Could not connect to Google Directions API")
        return {
            'success': False,
            'error': 'Could not connect to API. Please check your internet connection.'
        }
    
    except requests.exceptions.RequestException as e:
        logger.error(f"Google Directions API request failed: {str(e)}")
        return {
            'success': False,
            'error': f'API request failed: {str(e)}'
        }
    
    except (KeyError, IndexError) as e:
        logger.error(f"Unexpected API response format: {str(e)}")
        return {
            'success': False,
            'error': 'Invalid API response format'
        }
    
    except Exception as e:
        logger.error(f"Unexpected error in calculate_route_emissions: {str(e)}")
        return {
            'success': False,
            'error': f'Unexpected error: {str(e)}'
        }


# Example usage and testing
if __name__ == "__main__":
    try:
        # Load environment variables
        load_environment_variables()
        
        # Test carbon calculation
        print("\n=== Testing Carbon Calculation ===")
        result = calculate_carbon_climatiq("transport_car", 50, "km")
        print(f"Result: {result}")
        
        # Test weather data
        print("\n=== Testing Weather Data ===")
        weather = get_weather_data(51.5074, -0.1278)  # London coordinates
        print(f"Weather: {weather}")
        
        # Test route emissions
        print("\n=== Testing Route Emissions ===")
        route = calculate_route_emissions("London", "Manchester", "driving")
        print(f"Route: {route}")
        
    except Exception as e:
        logger.error(f"Error in main: {str(e)}")
        print(f"Error: {str(e)}")
