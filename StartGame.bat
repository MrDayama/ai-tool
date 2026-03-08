@echo off
:: Use ASCII only to avoid encoding errors in some environments
cd /d "%~dp0"

echo ========================================
echo   AI Story Relay is starting...
echo ========================================
echo.
echo 1. Keep this window OPEN while playing.
echo 2. If the browser does not open, go to:
echo    http://localhost:8080
echo.

:: Wait for 2 seconds and start browser
start "" /b cmd /c "timeout /t 2 >nul && start http://localhost:8080"

:: Start Python server
python -m http.server 8080

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start server.
    echo Make sure Python is installed.
    pause
)
