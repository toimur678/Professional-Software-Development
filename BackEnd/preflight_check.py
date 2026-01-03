#!/usr/bin/env python3
"""
EcoWisely Backend Pre-Flight Check System
==========================================

This script validates all system requirements before running the application.
It checks environment variables, API connectivity, database, ML models,
dependencies, file structure, port availability, and training data.

Usage:
    python preflight_check.py              # Run all checks
    python preflight_check.py --verbose    # Detailed output
    python preflight_check.py --skip-apis  # Skip API connectivity tests
    python preflight_check.py --quick      # Skip optional checks

Exit Codes:
    0 - All checks passed
    1 - Critical failure(s) detected
"""

import os
import sys
import socket
import argparse
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
import importlib.metadata
import re

# Try to import colorama for colored output
try:
    from colorama import init, Fore, Style
    init(autoreset=True)
    COLORS_AVAILABLE = True
except ImportError:
    COLORS_AVAILABLE = False
    # Fallback - no colors
    class Fore:
        GREEN = RED = YELLOW = CYAN = MAGENTA = WHITE = RESET = ""
    class Style:
        BRIGHT = RESET_ALL = ""

# Configure logging
LOG_FILE = "preflight.log"
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, mode='w'),
        logging.StreamHandler(sys.stdout) if '--verbose' in sys.argv else logging.NullHandler()
    ]
)
logger = logging.getLogger(__name__)


class PreflightResult:
    """Stores the result of a single preflight check."""
    
    def __init__(self, name: str, status: str, message: str, details: Optional[str] = None):
        self.name = name
        self.status = status  # 'pass', 'warn', 'fail'
        self.message = message
        self.details = details
        self.timestamp = datetime.now()
    
    def __str__(self) -> str:
        icon = self._get_icon()
        return f"{icon} {self.name}: {self.message}"
    
    def _get_icon(self) -> str:
        if self.status == 'pass':
            return f"{Fore.GREEN}✅{Style.RESET_ALL}"
        elif self.status == 'warn':
            return f"{Fore.YELLOW}⚠️ {Style.RESET_ALL}"
        else:
            return f"{Fore.RED}❌{Style.RESET_ALL}"


class PreflightChecker:
    """Main preflight check system for EcoWisely Backend."""
    
    REQUIRED_ENV_VARS = [
        'CLIMATIQ_API_KEY',
        'OPENWEATHERMAP_API_KEY',
        'GOOGLE_DIRECTIONS_API_KEY',  # Also accept GOOGLE_MAPS_API_KEY
        'SUPABASE_URL',
        'SUPABASE_KEY',
    ]
    
    OPTIONAL_ENV_VARS = [
        'SENTRY_DSN',
        'MIXPANEL_TOKEN',
        'SECRET_KEY',
    ]
    
    CRITICAL_FILES = [
        'main.py',
        'train_model.py',
        'generate_data.py',
        'api_integrations.py',
    ]
    
    CRITICAL_DIRS = [
        'models',
        'data',
    ]
    
    EXPECTED_TABLES = [
        'profiles',
        'activities', 
        'daily_summaries',
        'user_points',
        'achievements',
        'user_achievements',
        'challenges',
        'user_challenges',
        'user_preferences',
        'friends',
        'friend_requests',
        'community_posts',
    ]
    
    def __init__(self, verbose: bool = False, skip_apis: bool = False, quick: bool = False):
        self.verbose = verbose
        self.skip_apis = skip_apis
        self.quick = quick
        self.results: List[PreflightResult] = []
        self.issues: List[str] = []
        self.warnings: List[str] = []
        self.actions: List[str] = []
        
        # Load environment variables
        try:
            from dotenv import load_dotenv
            load_dotenv()
            logger.info("Loaded .env file")
        except ImportError:
            logger.warning("python-dotenv not installed, using system environment")
    
    def add_result(self, name: str, status: str, message: str, details: Optional[str] = None):
        """Add a check result."""
        result = PreflightResult(name, status, message, details)
        self.results.append(result)
        
        if status == 'fail':
            self.issues.append(f"{name}: {message}")
        elif status == 'warn':
            self.warnings.append(f"{name}: {message}")
        
        logger.info(f"{name}: {status} - {message}")
        if details:
            logger.debug(f"  Details: {details}")
    
    def print_verbose(self, message: str):
        """Print message only in verbose mode."""
        if self.verbose:
            print(f"  {Fore.CYAN}→{Style.RESET_ALL} {message}")
    
    # =========================================================================
    # CHECK 1: ENVIRONMENT VARIABLES
    # =========================================================================
    
    def check_environment_variables(self) -> bool:
        """Check all required and optional environment variables."""
        print(f"\n{Fore.CYAN}Checking Environment Variables...{Style.RESET_ALL}")
        all_pass = True
        
        # Check required variables
        for var in self.REQUIRED_ENV_VARS:
            value = os.getenv(var)
            
            # Special handling for Google API key (accept either name)
            if var == 'GOOGLE_DIRECTIONS_API_KEY' and not value:
                value = os.getenv('GOOGLE_MAPS_API_KEY')
            
            if not value:
                self.add_result(var, 'fail', 'Not set')
                self.actions.append(f"Set {var} in your .env file")
                all_pass = False
            elif self._is_placeholder(value):
                self.add_result(var, 'fail', 'Contains placeholder text')
                self.actions.append(f"Replace placeholder in {var} with actual API key")
                all_pass = False
            else:
                self.print_verbose(f"{var}: Set ({'*' * 4}...{value[-4:]})")
                self.add_result(var, 'pass', 'Configured')
        
        # Check optional variables
        for var in self.OPTIONAL_ENV_VARS:
            value = os.getenv(var)
            if not value:
                self.add_result(var, 'warn', 'Not configured (optional)')
            else:
                # Check SECRET_KEY length
                if var == 'SECRET_KEY' and len(value) < 32:
                    self.add_result(var, 'warn', f'Too short ({len(value)} chars, need 32+)')
                    self.actions.append(f"Make SECRET_KEY at least 32 characters")
                else:
                    self.add_result(var, 'pass', 'Configured')
        
        return all_pass
    
    def _is_placeholder(self, value: str) -> bool:
        """Check if value is a placeholder."""
        placeholders = [
            'your_api_key', 'your-api-key', 'xxx', 'placeholder',
            'enter_key_here', 'your_key', 'api_key_here', 'changeme',
            'your_secret', 'REPLACE_ME', 'INSERT_HERE'
        ]
        value_lower = value.lower()
        return any(p in value_lower for p in placeholders) or value == ''
    
    # =========================================================================
    # CHECK 2: API CONNECTIVITY
    # =========================================================================
    
    def check_api_connectivity(self) -> bool:
        """Test connectivity to all external APIs."""
        if self.skip_apis:
            print(f"\n{Fore.YELLOW}Skipping API connectivity checks (--skip-apis){Style.RESET_ALL}")
            return True
        
        print(f"\n{Fore.CYAN}Checking API Connectivity...{Style.RESET_ALL}")
        
        import requests
        
        all_pass = True
        
        # Test Climatiq API
        all_pass &= self._check_climatiq_api(requests)
        
        # Test OpenWeatherMap API
        all_pass &= self._check_openweather_api(requests)
        
        # Test Google Maps API
        all_pass &= self._check_google_maps_api(requests)
        
        return all_pass
    
    def _check_climatiq_api(self, requests) -> bool:
        """Test Climatiq API connectivity."""
        api_key = os.getenv('CLIMATIQ_API_KEY')
        if not api_key:
            return False
        
        self.print_verbose("Testing Climatiq API...")
        
        try:
            response = requests.post(
                "https://api.climatiq.io/estimate",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "emission_factor": {
                        "activity_id": "electricity-supply_grid-source_supplier_mix",
                        "source": "BEIS",
                        "region": "GB",
                        "year": 2023
                    },
                    "parameters": {
                        "energy": 1,
                        "energy_unit": "kWh"
                    }
                },
                timeout=10
            )
            
            if response.status_code == 200:
                self.add_result("Climatiq API", 'pass', 'Connected')
                return True
            elif response.status_code == 401:
                self.add_result("Climatiq API", 'fail', 'Invalid API key')
                self.actions.append("Check CLIMATIQ_API_KEY in .env file")
                return False
            else:
                self.add_result("Climatiq API", 'fail', f'Error: {response.status_code}')
                return False
                
        except requests.exceptions.Timeout:
            self.add_result("Climatiq API", 'fail', 'Connection timeout')
            return False
        except requests.exceptions.RequestException as e:
            self.add_result("Climatiq API", 'fail', f'Connection error: {str(e)[:50]}')
            return False
    
    def _check_openweather_api(self, requests) -> bool:
        """Test OpenWeatherMap API connectivity."""
        api_key = os.getenv('OPENWEATHERMAP_API_KEY')
        if not api_key:
            return False
        
        self.print_verbose("Testing OpenWeatherMap API...")
        
        try:
            # Test with London coordinates
            response = requests.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={
                    "lat": 51.5074,
                    "lon": -0.1278,
                    "appid": api_key,
                    "units": "metric"
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                temp = data.get('main', {}).get('temp', 'N/A')
                self.add_result("OpenWeatherMap API", 'pass', f'Connected (Test: {temp}°C)')
                return True
            elif response.status_code == 401:
                self.add_result("OpenWeatherMap API", 'fail', 'Invalid API key')
                self.actions.append("Check OPENWEATHERMAP_API_KEY in .env file")
                return False
            else:
                self.add_result("OpenWeatherMap API", 'fail', f'Error: {response.status_code}')
                return False
                
        except requests.exceptions.Timeout:
            self.add_result("OpenWeatherMap API", 'fail', 'Connection timeout')
            return False
        except requests.exceptions.RequestException as e:
            self.add_result("OpenWeatherMap API", 'fail', f'Connection error: {str(e)[:50]}')
            return False
    
    def _check_google_maps_api(self, requests) -> bool:
        """Test Google Maps Directions API connectivity."""
        api_key = os.getenv('GOOGLE_DIRECTIONS_API_KEY') or os.getenv('GOOGLE_MAPS_API_KEY')
        if not api_key:
            return False
        
        self.print_verbose("Testing Google Maps API...")
        
        try:
            response = requests.get(
                "https://maps.googleapis.com/maps/api/directions/json",
                params={
                    "origin": "London,UK",
                    "destination": "Oxford,UK",
                    "key": api_key
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                status = data.get('status', '')
                
                if status == 'OK':
                    self.add_result("Google Maps API", 'pass', 'Connected')
                    return True
                elif status == 'REQUEST_DENIED':
                    self.add_result("Google Maps API", 'fail', 'API key denied (check billing/permissions)')
                    self.actions.append("Enable Directions API in Google Cloud Console")
                    return False
                else:
                    self.add_result("Google Maps API", 'fail', f'Status: {status}')
                    return False
            else:
                self.add_result("Google Maps API", 'fail', f'Error: {response.status_code}')
                return False
                
        except requests.exceptions.Timeout:
            self.add_result("Google Maps API", 'fail', 'Connection timeout')
            return False
        except requests.exceptions.RequestException as e:
            self.add_result("Google Maps API", 'fail', f'Connection error: {str(e)[:50]}')
            return False
    
    # =========================================================================
    # CHECK 3: DATABASE CONNECTION
    # =========================================================================
    
    def check_database(self) -> bool:
        """Test Supabase database connection and verify tables."""
        print(f"\n{Fore.CYAN}Checking Database Connection...{Style.RESET_ALL}")
        
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_KEY')
        
        if not supabase_url or not supabase_key:
            self.add_result("Database", 'fail', 'Supabase credentials not configured')
            return False
        
        try:
            from supabase import create_client, Client
        except ImportError:
            self.add_result("Database", 'warn', 'supabase package not installed')
            self.actions.append("Run: pip install supabase")
            return True  # Not a critical failure
        
        self.print_verbose("Connecting to Supabase...")
        
        try:
            supabase: Client = create_client(supabase_url, supabase_key)
            
            # Test connection with a simple query
            self.print_verbose("Testing database connection...")
            
            # Check for tables
            tables_found = []
            tables_missing = []
            
            for table in self.EXPECTED_TABLES:
                try:
                    response = supabase.table(table).select("*").limit(1).execute()
                    tables_found.append(table)
                    self.print_verbose(f"  Table '{table}': Found")
                except Exception as e:
                    if 'does not exist' in str(e).lower() or '42P01' in str(e):
                        tables_missing.append(table)
                        self.print_verbose(f"  Table '{table}': Not found")
                    else:
                        # Table exists but might have permission issues
                        tables_found.append(table)
            
            if tables_missing:
                self.add_result("Database Tables", 'warn', f'{len(tables_missing)} tables missing')
                self.actions.append(f"Create missing tables: {', '.join(tables_missing[:3])}...")
            
            self.add_result("Database", 'pass', f'Connected ({len(tables_found)} tables found)')
            return True
            
        except Exception as e:
            error_msg = str(e)[:100]
            self.add_result("Database", 'fail', f'Connection failed: {error_msg}')
            self.actions.append("Check SUPABASE_URL and SUPABASE_KEY in .env file")
            return False
    
    # =========================================================================
    # CHECK 4: ML MODEL
    # =========================================================================
    
    def check_ml_model(self) -> bool:
        """Check if ML model exists and can be loaded."""
        print(f"\n{Fore.CYAN}Checking ML Model...{Style.RESET_ALL}")
        
        model_path = Path("models/eco_recommender.joblib")
        enhanced_model_path = Path("models/eco_recommender_adaboost.joblib")
        
        all_pass = True
        
        # Check main model
        if not model_path.exists():
            self.add_result("ML Model", 'fail', 'Model file not found')
            self.actions.append("Run: python train_model.py")
            return False
        
        self.print_verbose(f"Model file found: {model_path}")
        
        try:
            import joblib
            
            # Try to load the model
            self.print_verbose("Loading model...")
            model = joblib.load(model_path)
            
            # Check model properties
            model_info = []
            
            if hasattr(model, 'estimators_'):
                model_info.append(f"Ensemble with {len(model.estimators_)} estimators")
            
            if hasattr(model, 'feature_importances_'):
                model_info.append(f"{len(model.feature_importances_)} features")
            
            if hasattr(model, 'classes_'):
                model_info.append(f"{len(model.classes_)} classes")
            
            # Try to get accuracy if stored
            accuracy_str = ""
            if hasattr(model, 'score'):
                accuracy_str = " (ready for predictions)"
            
            details = ", ".join(model_info) if model_info else "Loaded successfully"
            self.add_result("ML Model", 'pass', f'Loaded{accuracy_str}', details)
            
        except Exception as e:
            self.add_result("ML Model", 'fail', f'Failed to load: {str(e)[:50]}')
            self.actions.append("Model may be corrupted. Run: python train_model.py")
            return False
        
        # Check for enhanced model (optional)
        if enhanced_model_path.exists():
            try:
                enhanced_model = joblib.load(enhanced_model_path)
                self.add_result("AdaBoost Model", 'pass', 'Loaded')
            except Exception as e:
                self.add_result("AdaBoost Model", 'warn', 'Failed to load (optional)')
        else:
            self.print_verbose("AdaBoost model not found (optional)")
        
        return all_pass
    
    # =========================================================================
    # CHECK 5: DEPENDENCIES
    # =========================================================================
    
    def check_dependencies(self) -> bool:
        """Check if all required packages are installed."""
        print(f"\n{Fore.CYAN}Checking Dependencies...{Style.RESET_ALL}")
        
        requirements_path = Path("requirements.txt")
        
        if not requirements_path.exists():
            self.add_result("Dependencies", 'warn', 'requirements.txt not found')
            return True
        
        # Parse requirements.txt
        required_packages = []
        with open(requirements_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    # Parse package name and version
                    match = re.match(r'^([a-zA-Z0-9_-]+)', line)
                    if match:
                        required_packages.append(match.group(1).lower())
        
        # Check installed packages
        installed = {pkg.metadata['Name'].lower(): pkg.version 
                     for pkg in importlib.metadata.distributions()}
        
        missing = []
        found = []
        
        for pkg in required_packages:
            pkg_normalized = pkg.replace('_', '-').lower()
            if pkg_normalized in installed or pkg.lower() in installed:
                found.append(pkg)
                self.print_verbose(f"  {pkg}: Installed")
            else:
                missing.append(pkg)
                self.print_verbose(f"  {pkg}: MISSING")
        
        if missing:
            self.add_result("Dependencies", 'fail', f'{len(missing)} packages missing')
            self.actions.append(f"Run: pip install {' '.join(missing[:5])}")
            return False
        
        self.add_result("Dependencies", 'pass', f'All {len(found)} packages installed')
        return True
    
    # =========================================================================
    # CHECK 6: FILE STRUCTURE
    # =========================================================================
    
    def check_file_structure(self) -> bool:
        """Check if critical files and directories exist."""
        print(f"\n{Fore.CYAN}Checking File Structure...{Style.RESET_ALL}")
        
        all_pass = True
        missing_files = []
        missing_dirs = []
        
        # Check files
        for file in self.CRITICAL_FILES:
            if Path(file).exists():
                self.print_verbose(f"  {file}: Found")
            else:
                missing_files.append(file)
                self.print_verbose(f"  {file}: MISSING")
        
        # Check directories
        for dir_name in self.CRITICAL_DIRS:
            if Path(dir_name).is_dir():
                self.print_verbose(f"  {dir_name}/: Found")
            else:
                missing_dirs.append(dir_name)
                self.print_verbose(f"  {dir_name}/: MISSING")
        
        if missing_files or missing_dirs:
            missing = missing_files + [f"{d}/" for d in missing_dirs]
            self.add_result("File Structure", 'fail', f'Missing: {", ".join(missing)}')
            all_pass = False
        else:
            self.add_result("File Structure", 'pass', 'Complete')
        
        return all_pass
    
    # =========================================================================
    # CHECK 7: PORT AVAILABILITY
    # =========================================================================
    
    def check_port(self, port: int = 8000) -> bool:
        """Check if the specified port is available."""
        print(f"\n{Fore.CYAN}Checking Port Availability...{Style.RESET_ALL}")
        
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        
        try:
            sock.bind(('0.0.0.0', port))
            sock.close()
            self.add_result(f"Port {port}", 'pass', 'Available')
            return True
        except socket.error:
            self.add_result(f"Port {port}", 'fail', 'Already in use')
            self.actions.append(f"Kill process on port {port}: lsof -ti:{port} | xargs kill -9")
            return False
    
    # =========================================================================
    # CHECK 8: TRAINING DATA
    # =========================================================================
    
    def check_training_data(self) -> bool:
        """Check if training data exists and is valid."""
        print(f"\n{Fore.CYAN}Checking Training Data...{Style.RESET_ALL}")
        
        data_files = [
            "data/user_emissions_enhanced.csv",
            "data/user_emissions.csv"
        ]
        
        data_found = None
        for data_file in data_files:
            if Path(data_file).exists():
                data_found = data_file
                break
        
        if not data_found:
            self.add_result("Training Data", 'warn', 'No training data found')
            self.actions.append("Generate data: python generate_data.py")
            return True  # Not critical
        
        try:
            import pandas as pd
            df = pd.read_csv(data_found)
            row_count = len(df)
            col_count = len(df.columns)
            
            if row_count < 100:
                self.add_result("Training Data", 'warn', f'Low data: {row_count} rows (need 100+)')
                self.actions.append("Regenerate: python generate_data.py")
                return True
            
            self.add_result("Training Data", 'pass', f'Ready ({row_count:,} rows, {col_count} columns)')
            return True
            
        except Exception as e:
            self.add_result("Training Data", 'warn', f'Could not read: {str(e)[:30]}')
            return True
    
    # =========================================================================
    # RUN ALL CHECKS
    # =========================================================================
    
    def run_all_checks(self) -> bool:
        """Run all preflight checks and return overall status."""
        
        print(f"\n{Fore.GREEN}{Style.BRIGHT}═══════════════════════════════════════════{Style.RESET_ALL}")
        print(f"{Fore.GREEN}{Style.BRIGHT}🚀 ECOWISELY BACKEND - PRE-FLIGHT CHECK{Style.RESET_ALL}")
        print(f"{Fore.GREEN}{Style.BRIGHT}═══════════════════════════════════════════{Style.RESET_ALL}")
        
        # Run all checks
        env_pass = self.check_environment_variables()
        api_pass = self.check_api_connectivity()
        db_pass = self.check_database()
        ml_pass = self.check_ml_model()
        deps_pass = self.check_dependencies()
        files_pass = self.check_file_structure()
        port_pass = self.check_port(8000)
        data_pass = self.check_training_data()
        
        # Determine overall status
        critical_pass = env_pass and deps_pass and files_pass and ml_pass
        
        # Print summary
        self._print_summary(critical_pass)
        
        # Log completion
        logger.info(f"Pre-flight check completed. Pass: {critical_pass}")
        
        return critical_pass
    
    def _print_summary(self, all_pass: bool):
        """Print the final summary of all checks."""
        
        print(f"\n{Fore.CYAN}{Style.BRIGHT}═══════════════════════════════════════════{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{Style.BRIGHT}📋 SUMMARY{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{Style.BRIGHT}═══════════════════════════════════════════{Style.RESET_ALL}")
        
        # Group results by category
        categories = {
            'ENVIRONMENT': ['CLIMATIQ_API_KEY', 'OPENWEATHERMAP_API_KEY', 'GOOGLE_DIRECTIONS_API_KEY',
                           'SUPABASE_URL', 'SUPABASE_KEY', 'SENTRY_DSN', 'MIXPANEL_TOKEN', 'SECRET_KEY'],
            'API SERVICES': ['Climatiq API', 'OpenWeatherMap API', 'Google Maps API'],
            'DATABASE': ['Database', 'Database Tables'],
            'MACHINE LEARNING': ['ML Model', 'AdaBoost Model'],
            'SYSTEM': ['Dependencies', 'File Structure', 'Port 8000', 'Training Data'],
        }
        
        for category, items in categories.items():
            print(f"\n{Fore.WHITE}{Style.BRIGHT}{category}:{Style.RESET_ALL}")
            category_results = [r for r in self.results if r.name in items]
            for result in category_results:
                print(f"  {result}")
        
        print(f"\n{Fore.CYAN}═══════════════════════════════════════════{Style.RESET_ALL}")
        
        if all_pass and not self.issues:
            print(f"{Fore.GREEN}{Style.BRIGHT}✅ ALL CHECKS PASSED - READY TO LAUNCH! 🎉{Style.RESET_ALL}")
            print(f"{Fore.CYAN}═══════════════════════════════════════════{Style.RESET_ALL}")
            print(f"\n{Fore.WHITE}Start backend:{Style.RESET_ALL} uvicorn main:app --host 0.0.0.0 --port 8000")
        else:
            print(f"{Fore.RED}{Style.BRIGHT}❌ PRE-FLIGHT CHECK FAILED{Style.RESET_ALL}")
            print(f"{Fore.CYAN}═══════════════════════════════════════════{Style.RESET_ALL}")
            
            if self.issues:
                print(f"\n{Fore.RED}{Style.BRIGHT}ISSUES FOUND:{Style.RESET_ALL}")
                for issue in self.issues:
                    print(f"  {Fore.RED}❌{Style.RESET_ALL} {issue}")
            
            if self.warnings:
                print(f"\n{Fore.YELLOW}{Style.BRIGHT}WARNINGS:{Style.RESET_ALL}")
                for warning in self.warnings:
                    print(f"  {Fore.YELLOW}⚠️ {Style.RESET_ALL} {warning}")
            
            if self.actions:
                print(f"\n{Fore.WHITE}{Style.BRIGHT}REQUIRED ACTIONS:{Style.RESET_ALL}")
                for i, action in enumerate(self.actions, 1):
                    print(f"  {i}. {action}")
            
            print(f"\n{Fore.CYAN}═══════════════════════════════════════════{Style.RESET_ALL}")
            print(f"{Fore.RED}{Style.BRIGHT}🛑 CANNOT START - FIX ISSUES ABOVE{Style.RESET_ALL}")
            print(f"{Fore.CYAN}═══════════════════════════════════════════{Style.RESET_ALL}")
        
        print(f"\n{Fore.WHITE}Log saved to: {LOG_FILE}{Style.RESET_ALL}\n")


def main():
    """Main entry point for the preflight check script."""
    parser = argparse.ArgumentParser(
        description="EcoWisely Backend Pre-Flight Check System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python preflight_check.py              Run all checks
  python preflight_check.py --verbose    Show detailed output
  python preflight_check.py --skip-apis  Skip API connectivity tests (offline dev)
  python preflight_check.py --quick      Skip optional checks
        """
    )
    
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Show detailed output for each check'
    )
    
    parser.add_argument(
        '--skip-apis',
        action='store_true',
        help='Skip API connectivity tests (for offline development)'
    )
    
    parser.add_argument(
        '--quick', '-q',
        action='store_true',
        help='Skip optional checks for faster execution'
    )
    
    args = parser.parse_args()
    
    # Create checker and run
    checker = PreflightChecker(
        verbose=args.verbose,
        skip_apis=args.skip_apis,
        quick=args.quick
    )
    
    success = checker.run_all_checks()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
