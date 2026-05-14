@echo off
echo Starting DocuProcess Prototype...
echo --------------------------------

echo Starting Backend API...
start "Backend API" cmd /k "cd backend && uvicorn main:app --reload"

echo Starting Backend Worker...
start "Backend Worker" cmd /k "cd backend && huey_consumer tasks.huey"

echo Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo All services launched in separate windows.
