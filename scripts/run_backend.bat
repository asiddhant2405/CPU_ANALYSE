@echo off
title CPU Energy Efficiency Analyzer - Backend
cd /d "%~dp0..\backend"
echo ========================================================
echo Starting CPU Energy Efficiency Analyzer Backend API...
echo Host: http://127.0.0.1:8000
echo API Docs: http://127.0.0.1:8000/docs
echo ========================================================
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
