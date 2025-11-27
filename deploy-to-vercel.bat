@echo off
echo ========================================
echo   KOLEK-TA VERCEL DEPLOYMENT
echo ========================================
echo.

echo [1/4] Checking git status...
git status
echo.

echo [2/4] Adding all changes...
git add .
echo.

echo [3/4] Committing changes...
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" set commit_msg=Update Kolek-Ta system
git commit -m "%commit_msg%"
echo.

echo [4/4] Deploying to Vercel...
echo.
echo Choose deployment option:
echo 1. Deploy to Production (vercel --prod)
echo 2. Deploy to Preview (vercel)
echo 3. Push to GitHub only (auto-deploy if connected)
echo.
set /p deploy_option="Enter option (1-3): "

if "%deploy_option%"=="1" (
    echo.
    echo Deploying to PRODUCTION...
    vercel --prod
) else if "%deploy_option%"=="2" (
    echo.
    echo Deploying to PREVIEW...
    vercel
) else if "%deploy_option%"=="3" (
    echo.
    echo Pushing to GitHub...
    git push origin main
    echo.
    echo If Vercel is connected to GitHub, it will auto-deploy.
) else (
    echo Invalid option!
    pause
    exit /b
)

echo.
echo ========================================
echo   DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo IMPORTANT: Set environment variables in Vercel Dashboard:
echo   - MONGODB_URI
echo   - JWT_SECRET
echo   - NODE_ENV=production
echo   - USE_MOCK_AUTH=false
echo.
echo Then run: node scripts/fix-admin-password.js
echo.
pause
