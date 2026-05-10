@echo off
setlocal

REM Project root is the directory containing this batch file
set "PROJECT_ROOT=%~dp0"
set "FRONTEND_DIR=%PROJECT_ROOT%frontend\intellihire"

echo Starting backend in a new window...
start "Intellihire Backend" /D "%PROJECT_ROOT%" cmd /k "python run.py"

echo Starting frontend in a new window...
start "Intellihire Frontend" /D "%FRONTEND_DIR%" cmd /k "npm run dev"

echo Backend and frontend have been launched.
echo Close this window if you do not need it.
pause