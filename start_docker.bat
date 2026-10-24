@echo off
echo ====================================================
echo Starting Gestion Document Platform (Docker Mode)...
echo ====================================================
docker-compose up -d
echo.
echo ----------------------------------------------------
echo Gestion Document is running!
echo Web UI:    http://localhost:5173
echo API Docs:  http://127.0.0.1:8000/docs
echo Database:  PostgreSQL 16 on port 5432
echo ----------------------------------------------------
echo.
pause
