import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib
import os

# Ensure models directory exists
os.makedirs('models', exist_ok=True)

def train():
    # 1. Load Data
    print("Loading data...")
    try:
        df = pd.read_csv('data/user_emissions.csv')
    except FileNotFoundError:
        print("Data not found! Run generate_data.py first.")
        return

    # 2. Prepare Features (X) and Target (y)
    X = df[['transport_kg', 'diet_kg', 'energy_kg', 'total_kg']]
    y = df['recommendation']

    # 3. Split Data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 4. Train Model
    print("Training Random Forest Model...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # 5. Evaluate
    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    print(f"Model Accuracy: {accuracy * 100:.2f}%")

    # 6. Save Model
    joblib.dump(model, 'models/eco_recommender.joblib')
    print("Model saved to models/eco_recommender.joblib")

if __name__ == "__main__":
    train()