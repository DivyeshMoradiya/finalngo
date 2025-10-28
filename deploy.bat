@echo off
REM Production Deployment Script for HopeNest NGO Application (Windows)
REM This script builds and deploys the application using Docker

setlocal enabledelayedexpansion

echo 🚀 Starting HopeNest Production Deployment...

REM Configuration
set DOCKER_COMPOSE_FILE=docker-compose.yml
set ENV_FILE=.env
set BACKUP_DIR=backups\%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%

REM Create backup directory
if not exist "backups" mkdir backups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Function to check Docker installation
:check_docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed. Please install Docker first.
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker.
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

REM Function to check environment file
:check_env_file
if not exist "%ENV_FILE%" (
    echo [WARN] Environment file not found. Creating from template...
    copy .env.docker .env
    echo [ERROR] Please update the .env file with your production values before continuing.
    exit /b 1
)

REM Function to backup current deployment
:backup_current
echo [INFO] Creating backup of current deployment...

if exist "%ENV_FILE%" copy "%ENV_FILE%" "%BACKUP_DIR%\"
if exist "%DOCKER_COMPOSE_FILE%" copy "%DOCKER_COMPOSE_FILE%" "%BACKUP_DIR%\"

REM Backup database if container is running
docker ps | findstr hopenest-mongo >nul 2>&1
if not errorlevel 1 (
    echo [INFO] Backing up database...
    docker exec hopenest-mongo mongodump --out /tmp/backup
    docker cp hopenest-mongo:/tmp/backup "%BACKUP_DIR%\mongodb_backup"
)

echo [INFO] Backup created at: %BACKUP_DIR%

REM Function to deploy
:deploy
echo [INFO] Building Docker images...
docker-compose build --no-cache

echo [INFO] Stopping existing containers...
docker-compose down

echo [INFO] Starting new deployment...
docker-compose up -d

echo [INFO] Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Check if services are running
docker-compose ps | findstr "Up" >nul 2>&1
if not errorlevel 1 (
    echo [INFO] ✅ Deployment successful!
    echo [INFO] Service URLs:
    echo   Frontend: http://localhost
    echo   Backend API: http://localhost:5000
    echo   Health Check: http://localhost:5000/health
) else (
    echo [ERROR] ❌ Deployment failed!
    echo [ERROR] Check logs with: docker-compose logs
    exit /b 1
)

REM Main execution
if "%1"=="rollback" goto rollback
if "%1"=="backup" goto backup
if "%1"=="logs" goto logs
if "%1"=="status" goto status
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart

REM Default action is deploy
call :check_docker
call :check_env_file
call :backup_current
call :deploy
goto end

:rollback
echo [WARN] Rolling back to previous deployment...
docker-compose down
if exist "%BACKUP_DIR%\.env" copy "%BACKUP_DIR%\.env" .
if exist "%BACKUP_DIR%\docker-compose.yml" copy "%BACKUP_DIR%\docker-compose.yml" .
docker-compose up -d
echo [INFO] ✅ Rollback completed!
goto end

:backup
call :backup_current
goto end

:logs
docker-compose logs -f
goto end

:status
docker-compose ps
goto end

:stop
echo [INFO] Stopping services...
docker-compose down
goto end

:restart
echo [INFO] Restarting services...
docker-compose restart
goto end

:end
echo.
echo Script completed.
pause