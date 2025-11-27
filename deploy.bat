@echo off
echo ========================================
echo   KOLEK-TA DEPLOYMENT SCRIPT
echo ========================================
echo.

echo [1/5] Initializing Git...
git init
if errorlevel 1 (
    echo ERROR: Git initialization failed!
    pause
    exit /b 1
)

echo [2/5] Adding files...
git add .
if errorlevel 1 (
    echo ERROR: Failed to add files!
    pause
    exit /b 1
)

echo [3/5] Creating commit...
git commit -m "Initial commit - Kolek-Ta Waste Management System"
if errorlevel 1 (
    echo ERROR: Commit failed!
    pause
    exit /b 1
)

echo [4/5] Creating main branch...
git branch -M main
if errorlevel 1 (
    echo ERROR: Branch creation failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUCCESS! Git repository initialized
echo ========================================
echo.
echo NEXT STEPS:
echo.
echo 1. Create GitHub repository:
echo    https://github.com/new
echo.
echo 2. Repository name: kolekta
echo.
echo 3. Run these commands:
echo    git remote add origin https://github.com/YOUR_USERNAME/kolekta.git
echo    git push -u origin main
echo.
echo 4. Then deploy to Vercel:
echo    https://vercel.com/new
echo.
pause
