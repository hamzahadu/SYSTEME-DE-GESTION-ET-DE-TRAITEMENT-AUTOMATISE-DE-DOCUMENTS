@echo off
echo Starting Gestion Document Platform (Master PFE)...
echo -----------------------------------------------

echo [1/3] Starting Backend API (FastAPI + PostgreSQL/SQLAlchemy)...
start "Gestion Document - Backend API" cmd /k "call .venv\Scripts\activate.bat && cd backend && uvicorn main:app --reload --port 8000"

echo [2/3] Starting Background Worker (Huey OCR & Document Pipeline)...
start "Gestion Document - Huey Worker" cmd /k "call .venv\Scripts\activate.bat && cd backend && python -m huey.bin.huey_consumer tasks.huey -w 2"

echo [3/3] Starting Frontend (Vite + React + Tailwind)...
start "Gestion Document - Frontend UI" cmd /k "cd frontend && npm run dev"

echo -----------------------------------------------
echo All Gestion Document services launched in separate windows!
echo Web UI: http://localhost:5173
echo API Docs: http://127.0.0.1:8000/docs
