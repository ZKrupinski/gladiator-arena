@echo off
setlocal EnableExtensions
cd /d "%~dp0"
where git >nul 2>nul
if errorlevel 1 (
  echo Git is not installed. Install Git for Windows: https://git-scm.com/downloads/win
  pause
  exit /b 1
)
set /p REMOTE_URL=Enter your empty GitHub repository HTTPS URL (https://github.com/USER/gladiator-arena.git): 
if "%REMOTE_URL%"=="" (
  echo Repository URL is required.
  pause
  exit /b 1
)
if not exist .git (git init || goto :error)
git branch -M main || goto :error
git add . || goto :error
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "GLADIATOR v1.3 initial Git auto-deploy" || goto :error
)
git remote get-url origin >nul 2>nul
if errorlevel 1 (
  git remote add origin "%REMOTE_URL%" || goto :error
) else (
  git remote set-url origin "%REMOTE_URL%" || goto :error
)
git push -u origin main || goto :error
echo.
echo GitHub upload complete. Set up Cloudflare Pages Git integration using branch main and output directory public.
pause
exit /b 0
:error
echo.
echo Upload failed. Check the message above. GitHub login may be required.
pause
exit /b 1
