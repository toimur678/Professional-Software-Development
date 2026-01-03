#!/usr/bin/env python3
"""
Enhanced Model Training Script
Trains AdaBoost and Random Forest models with feature importance analysis,
cross-validation, and comprehensive evaluation metrics.
"""

import pandas as pd
import numpy as np
import os
import json
import joblib
from datetime import datetime
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier, AdaBoostClassifier, GradientBoostingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix,
    precision_recall_fscore_support, roc_auc_score
)
import warnings
warnings.filterwarnings('ignore')

# Configuration
RANDOM_SEED = 42
TEST_SIZE = 0.2
CV_FOLDS = 5
MODELS_DIR = 'models'

# Ensure models directory exists
os.makedirs(MODELS_DIR, exist_ok=True)

def load_data():
    """Load the enhanced training data"""
    data_path = 'data/user_emissions_enhanced.csv'
    
    if not os.path.exists(data_path):
        print("⚠️ Enhanced data not found. Falling back to basic data...")
        data_path = 'data/user_emissions.csv'
    
    df = pd.read_csv(data_path)
    print(f"✅ Loaded {len(df)} samples from {data_path}")
    print(f"   Columns: {list(df.columns)}")
    return df

def prepare_features(df):
    """Prepare features for training with encoding and scaling"""
    print("\n🔧 Preparing Features...")
    
    # Create a copy
    data = df.copy()
    
    # Store encoders and scaler for inference
    encoders = {}
    
    # Identify categorical columns
    categorical_cols = [
        'location_type', 'vehicle_type', 'diet_preference',
        'home_type', 'income_bracket', 'day_of_week',
        'season', 'climate_zone'
    ]
    
    # Filter to only existing columns
    categorical_cols = [col for col in categorical_cols if col in data.columns]
    
    # Encode categorical variables
    for col in categorical_cols:
        le = LabelEncoder()
        data[f'{col}_encoded'] = le.fit_transform(data[col])
        encoders[col] = le
        print(f"   Encoded {col}: {list(le.classes_)}")
    
    # Encode boolean columns
    if 'renewable_energy' in data.columns:
        data['renewable_energy_encoded'] = data['renewable_energy'].astype(int)
    
    # Encode target variable
    target_encoder = LabelEncoder()
    data['recommendation_encoded'] = target_encoder.fit_transform(data['recommendation'])
    encoders['recommendation'] = target_encoder
    print(f"   Target classes: {len(target_encoder.classes_)} unique recommendations")
    
    # Select feature columns
    feature_cols = ['transport_kg', 'diet_kg', 'energy_kg', 'total_kg']
    
    # Add encoded categorical features if they exist
    for col in categorical_cols:
        feature_cols.append(f'{col}_encoded')
    
    # Add numeric features if they exist
    numeric_cols = ['household_size', 'commute_distance', 'meals_out_weekly']
    for col in numeric_cols:
        if col in data.columns:
            feature_cols.append(col)
    
    if 'renewable_energy_encoded' in data.columns:
        feature_cols.append('renewable_energy_encoded')
    
    print(f"   Feature columns: {feature_cols}")
    
    # Create feature matrix and target
    X = data[feature_cols].values
    y = data['recommendation_encoded'].values
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    print(f"   Feature matrix shape: {X.shape}")
    print(f"   Target shape: {y.shape}")
    
    return X_scaled, y, feature_cols, encoders, scaler

def train_random_forest(X_train, y_train, X_test, y_test):
    """Train Random Forest classifier"""
    print("\n🌲 Training Random Forest...")
    
    rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        max_features='sqrt',
        class_weight='balanced',
        random_state=RANDOM_SEED,
        n_jobs=-1
    )
    
    rf.fit(X_train, y_train)
    
    # Evaluate
    y_pred = rf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    # Cross-validation
    cv_scores = cross_val_score(rf, X_train, y_train, cv=CV_FOLDS, scoring='accuracy')
    
    print(f"   Test Accuracy: {accuracy:.4f}")
    print(f"   CV Accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    
    return rf, accuracy, cv_scores

def train_adaboost(X_train, y_train, X_test, y_test):
    """Train AdaBoost classifier"""
    print("\n🚀 Training AdaBoost...")
    
    # Use Decision Tree as base estimator
    base_estimator = DecisionTreeClassifier(
        max_depth=5,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=RANDOM_SEED
    )
    
    ada = AdaBoostClassifier(
        estimator=base_estimator,
        n_estimators=100,
        learning_rate=0.5,
        algorithm='SAMME',
        random_state=RANDOM_SEED
    )
    
    ada.fit(X_train, y_train)
    
    # Evaluate
    y_pred = ada.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    # Cross-validation
    cv_scores = cross_val_score(ada, X_train, y_train, cv=CV_FOLDS, scoring='accuracy')
    
    print(f"   Test Accuracy: {accuracy:.4f}")
    print(f"   CV Accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    
    return ada, accuracy, cv_scores

def train_gradient_boosting(X_train, y_train, X_test, y_test):
    """Train Gradient Boosting classifier"""
    print("\n📈 Training Gradient Boosting...")
    
    gb = GradientBoostingClassifier(
        n_estimators=150,
        max_depth=6,
        min_samples_split=5,
        min_samples_leaf=2,
        learning_rate=0.1,
        max_features='sqrt',
        random_state=RANDOM_SEED
    )
    
    gb.fit(X_train, y_train)
    
    # Evaluate
    y_pred = gb.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    # Cross-validation
    cv_scores = cross_val_score(gb, X_train, y_train, cv=CV_FOLDS, scoring='accuracy')
    
    print(f"   Test Accuracy: {accuracy:.4f}")
    print(f"   CV Accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    
    return gb, accuracy, cv_scores

def analyze_feature_importance(model, feature_cols, model_name):
    """Analyze and display feature importance"""
    print(f"\n📊 Feature Importance ({model_name}):")
    
    importance = model.feature_importances_
    importance_df = pd.DataFrame({
        'feature': feature_cols,
        'importance': importance
    }).sort_values('importance', ascending=False)
    
    for idx, row in importance_df.iterrows():
        bar = '█' * int(row['importance'] * 50)
        print(f"   {row['feature']:30s} {row['importance']:.4f} {bar}")
    
    return importance_df

def generate_classification_report(y_test, y_pred, target_encoder, model_name):
    """Generate detailed classification report"""
    print(f"\n📋 Classification Report ({model_name}):")
    
    # Get class names
    class_names = target_encoder.classes_
    
    report = classification_report(y_test, y_pred, target_names=class_names, output_dict=True)
    
    # Print summary metrics
    print(f"   Macro F1: {report['macro avg']['f1-score']:.4f}")
    print(f"   Weighted F1: {report['weighted avg']['f1-score']:.4f}")
    
    # Print per-class metrics
    print("\n   Per-Class Performance:")
    for class_name in class_names:
        if class_name in report:
            metrics = report[class_name]
            print(f"   {class_name:30s} P:{metrics['precision']:.2f} R:{metrics['recall']:.2f} F1:{metrics['f1-score']:.2f}")
    
    return report

def save_models(models, encoders, scaler, feature_cols, metrics):
    """Save all models and metadata"""
    print("\n💾 Saving Models...")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save each model
    for name, model in models.items():
        model_path = f"{MODELS_DIR}/{name}_model.joblib"
        joblib.dump(model, model_path)
        print(f"   Saved {name} to {model_path}")
    
    # Save the best model as primary
    best_model_name = max(metrics.items(), key=lambda x: x[1]['test_accuracy'])[0]
    best_model = models[best_model_name]
    joblib.dump(best_model, f"{MODELS_DIR}/eco_recommender.joblib")
    print(f"   Primary model: {best_model_name}")
    
    # Save encoders and scaler
    preprocessing = {
        'encoders': encoders,
        'scaler': scaler,
        'feature_cols': feature_cols
    }
    joblib.dump(preprocessing, f"{MODELS_DIR}/preprocessing.joblib")
    print(f"   Saved preprocessing pipeline")
    
    # Save metrics
    metrics_data = {
        'timestamp': timestamp,
        'best_model': best_model_name,
        'models': {}
    }
    
    for name, m in metrics.items():
        metrics_data['models'][name] = {
            'test_accuracy': float(m['test_accuracy']),
            'cv_mean': float(m['cv_scores'].mean()),
            'cv_std': float(m['cv_scores'].std())
        }
    
    with open(f"{MODELS_DIR}/training_metrics.json", 'w') as f:
        json.dump(metrics_data, f, indent=2)
    print(f"   Saved training metrics")
    
    return best_model_name

def main():
    """Main training pipeline"""
    print("=" * 70)
    print("  EcoWisely Enhanced Model Training")
    print("=" * 70)
    
    # Load data
    df = load_data()
    
    # Prepare features
    X, y, feature_cols, encoders, scaler = prepare_features(df)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_SEED, stratify=y
    )
    
    print(f"\n📂 Data Split:")
    print(f"   Training: {len(X_train)} samples")
    print(f"   Testing: {len(X_test)} samples")
    
    # Train models
    models = {}
    metrics = {}
    
    # Random Forest
    rf, rf_acc, rf_cv = train_random_forest(X_train, y_train, X_test, y_test)
    models['random_forest'] = rf
    metrics['random_forest'] = {'test_accuracy': rf_acc, 'cv_scores': rf_cv}
    
    # AdaBoost
    ada, ada_acc, ada_cv = train_adaboost(X_train, y_train, X_test, y_test)
    models['adaboost'] = ada
    metrics['adaboost'] = {'test_accuracy': ada_acc, 'cv_scores': ada_cv}
    
    # Gradient Boosting
    gb, gb_acc, gb_cv = train_gradient_boosting(X_train, y_train, X_test, y_test)
    models['gradient_boosting'] = gb
    metrics['gradient_boosting'] = {'test_accuracy': gb_acc, 'cv_scores': gb_cv}
    
    # Model Comparison
    print("\n" + "=" * 70)
    print("  Model Comparison")
    print("=" * 70)
    
    comparison_data = []
    for name, m in metrics.items():
        comparison_data.append({
            'Model': name,
            'Test Accuracy': f"{m['test_accuracy']:.4f}",
            'CV Mean': f"{m['cv_scores'].mean():.4f}",
            'CV Std': f"±{m['cv_scores'].std():.4f}"
        })
    
    comparison_df = pd.DataFrame(comparison_data)
    print(comparison_df.to_string(index=False))
    
    # Feature importance analysis (for best model)
    best_model_name = max(metrics.items(), key=lambda x: x[1]['test_accuracy'])[0]
    best_model = models[best_model_name]
    
    importance_df = analyze_feature_importance(best_model, feature_cols, best_model_name)
    
    # Classification report for best model
    y_pred = best_model.predict(X_test)
    target_encoder = encoders['recommendation']
    report = generate_classification_report(y_test, y_pred, target_encoder, best_model_name)
    
    # Save everything
    save_models(models, encoders, scaler, feature_cols, metrics)
    
    # Save feature importance
    importance_df.to_csv(f"{MODELS_DIR}/feature_importance.csv", index=False)
    
    print("\n" + "=" * 70)
    print("  Training Complete!")
    print("=" * 70)
    print(f"\n🏆 Best Model: {best_model_name}")
    print(f"   Test Accuracy: {metrics[best_model_name]['test_accuracy']:.4f}")
    print(f"   CV Accuracy: {metrics[best_model_name]['cv_scores'].mean():.4f}")
    
    print("\n📁 Saved Files:")
    print(f"   - {MODELS_DIR}/eco_recommender.joblib (primary model)")
    print(f"   - {MODELS_DIR}/random_forest_model.joblib")
    print(f"   - {MODELS_DIR}/adaboost_model.joblib")
    print(f"   - {MODELS_DIR}/gradient_boosting_model.joblib")
    print(f"   - {MODELS_DIR}/preprocessing.joblib")
    print(f"   - {MODELS_DIR}/training_metrics.json")
    print(f"   - {MODELS_DIR}/feature_importance.csv")

if __name__ == "__main__":
    main()
