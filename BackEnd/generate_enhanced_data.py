#!/usr/bin/env python3
"""
Enhanced Data Generation Script
Generates 10,000 realistic training samples with user context features
for improved ML model training.
"""

import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta
import random

# Ensure data directory exists
os.makedirs('data', exist_ok=True)

# Configuration
N_SAMPLES = 10000
RANDOM_SEED = 42

# Distribution weights
LOCATION_WEIGHTS = {'urban': 0.40, 'suburban': 0.40, 'rural': 0.20}
VEHICLE_WEIGHTS = {'none': 0.15, 'petrol': 0.40, 'diesel': 0.20, 'electric': 0.10, 'hybrid': 0.15}
DIET_WEIGHTS = {'vegan': 0.10, 'vegetarian': 0.20, 'pescatarian': 0.15, 'omnivore': 0.55}
HOME_WEIGHTS = {'apartment': 0.60, 'house': 0.35, 'shared': 0.05}
SEASON_WEIGHTS = {'spring': 0.25, 'summer': 0.25, 'fall': 0.25, 'winter': 0.25}

# Emission reduction factors based on user characteristics
EMISSION_FACTORS = {
    'urban_transport': 0.7,      # Urban dwellers use 30% less transport
    'electric_vehicle': 0.2,     # EVs produce 80% less transport emissions
    'hybrid_vehicle': 0.5,       # Hybrids produce 50% less
    'no_vehicle': 0.1,           # No car = minimal transport emissions
    'vegan_diet': 0.4,           # Vegans produce 60% less diet emissions
    'vegetarian_diet': 0.6,      # Vegetarians produce 40% less
    'pescatarian_diet': 0.75,    # Pescatarians produce 25% less
    'renewable_energy': 0.5,     # Renewable energy = 50% less energy emissions
    'apartment_energy': 0.7,     # Apartments use less energy than houses
    'summer_energy': 1.3,        # Summer = more AC usage
    'winter_energy': 1.4,        # Winter = more heating
}

def weighted_choice(choices_dict):
    """Select a random choice based on weights"""
    choices = list(choices_dict.keys())
    weights = list(choices_dict.values())
    return np.random.choice(choices, p=weights)

def generate_household_size():
    """Generate household size with realistic distribution"""
    # Weighted towards 2-4 people
    sizes = [1, 2, 3, 4, 5, 6]
    weights = [0.15, 0.30, 0.25, 0.20, 0.07, 0.03]
    return np.random.choice(sizes, p=weights)

def calculate_transport_emissions(user_context):
    """Calculate transport emissions based on user context"""
    base_emission = np.random.uniform(2, 20)  # Base 2-20 kg
    
    # Apply location factor
    if user_context['location_type'] == 'urban':
        base_emission *= EMISSION_FACTORS['urban_transport']
    elif user_context['location_type'] == 'rural':
        base_emission *= 1.3  # Rural = more driving
    
    # Apply vehicle factor
    vehicle = user_context['vehicle_type']
    if vehicle == 'none':
        base_emission *= EMISSION_FACTORS['no_vehicle']
    elif vehicle == 'electric':
        base_emission *= EMISSION_FACTORS['electric_vehicle']
    elif vehicle == 'hybrid':
        base_emission *= EMISSION_FACTORS['hybrid_vehicle']
    
    # Adjust by commute distance
    commute_factor = user_context['commute_distance'] / 20  # Normalize by 20km average
    base_emission *= max(0.5, min(2.0, commute_factor))
    
    # Add noise
    base_emission *= np.random.uniform(0.8, 1.2)
    
    return max(0, base_emission)

def calculate_diet_emissions(user_context):
    """Calculate diet emissions based on user context"""
    base_emission = np.random.uniform(3, 12)  # Base 3-12 kg
    
    # Apply diet preference factor
    diet = user_context['diet_preference']
    if diet == 'vegan':
        base_emission *= EMISSION_FACTORS['vegan_diet']
    elif diet == 'vegetarian':
        base_emission *= EMISSION_FACTORS['vegetarian_diet']
    elif diet == 'pescatarian':
        base_emission *= EMISSION_FACTORS['pescatarian_diet']
    
    # Scale by household size (more people = more food)
    household_factor = 1 + (user_context['household_size'] - 1) * 0.15
    base_emission *= household_factor
    
    # Adjust by meals out (eating out = higher emissions)
    meals_out_factor = 1 + user_context['meals_out_weekly'] * 0.05
    base_emission *= meals_out_factor
    
    # Add noise
    base_emission *= np.random.uniform(0.85, 1.15)
    
    return max(0.5, base_emission)

def calculate_energy_emissions(user_context):
    """Calculate energy emissions based on user context"""
    base_emission = np.random.uniform(5, 25)  # Base 5-25 kg
    
    # Apply home type factor
    if user_context['home_type'] == 'apartment':
        base_emission *= EMISSION_FACTORS['apartment_energy']
    elif user_context['home_type'] == 'house':
        base_emission *= 1.2  # Houses use more energy
    
    # Apply renewable energy factor
    if user_context['renewable_energy']:
        base_emission *= EMISSION_FACTORS['renewable_energy']
    
    # Scale by household size
    household_factor = 1 + (user_context['household_size'] - 1) * 0.1
    base_emission *= household_factor
    
    # Apply seasonal factor
    season = user_context['season']
    if season == 'summer':
        base_emission *= EMISSION_FACTORS['summer_energy']
    elif season == 'winter':
        base_emission *= EMISSION_FACTORS['winter_energy']
    
    # Climate zone effects
    if user_context['climate_zone'] == 'hot':
        base_emission *= 1.2 if season == 'summer' else 1.0
    elif user_context['climate_zone'] == 'cold':
        base_emission *= 1.3 if season == 'winter' else 1.0
    
    # Add noise
    base_emission *= np.random.uniform(0.8, 1.2)
    
    return max(1, base_emission)

def determine_recommendation(user_context, transport_kg, diet_kg, energy_kg):
    """
    Determine the best recommendation based on emissions and user context.
    Returns a recommendation that is most relevant to the user's situation.
    """
    total_kg = transport_kg + diet_kg + energy_kg
    
    # Calculate percentages
    pct_transport = transport_kg / total_kg if total_kg > 0 else 0
    pct_diet = diet_kg / total_kg if total_kg > 0 else 0
    pct_energy = energy_kg / total_kg if total_kg > 0 else 0
    
    recommendations = []
    
    # Transport recommendations
    if pct_transport > 0.35:
        if user_context['location_type'] == 'urban':
            if user_context['vehicle_type'] in ['petrol', 'diesel']:
                recommendations.append("Switch_to_Public_Transit")
            elif user_context['vehicle_type'] == 'none':
                recommendations.append("Bike_Short_Trips")
            else:
                recommendations.append("Optimize_Route_Planning")
        elif user_context['location_type'] == 'rural':
            if user_context['vehicle_type'] in ['petrol', 'diesel']:
                recommendations.append("Consider_EV_or_Hybrid")
            else:
                recommendations.append("Carpool_More")
        else:  # suburban
            if transport_kg > 12:
                recommendations.append("Carpool_More")
            else:
                recommendations.append("Combine_Errands")
    
    # Diet recommendations
    if pct_diet > 0.30:
        if user_context['diet_preference'] == 'omnivore':
            if diet_kg > 8:
                recommendations.append("Meatless_Monday")
            else:
                recommendations.append("Reduce_Red_Meat")
        elif user_context['diet_preference'] == 'pescatarian':
            recommendations.append("Buy_Local_Produce")
        elif user_context['diet_preference'] in ['vegetarian', 'vegan']:
            recommendations.append("Reduce_Food_Waste")
        
        if user_context['meals_out_weekly'] > 3:
            recommendations.append("Cook_at_Home_More")
    
    # Energy recommendations
    if pct_energy > 0.35:
        if not user_context['renewable_energy']:
            if user_context['home_type'] == 'house':
                recommendations.append("Consider_Solar_Panels")
            else:
                recommendations.append("Switch_to_Green_Energy")
        
        if energy_kg > 15:
            if user_context['home_type'] == 'apartment':
                recommendations.append("Optimize_Thermostat")
            else:
                recommendations.append("Install_Smart_Thermostat")
        else:
            recommendations.append("Switch_to_LED_Bulbs")
        
        if user_context['season'] in ['summer', 'winter']:
            recommendations.append("Improve_Home_Insulation")
    
    # General recommendations if specific ones aren't triggered
    if not recommendations:
        if total_kg < 15:
            recommendations.append("Maintain_Good_Habits")
        elif total_kg < 25:
            recommendations.append("General_Reduction")
        else:
            recommendations.append("Comprehensive_Review")
    
    # Return the most relevant recommendation
    # Add some randomness to prevent overfitting
    if len(recommendations) > 1 and np.random.random() < 0.2:
        return np.random.choice(recommendations)
    
    return recommendations[0]

def generate_synthetic_data(n_samples=N_SAMPLES):
    """Generate enhanced synthetic training data"""
    np.random.seed(RANDOM_SEED)
    random.seed(RANDOM_SEED)
    
    print(f"Generating {n_samples} enhanced training samples...")
    
    data = []
    days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    climate_zones = ['temperate', 'tropical', 'cold', 'hot', 'mediterranean']
    
    for i in range(n_samples):
        if i % 1000 == 0:
            print(f"  Generated {i}/{n_samples} samples...")
        
        # Generate user context
        user_context = {
            'household_size': generate_household_size(),
            'location_type': weighted_choice(LOCATION_WEIGHTS),
            'vehicle_type': weighted_choice(VEHICLE_WEIGHTS),
            'diet_preference': weighted_choice(DIET_WEIGHTS),
            'home_type': weighted_choice(HOME_WEIGHTS),
            'renewable_energy': np.random.random() < 0.30,  # 30% have renewable
            'income_bracket': np.random.choice(['low', 'medium', 'high'], p=[0.25, 0.50, 0.25]),
            'commute_distance': np.random.exponential(15),  # Average 15km
            'meals_out_weekly': np.random.choice(range(0, 8), p=[0.1, 0.15, 0.25, 0.20, 0.15, 0.08, 0.05, 0.02]),
            'day_of_week': np.random.choice(days_of_week),
            'season': weighted_choice(SEASON_WEIGHTS),
            'climate_zone': np.random.choice(climate_zones, p=[0.35, 0.15, 0.20, 0.15, 0.15])
        }
        
        # Calculate emissions based on context
        transport_kg = calculate_transport_emissions(user_context)
        diet_kg = calculate_diet_emissions(user_context)
        energy_kg = calculate_energy_emissions(user_context)
        total_kg = transport_kg + diet_kg + energy_kg
        
        # Determine recommendation
        recommendation = determine_recommendation(user_context, transport_kg, diet_kg, energy_kg)
        
        # Create data record
        record = {
            # Emissions
            'transport_kg': round(transport_kg, 2),
            'diet_kg': round(diet_kg, 2),
            'energy_kg': round(energy_kg, 2),
            'total_kg': round(total_kg, 2),
            
            # User context
            'household_size': user_context['household_size'],
            'location_type': user_context['location_type'],
            'vehicle_type': user_context['vehicle_type'],
            'diet_preference': user_context['diet_preference'],
            'home_type': user_context['home_type'],
            'renewable_energy': user_context['renewable_energy'],
            'income_bracket': user_context['income_bracket'],
            'commute_distance': round(user_context['commute_distance'], 1),
            'meals_out_weekly': user_context['meals_out_weekly'],
            
            # Temporal features
            'day_of_week': user_context['day_of_week'],
            'season': user_context['season'],
            'climate_zone': user_context['climate_zone'],
            
            # Target
            'recommendation': recommendation
        }
        
        data.append(record)
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Save to CSV
    output_path = 'data/user_emissions_enhanced.csv'
    df.to_csv(output_path, index=False)
    
    print(f"\n✅ Generated {n_samples} samples in {output_path}")
    print(f"\n📊 Dataset Statistics:")
    print(f"   - Columns: {len(df.columns)}")
    print(f"   - Samples: {len(df)}")
    
    print(f"\n📈 Emissions Summary:")
    print(f"   - Transport: {df['transport_kg'].mean():.2f} ± {df['transport_kg'].std():.2f} kg")
    print(f"   - Diet: {df['diet_kg'].mean():.2f} ± {df['diet_kg'].std():.2f} kg")
    print(f"   - Energy: {df['energy_kg'].mean():.2f} ± {df['energy_kg'].std():.2f} kg")
    print(f"   - Total: {df['total_kg'].mean():.2f} ± {df['total_kg'].std():.2f} kg")
    
    print(f"\n🏠 User Context Distribution:")
    print(f"   Location: {df['location_type'].value_counts().to_dict()}")
    print(f"   Vehicle: {df['vehicle_type'].value_counts().to_dict()}")
    print(f"   Diet: {df['diet_preference'].value_counts().to_dict()}")
    print(f"   Home: {df['home_type'].value_counts().to_dict()}")
    print(f"   Renewable Energy: {df['renewable_energy'].sum()} ({df['renewable_energy'].mean()*100:.1f}%)")
    
    print(f"\n🎯 Recommendation Distribution:")
    rec_counts = df['recommendation'].value_counts()
    for rec, count in rec_counts.items():
        print(f"   {rec}: {count} ({count/len(df)*100:.1f}%)")
    
    print(f"\n📋 Sample Records:")
    print(df.head(5).to_string())
    
    return df

def validate_data(df):
    """Validate the generated data"""
    print("\n🔍 Validating Data...")
    
    issues = []
    
    # Check for missing values
    missing = df.isnull().sum()
    if missing.any():
        issues.append(f"Missing values found: {missing[missing > 0].to_dict()}")
    
    # Check emission ranges
    if (df['transport_kg'] < 0).any():
        issues.append("Negative transport emissions found")
    if (df['diet_kg'] < 0).any():
        issues.append("Negative diet emissions found")
    if (df['energy_kg'] < 0).any():
        issues.append("Negative energy emissions found")
    
    # Check categorical values
    valid_locations = ['urban', 'suburban', 'rural']
    if not df['location_type'].isin(valid_locations).all():
        issues.append("Invalid location types found")
    
    valid_vehicles = ['none', 'petrol', 'diesel', 'electric', 'hybrid']
    if not df['vehicle_type'].isin(valid_vehicles).all():
        issues.append("Invalid vehicle types found")
    
    valid_diets = ['vegan', 'vegetarian', 'pescatarian', 'omnivore']
    if not df['diet_preference'].isin(valid_diets).all():
        issues.append("Invalid diet preferences found")
    
    # Check class balance
    rec_counts = df['recommendation'].value_counts()
    min_count = rec_counts.min()
    max_count = rec_counts.max()
    if max_count / min_count > 10:
        issues.append(f"Class imbalance detected: {min_count} to {max_count}")
    
    if issues:
        print("⚠️ Validation Issues:")
        for issue in issues:
            print(f"   - {issue}")
    else:
        print("✅ All validation checks passed!")
    
    return len(issues) == 0

if __name__ == "__main__":
    print("=" * 60)
    print("  EcoWisely Enhanced Data Generation")
    print("=" * 60)
    
    df = generate_synthetic_data()
    validate_data(df)
    
    print("\n" + "=" * 60)
    print("  Data Generation Complete!")
    print("=" * 60)
