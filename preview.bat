@echo off
setlocal
echo ===================================================
echo   GrandTransfer - Production Preview
echo ===================================================
echo.

echo [Step 1/2] Building the project (this may take a minute)...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Build failed. Please check the errors above.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [Step 2/2] Starting production server...
echo The site will open at http://localhost:3000
echo Press Ctrl+C in this window to stop the server later.
echo.

:: Open browser after a small delay to let the server start
start http://localhost:3000

call npm start

pause
