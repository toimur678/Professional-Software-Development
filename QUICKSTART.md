# 🚀 EcoWisely Quick Start

Get EcoWisely running in minutes with this quick start guide.

## Prerequisites

- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **API Keys** (see below)

## Required API Keys

Before starting, you'll need to obtain:

| Service | Purpose | Get Key |
|---------|---------|---------|
| Climatiq | Carbon calculations | [climatiq.io](https://www.climatiq.io/) |
| OpenWeatherMap | Weather data | [openweathermap.org](https://openweathermap.org/api) |
| Google Maps | Route emissions | [Google Cloud Console](https://console.cloud.google.com/) |
| Supabase | Database & Auth | [supabase.com](https://supabase.com/) |

---

## First Time Setup

### 1. Clone and Navigate

```bash
git clone https://github.com/toimur678/Professional-Software-Development.git
cd Professional-Software-Development
```

### 2. Configure Backend Environment

```bash
cd BackEnd

# Create environment file
cp .env.example .env

# Edit .env with your API keys
nano .env  # or use your preferred editor
```

Required variables in `BackEnd/.env`:
```env
CLIMATIQ_API_KEY=your_climatiq_api_key
OPENWEATHERMAP_API_KEY=your_openweather_api_key
GOOGLE_DIRECTIONS_API_KEY=your_google_maps_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
SECRET_KEY=your-secret-key-minimum-32-characters
```

### 3. Configure Frontend Environment

```bash
cd ../FrontEnd

# Create environment file
cp .env.example .env.local

# Edit .env.local with your values
nano .env.local  # or use your preferred editor
```

Required variables in `FrontEnd/.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Install Dependencies

```bash
# Backend (from project root)
cd BackEnd
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd ../FrontEnd
npm install
```

### 5. Generate Training Data & Train Model

```bash
cd ../BackEnd
source venv/bin/activate  # If not already activated
python generate_data.py
python train_model.py
```

### 6. Make Start Script Executable

```bash
cd ..
chmod +x start-ecowisely.sh
```

---

## Running the Application

### Option 1: One Command (Recommended) ⭐

```bash
# From project root
./start-ecowisely.sh
```

This will:
1. ✅ Run all pre-flight checks
2. ✅ Validate API connections
3. ✅ Start backend on port 8000
4. ✅ Start frontend on port 3000
5. ✅ Handle graceful shutdown with Ctrl+C

### Option 2: Using npm Scripts

```bash
# Check everything first
npm run preflight

# Start both services
npm start
```

### Option 3: Manual Start (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd BackEnd
source venv/bin/activate
python preflight_check.py
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd FrontEnd
node preflight-check.js
npm run dev
```

---

## Available URLs

| Service | URL |
|---------|-----|
| 📱 Frontend | http://localhost:3000 |
| 🔌 Backend API | http://localhost:8000 |
| 📚 API Documentation | http://localhost:8000/docs |
| ❤️ Health Check | http://localhost:8000/health |

---

## Pre-Flight Check Commands

| Command | Description |
|---------|-------------|
| `npm run preflight` | Run all checks |
| `npm run preflight:backend` | Backend checks only |
| `npm run preflight:frontend` | Frontend checks only |
| `npm run preflight:verbose` | Detailed output |
| `npm run preflight:skip-apis` | Skip API connectivity tests |

### Backend Check Options

```bash
cd BackEnd
python preflight_check.py --help

# Options:
python preflight_check.py              # Run all checks
python preflight_check.py --verbose    # Show detailed output
python preflight_check.py --skip-apis  # Skip API tests (offline dev)
python preflight_check.py --quick      # Skip optional checks
```

### Frontend Check Options

```bash
cd FrontEnd
node preflight-check.js --help

# Options:
node preflight-check.js               # Run all checks
node preflight-check.js --verbose     # Show detailed output
node preflight-check.js --skip-backend # Skip backend connectivity test
```

---

## Troubleshooting

### Pre-flight checks fail?

1. **Check .env files exist** and have correct values
2. **Verify API keys are valid** and not expired
3. **Ensure Supabase project is running** (not paused)
4. **Re-install dependencies:**
   ```bash
   # Backend
   cd BackEnd && pip install -r requirements.txt
   
   # Frontend
   cd FrontEnd && npm install
   ```

### Port already in use?

```bash
# Find and kill process on backend port
lsof -ti:8000 | xargs kill -9

# Find and kill process on frontend port
lsof -ti:3000 | xargs kill -9
```

### Import errors in Python?

```bash
# Make sure virtual environment is activated
cd BackEnd
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### Database connection fails?

1. Check `SUPABASE_URL` and `SUPABASE_KEY` in .env
2. Verify Supabase project is not paused (free tier pauses after inactivity)
3. Check internet connection
4. Verify database tables exist (run migrations)

### Model not found?

```bash
cd BackEnd
source venv/bin/activate
python generate_data.py   # Generate training data
python train_model.py     # Train the model
```

### Colorama not installed (no colors)?

```bash
pip install colorama
```

---

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both services with hot reload |
| `npm run dev:backend` | Start backend only with hot reload |
| `npm run dev:frontend` | Start frontend only with hot reload |
| `npm run test:all` | Run all tests |
| `npm run build:frontend` | Build frontend for production |
| `npm run train:model` | Retrain ML model |
| `npm run generate:data` | Generate new training data |

---

## Project Structure

```
Professional-Software-Development/
├── start-ecowisely.sh      # 🚀 Main launcher script
├── package.json            # 📦 Root npm scripts
├── QUICKSTART.md           # 📖 This file
│
├── BackEnd/
│   ├── preflight_check.py  # ✅ Backend validation
│   ├── main.py             # 🔌 FastAPI application
│   ├── .env                # 🔐 Backend secrets
│   ├── models/             # 🤖 ML models
│   └── data/               # 📊 Training data
│
└── FrontEnd/
    ├── preflight-check.js  # ✅ Frontend validation
    ├── .env.local          # 🔐 Frontend config
    └── src/                # ⚛️ Next.js application
```

---

## Next Steps

1. **Create account** at http://localhost:3000/register
2. **Complete onboarding** survey for personalized recommendations
3. **Start tracking** your daily activities
4. **View AI recommendations** to reduce your carbon footprint
5. **Join challenges** and compete on the leaderboard

---

## Need Help?

- 📖 Full documentation: [README.md](README.md)
- 🔧 API documentation: http://localhost:8000/docs
- 🐛 Report issues: [GitHub Issues](https://github.com/toimur678/Professional-Software-Development/issues)

---

*Happy carbon tracking! 🌱*
