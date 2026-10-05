@echo off
title CPU Energy Efficiency Analyzer - Frontend
cd /d "%~dp0..\frontend"
echo ========================================================
echo Starting CPU Energy Efficiency Analyzer Frontend UI...
echo URL: http://127.0.0.1:5173
echo ========================================================
cmd.exe /c npm run dev
pause
