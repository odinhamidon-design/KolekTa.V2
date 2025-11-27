@echo off
echo ========================================
echo   QUICK DEPLOY TO VERCEL
echo ========================================
echo.

echo Deploying with Mock Auth (no MongoDB needed)...
echo.

vercel --prod --yes

echo.
echo ========================================
echo   DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Login credentials:
echo   Admin: username=admin, password=sharingan
echo   Driver: Create from admin panel
echo.
echo If login fails, go to Vercel Dashboard and set:
echo   USE_MOCK_AUTH = true
echo.
pause
