@echo off
REM Vision TCG - Script de test Windows
REM Lance backend + frontend en parallèle

echo.
echo ================================================
echo   VISION TCG - MVP Step 1
echo   Demarrage backend + frontend
echo ================================================
echo.

REM Vérifier qu'on est dans le bon dossier
if not exist "backend\package.json" (
    echo [ERREUR] Vous devez executer ce script depuis D:\Developpement\vision-tcg\
    pause
    exit /b 1
)

echo [1/5] Verifier les dependances backend...
cd backend
if not exist "node_modules\" (
    echo [INSTALL] Installation des dependances backend...
    call npm install
)

echo.
echo [2/5] Generer les donnees de test...
call npm run db:seed
if errorlevel 1 (
    echo [ERREUR] Seed failed
    pause
    exit /b 1
)

echo.
echo [3/5] Verifier les dependances frontend...
cd ..\frontend
if not exist "node_modules\" (
    echo [INSTALL] Installation des dependances frontend...
    call npm install
)

echo.
echo [4/5] Verifier .env frontend...
if not exist ".env" (
    echo [CONFIG] Creation de .env...
    echo VITE_API_URL=http://localhost:3001 > .env
)

echo.
echo [5/5] Demarrage des serveurs...
echo.
echo ================================================
echo   Backend: http://localhost:3001
echo   Frontend: http://localhost:5173
echo ================================================
echo.
echo [INFO] Ouvre http://localhost:5173 dans ton navigateur
echo [INFO] Pour arreter: Ctrl+C dans chaque fenetre
echo.

REM Démarrer backend dans une nouvelle fenêtre
start "Vision TCG - Backend (Port 3001)" cmd /k "cd /d %~dp0backend && npm run dev"

REM Attendre 3 secondes que le backend démarre
timeout /t 3 /nobreak >nul

REM Démarrer frontend dans une nouvelle fenêtre
start "Vision TCG - Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo [OK] Les serveurs demarrent dans des fenetres separees
echo [OK] Une fois demarres, ouvre: http://localhost:5173
echo.
pause
