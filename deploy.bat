@echo off
REM ========================================
REM AI-POS Auto-Deploy Script (Windows)
REM ========================================

echo.
echo ================================
echo   AI-POS Auto-Deploy Script
echo ================================
echo.

REM Check if git is initialized
if not exist .git (
    echo Initializing Git repository...
    git init
    git branch -M main
) else (
    echo Git repository exists
)

REM Add all files
echo.
echo Adding all files...
git add .

REM Commit
echo.
echo Committing changes...
git commit -m "Deploy: AI-POS v3.0 - Production Ready with Cloud Sync"

REM Get GitHub username
echo.
echo ================================
echo   GitHub Setup Required
echo ================================
set /p GITHUB_USERNAME="Enter your GitHub username: "

REM Get repository name
echo.
set /p REPO_NAME="Enter repository name (default: ai-pos-app): "
if "%REPO_NAME%"=="" set REPO_NAME=ai-pos-app

REM Add remote
echo.
echo Setting up remote repository...
git remote remove origin 2>nul
git remote add origin https://github.com/%GITHUB_USERNAME%/%REPO_NAME%.git

REM Create .nojekyll
echo.
echo Creating .nojekyll file...
type nul > .nojekyll
git add .nojekyll
git commit -m "Add .nojekyll for GitHub Pages" 2>nul

echo.
echo ================================
echo   Ready to Push!
echo ================================
echo.
echo NEXT STEPS:
echo 1. Go to: https://github.com/new
echo 2. Repository name: %REPO_NAME%
echo 3. Keep it PUBLIC
echo 4. Don't initialize with any files
echo 5. Click 'Create repository'
echo.
echo Then run:
echo   git push -u origin main
echo.
echo After pushing, enable GitHub Pages:
echo 1. Go to repository Settings
echo 2. Pages (left sidebar)
echo 3. Source: main branch
echo 4. Folder: / (root)
echo 5. Save
echo.
echo Your app will be live at:
echo https://%GITHUB_USERNAME%.github.io/%REPO_NAME%/
echo.
echo ================================
echo   Setup Complete!
echo ================================
echo.
pause
