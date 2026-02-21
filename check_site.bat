@echo off
setlocal
echo ===================================================
echo   GrandTransfer - Code Validation Check
echo ===================================================
echo.

echo [Step 1/2] Running ESLint (Checking code style and syntax)...
call npm run lint
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] ESLint found errors. Please fix them.
) else (
    echo [+] ESLint: No errors found.
)

echo.
echo [Step 2/2] Running TypeScript Check (Checking data types)...
call npx tsc --noEmit
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] TypeScript found type errors.
) else (
    echo [+] TypeScript: No errors found.
)

echo.
echo ===================================================
echo   Check complete.
echo ===================================================
pause
