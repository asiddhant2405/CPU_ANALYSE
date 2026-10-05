@echo off
title CPU Energy Efficiency Analyzer
echo =========================================================================
echo                CPU ENERGY EFFICIENCY ANALYZER
echo  Tagline: "Same output. Different implementations. Different computational costs."
echo =========================================================================
echo.
echo Launching Backend API on http://127.0.0.1:8000 ...
start "CPU Analyzer - Backend API" cmd /k "%~dp0scripts\run_backend.bat"

echo Launching Frontend UI on http://127.0.0.1:5173 ...
start "CPU Analyzer - Frontend UI" cmd /k "%~dp0scripts\run_frontend.bat"

echo.
echo =========================================================================
echo Both services have been launched in dedicated terminal windows!
echo Open your browser at: http://127.0.0.1:5173
echo API Swagger Docs at: http://127.0.0.1:8000/docs
echo =========================================================================
pause
