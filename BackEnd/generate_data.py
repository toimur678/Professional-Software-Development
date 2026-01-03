import pandas as pd
import numpy as np
import os

# Ensure data directory exists
os.makedirs('data', exist_ok=True)

def generate_synthetic_data(n_samples=1000):
    np.random.seed(42)
    
    data = []
    
    for _ in range(n_samples):
        # Generate random daily averages (kg CO2)
        transport = np.random.uniform(0, 15)  # 0 to 15 kg
        diet = np.random.uniform(2, 10)       # 2 to 10 kg
        energy = np.random.uniform(5, 20)     # 5 to 20 kg
        
        total = transport + diet + energy
        
        # Calculate percentages
        pct_transport = transport / total
        pct_diet = diet / total
        pct_energy = energy / total
        
        # Determine the "Correct" Recommendation (The Label)
        # Logic: Recommend action based on the highest impacting category
        recommendation = "General_Reduction"
        
        if pct_transport > 0.4: # If transport is > 40% of footprint
            if transport > 10:
                recommendation = "Carpool_More"
            else:
                recommendation = "Switch_to_Public_Transit"
                
        elif pct_diet > 0.4:
            if diet > 8:
                recommendation = "Meatless_Monday"
            else:
                recommendation = "Buy_Local_Produce"
                
        elif pct_energy > 0.4:
            if energy > 15:
                recommendation = "Install_Smart_Thermostat"
            else:
                recommendation = "Switch_to_LED_Bulbs"
        
        data.append({
            'transport_kg': transport,
            'diet_kg': diet,
            'energy_kg': energy,
            'total_kg': total,
            'recommendation': recommendation
        })
            
    df = pd.DataFrame(data)
    df.to_csv('data/user_emissions.csv', index=False)
    print(f"Generated {n_samples} samples in data/user_emissions.csv")
    print(df.head())

if __name__ == "__main__":
    generate_synthetic_data()