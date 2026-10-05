# CPU Energy Efficiency Analyzer - PowerShell Launcher
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "                CPU ENERGY EFFICIENCY ANALYZER" -ForegroundColor Cyan
Write-Host "  Same output. Different implementations. Different computational costs." -ForegroundColor DarkCyan
Write-Host "=========================================================================" -ForegroundColor Cyan

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting Backend API on http://127.0.0.1:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptRoot\backend'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Write-Host "Starting Frontend UI on http://127.0.0.1:5173 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptRoot\frontend'; cmd.exe /c npm run dev"

Write-Host "`nBoth services started!" -ForegroundColor Green
Write-Host "Frontend URL: http://127.0.0.1:5173" -ForegroundColor Green
Write-Host "API Docs:     http://127.0.0.1:8000/docs" -ForegroundColor Green
