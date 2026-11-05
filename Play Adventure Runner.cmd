@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js from https://nodejs.org then run this file again.
  pause
  exit /b 1
)
if not exist node_modules (
  call npm.cmd install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo Open the Local address below to play Adventure Runner 3D.
echo Keep this window open while playing. Press Ctrl+C to stop.
call npm.cmd run dev
pause
