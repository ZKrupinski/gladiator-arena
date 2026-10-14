@echo off
setlocal EnableExtensions
cd /d "%~dp0"
if not exist .git (
  echo Run FIRST_PUSH_WINDOWS.bat first.
  pause
  exit /b 1
)
git add . || goto :error
git diff --cached --quiet
if not errorlevel 1 (
  echo No changes to publish.
  pause
  exit /b 0
)
set /p VERSION=Enter update label (example v1.4): 
if "%VERSION%"=="" set VERSION=game update
git commit -m "GLADIATOR %VERSION%" || goto :error
git push || goto :error
echo Changes pushed. Cloudflare Pages will redeploy automatically.
pause
exit /b 0
:error
echo Push failed. Review Git or sign-in messages above.
pause
exit /b 1
