# 🌿 EcoWisely - Carbon Footprint Tracker

A full-stack application for tracking and reducing your carbon footprint with AI-powered recommendations.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)

## 📋 Overview

EcoWisely helps users track their carbon emissions across three main categories:
- 🚗 **Transport** - Track emissions from vehicles, public transit, and flights
- 🍽️ **Diet** - Monitor food-related carbon footprint
- ⚡ **Energy** - Measure home energy consumption

The app provides personalized AI-powered recommendations to help reduce your environmental impact.

## 🏗️ Project Structure

```
Professional-Software-Development/
├── BackEnd/                 # Python FastAPI ML Service
│   ├── main.py             # FastAPI application
│   ├── train_model.py      # ML model training script
│   ├── generate_data.py    # Sample data generation
│   ├── requirements.txt    # Python dependencies
│   ├── start.sh           # Mac M4 optimized startup script
│   ├── Makefile           # Build automation
│   ├── data/              # Training data
│   └── models/            # Trained ML models
│
└── FrontEnd/               # Next.js 14 Application
    ├── src/
    │   ├── app/           # App Router pages
    │   │   ├── (auth)/    # Authentication pages
    │   │   └── (dashboard)/ # Dashboard pages
    │   ├── components/    # React components
    │   └── lib/           # Utilities & helpers
    └── public/            # Static assets
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **pip** (Python package manager)

### 1. Clone the Repository

```bash
git clone https://github.com/toimur678/Professional-Software-Development.git
cd Professional-Software-Development
```

### 2. Set Up the Backend

```bash
cd BackEnd

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Generate sample data and train the model
python generate_data.py
python train_model.py
```

### 3. Set Up the Frontend

```bash
cd FrontEnd

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### 4. Run the Application

**Start the Backend (Terminal 1):**
```bash
cd BackEnd

# Mac M4 / Apple Silicon optimized (recommended):
./start.sh
# or
make run

# Alternative with auto-reload (higher CPU usage):
make run-dev
```

**Start the Frontend (Terminal 2):**
```bash
cd FrontEnd
npm run dev
```

### 5. Open the Application

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000](http://localhost:8000)
- **API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)

## 🖥️ Mac M4 / Apple Silicon Optimization

The backend is optimized for Mac M4 to prevent overheating:

| Command | Description | CPU Usage |
|---------|-------------|-----------|
| `./start.sh` or `make run` | Production mode (no file watching) | 🟢 Low |
| `make run-dev` | Development mode with auto-reload | 🔴 High |

> ⚠️ **Tip:** Only use `--reload` when actively editing backend code. The file watcher monitors thousands of files and causes high CPU usage.

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check - service status |
| `GET` | `/health` | Detailed health check with model status |
| `POST` | `/predict` | Get AI recommendation based on emissions |

### Example Request

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"transport_kg": 12, "diet_kg": 2, "energy_kg": 3}'
```

### Example Response

```json
{
  "recommended_action": "Carpool_More",
  "input_stats": {
    "transport_kg": 12,
    "diet_kg": 2,
    "energy_kg": 3
  },
  "total_emissions": 17
}
```

## 🛠️ Available Make Commands

```bash
cd BackEnd

make help      # Show all available commands
make install   # Install Python dependencies
make run       # Run server (production, low CPU)
make run-dev   # Run server (development, auto-reload)
make train     # Train the ML model
make generate  # Generate sample data
make test      # Test API endpoints
make clean     # Remove cache files
```

## 🔧 Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Authentication:** Supabase Auth

### Backend
- **Framework:** FastAPI
- **Language:** Python 3.11+
- **ML Library:** Scikit-learn
- **Model Serialization:** Joblib
- **Server:** Uvicorn (ASGI)

## 📁 Key Files

| File | Description |
|------|-------------|
| `BackEnd/main.py` | FastAPI application with ML prediction endpoint |
| `BackEnd/train_model.py` | Script to train the recommendation model |
| `FrontEnd/src/app/(dashboard)/recommendations/page.tsx` | AI recommendations page |
| `FrontEnd/src/lib/recommendations/ai-mapping.ts` | AI recommendation details mapping |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

Made with 💚 for a greener planet
