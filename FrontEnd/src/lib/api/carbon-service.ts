/**
 * Carbon Service - API client for carbon calculation and route optimization
 * Handles communication with the backend API
 */

// ============================================================================
// Type Definitions
// ============================================================================

export type ActivityType = 'transport_car' | 'transport_bus' | 'diet_meat' | 'energy_electricity';
export type Unit = 'km' | 'kg' | 'kWh';
export type TransportMode = 'driving' | 'transit' | 'walking' | 'bicycling';

// Request Types
export interface CarbonCalculateRequest {
  activity_type: ActivityType;
  value: number;
  unit: Unit;
  location?: string;
}

export interface RouteOptimizeRequest {
  origin: string;
  destination: string;
  modes: TransportMode[];
}

// Response Types
export interface CarbonCalculateResponse {
  co2_kg: number;
  confidence: string;
  data_source: string;
  calculation_method: string;
  timestamp: string;
  location?: string;
}

export interface WeatherData {
  temperature: number;
  conditions: string;
  description: string;
  humidity?: number;
  wind_speed?: number;
}

export interface WeatherRecommendationsResponse {
  weather: WeatherData;
  recommendations: string[];
  timestamp: string;
}

export interface RouteData {
  mode: TransportMode;
  distance_km: number;
  duration_min: number;
  co2_kg: number;
  start_address?: string;
  end_address?: string;
  route_polyline?: string;
}

export interface RouteOptimizeResponse {
  routes: RouteData[];
  recommended: TransportMode;
  savings_co2_kg: number;
  timestamp: string;
}

export interface ApiHealthResponse {
  climatiq: 'healthy' | 'unhealthy';
  openweathermap: 'healthy' | 'unhealthy';
  google_maps: 'healthy' | 'unhealthy';
  timestamp: string;
}

// Error Response Type
export interface ApiError {
  detail: string;
  status?: number;
}

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Sleep for a specified duration
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Make API request with retry logic
 */
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        detail: `HTTP error: ${response.status}` 
      }));
      
      // Don't retry client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw {
          detail: errorData.detail || `Request failed with status ${response.status}`,
          status: response.status,
        } as ApiError;
      }
      
      // Retry server errors (5xx) and network issues
      throw new Error(errorData.detail || 'Server error');
    }

    return await response.json();
  } catch (error) {
    // If we have retries left and it's not a client error, retry
    if (retries > 0 && !(error as ApiError).status) {
      console.warn(`Request failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await sleep(RETRY_DELAY * (MAX_RETRIES - retries + 1));
      return fetchWithRetry<T>(url, options, retries - 1);
    }
    
    // No more retries or client error
    throw error;
  }
}

/**
 * Format error message for user display
 */
function formatErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'detail' in error) {
    return (error as ApiError).detail;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

// ============================================================================
// API Service Functions
// ============================================================================

/**
 * Calculate carbon emissions for a specific activity
 * 
 * @param activityType - Type of activity (transport_car, transport_bus, etc.)
 * @param value - Numeric amount
 * @param unit - Unit of measurement (km, kg, kWh)
 * @param location - Optional location context
 * @returns Promise with carbon calculation result
 * 
 * @example
 * ```typescript
 * const result = await calculateCarbon('transport_car', 25.5, 'km', 'Turkey');
 * console.log(`CO2 emissions: ${result.co2_kg} kg`);
 * ```
 */
export async function calculateCarbon(
  activityType: ActivityType,
  value: number,
  unit: Unit,
  location?: string
): Promise<CarbonCalculateResponse> {
  try {
    const requestBody: CarbonCalculateRequest = {
      activity_type: activityType,
      value,
      unit,
      ...(location && { location }),
    };

    const response = await fetchWithRetry<CarbonCalculateResponse>(
      `${API_BASE_URL}/api/carbon/calculate`,
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    return response;
  } catch (error) {
    console.error('Error calculating carbon:', error);
    throw new Error(formatErrorMessage(error));
  }
}

/**
 * Get weather data and eco-friendly recommendations
 * 
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Promise with weather data and recommendations
 * 
 * @example
 * ```typescript
 * const result = await getWeatherRecommendations(38.619, 27.428);
 * console.log(`Temperature: ${result.weather.temperature}°C`);
 * console.log(`Recommendations: ${result.recommendations.join(', ')}`);
 * ```
 */
export async function getWeatherRecommendations(
  latitude: number,
  longitude: number
): Promise<WeatherRecommendationsResponse> {
  try {
    const url = new URL(`${API_BASE_URL}/api/weather/recommendations`);
    url.searchParams.append('lat', latitude.toString());
    url.searchParams.append('lon', longitude.toString());

    const response = await fetchWithRetry<WeatherRecommendationsResponse>(
      url.toString(),
      {
        method: 'GET',
      }
    );

    return response;
  } catch (error) {
    console.error('Error getting weather recommendations:', error);
    throw new Error(formatErrorMessage(error));
  }
}

/**
 * Optimize route by comparing carbon emissions across transport modes
 * 
 * @param origin - Starting location
 * @param destination - Ending location
 * @param modes - Array of transport modes to compare
 * @returns Promise with route comparison and recommendations
 * 
 * @example
 * ```typescript
 * const result = await optimizeRoute('Istanbul', 'Manisa', ['driving', 'transit']);
 * console.log(`Recommended mode: ${result.recommended}`);
 * console.log(`CO2 savings: ${result.savings_co2_kg} kg`);
 * ```
 */
export async function optimizeRoute(
  origin: string,
  destination: string,
  modes: TransportMode[]
): Promise<RouteOptimizeResponse> {
  try {
    const requestBody: RouteOptimizeRequest = {
      origin,
      destination,
      modes,
    };

    const response = await fetchWithRetry<RouteOptimizeResponse>(
      `${API_BASE_URL}/api/transport/route-optimize`,
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    return response;
  } catch (error) {
    console.error('Error optimizing route:', error);
    throw new Error(formatErrorMessage(error));
  }
}

/**
 * Check health status of all external APIs
 * 
 * @returns Promise with health status of each API service
 * 
 * @example
 * ```typescript
 * const health = await checkApiHealth();
 * console.log(`Climatiq: ${health.climatiq}`);
 * console.log(`Weather API: ${health.openweathermap}`);
 * console.log(`Google Maps: ${health.google_maps}`);
 * ```
 */
export async function checkApiHealth(): Promise<ApiHealthResponse> {
  try {
    // Don't retry health checks
    const response = await fetch(`${API_BASE_URL}/health/apis`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Health check failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking API health:', error);
    throw new Error(formatErrorMessage(error));
  }
}

// ============================================================================
// React Hook Utilities (Optional - for easier React integration)
// ============================================================================

/**
 * State type for async operations
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Create initial async state
 */
export function createAsyncState<T>(): AsyncState<T> {
  return {
    data: null,
    loading: false,
    error: null,
  };
}

// ============================================================================
// Export all functions and types
// ============================================================================

export default {
  calculateCarbon,
  getWeatherRecommendations,
  optimizeRoute,
  checkApiHealth,
};
