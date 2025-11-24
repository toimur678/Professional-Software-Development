// App constants
export const ACTIVITY_TYPES = {
  TRANSPORT: 'transport',
  ENERGY: 'energy',
  FOOD: 'food',
  WASTE: 'waste',
}

export const TRANSPORT_MODES = [
  { id: 'car', label: 'Car', icon: '🚗', carbonFactor: 0.21 },
  { id: 'bus', label: 'Bus', icon: '🚌', carbonFactor: 0.089 },
  { id: 'train', label: 'Train', icon: '🚆', carbonFactor: 0.041 },
  { id: 'bike', label: 'Bike', icon: '🚴', carbonFactor: 0 },
  { id: 'walk', label: 'Walk', icon: '🚶', carbonFactor: 0 },
  { id: 'flight', label: 'Flight', icon: '✈️', carbonFactor: 0.255 },
]

export const ENERGY_TYPES = [
  { id: 'electricity', label: 'Electricity', icon: '⚡', unit: 'kWh', carbonFactor: 0.475 },
  { id: 'gas', label: 'Natural Gas', icon: '🔥', unit: 'm³', carbonFactor: 2.0 },
  { id: 'water', label: 'Water', icon: '💧', unit: 'liters', carbonFactor: 0.0003 },
]

export const FOOD_TYPES = [
  { id: 'beef', label: 'Beef', icon: '🥩', carbonFactor: 27.0 },
  { id: 'chicken', label: 'Chicken', icon: '🍗', carbonFactor: 6.9 },
  { id: 'fish', label: 'Fish', icon: '🐟', carbonFactor: 6.1 },
  { id: 'vegetables', label: 'Vegetables', icon: '🥗', carbonFactor: 2.0 },
  { id: 'dairy', label: 'Dairy', icon: '🥛', carbonFactor: 1.9 },
]

export const WASTE_TYPES = [
  { id: 'general', label: 'General Waste', icon: '🗑️', carbonFactor: 0.5 },
  { id: 'recycled', label: 'Recycled', icon: '♻️', carbonFactor: 0.1 },
  { id: 'compost', label: 'Compost', icon: '🌱', carbonFactor: 0.05 },
]

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export const CARBON_GOALS = {
  DAILY: 16.4, // kg CO2e per day (average global target)
  WEEKLY: 114.8,
  MONTHLY: 492,
}

export const CHART_COLORS = {
  primary: '#22c55e',
  secondary: '#3b82f6',
  warning: '#f59e0b',
  danger: '#ef4444',
  gray: '#6b7280',
}
