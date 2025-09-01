@echo off
setlocal enabledelayedexpansion

REM Script untuk update server lokal ReportIn di Windows
REM Usage: update_local_server.bat [--force] [--backup]

set "SERVER_DIR=%~dp0"
set "BACKUP_DIR=%SERVER_DIR%backups"
set "LOG_FILE=%SERVER_DIR%update.log"
set "TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"

echo.
echo ℹ️  🚀 ReportIn Local Server Update
echo ==================================

REM Check if we're in the right directory
if not exist "%SERVER_DIR%package.json" (
    echo ❌ Script harus dijalankan dari direktori backend!
    exit /b 1
)

REM Create backup directory
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
echo ✅ Backup directory: %BACKUP_DIR%

REM Backup database
if exist "%SERVER_DIR%db.sqlite" (
    set "BACKUP_FILE=%BACKUP_DIR%\db_backup_%TIMESTAMP%.sqlite"
    copy "%SERVER_DIR%db.sqlite" "%BACKUP_FILE%" >nul
    echo ✅ Database backed up: %BACKUP_FILE%
) else (
    echo ⚠️  Database file tidak ditemukan
)

REM Check arguments
set "FORCE_UPDATE=false"
set "BACKUP_ONLY=false"

:parse_args
if "%1"=="--force" (
    set "FORCE_UPDATE=true"
    shift
    goto parse_args
)
if "%1"=="--backup" (
    set "BACKUP_ONLY=true"
    shift
    goto parse_args
)
if "%1"=="" goto end_parse
shift
goto parse_args
:end_parse

if "%BACKUP_ONLY%"=="true" (
    echo ✅ Backup completed. Exiting.
    exit /b 0
)

REM Stop server if running
echo ℹ️  Menghentikan server...
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv ^| findstr "index.js"') do (
    taskkill /pid %%i /f >nul 2>&1
    echo ✅ Server berhasil dihentikan
)

REM Update from Git (if available)
if exist "%SERVER_DIR%.git" (
    echo ℹ️  Updating from Git repository...
    cd /d "%SERVER_DIR%"
    git stash push -m "Auto stash before update %TIMESTAMP%" >nul 2>&1
    git pull origin main >nul 2>&1 || git pull origin master >nul 2>&1
    git stash pop >nul 2>&1
    echo ✅ Git repository updated
) else (
    echo ⚠️  Git repository tidak ditemukan
)

REM Update dependencies
echo ℹ️  Updating dependencies...
cd /d "%SERVER_DIR%"
if exist "package.json" copy "package.json" "%BACKUP_DIR%\package.json.backup" >nul
npm install --production >nul 2>&1
echo ✅ Dependencies updated

REM Run database migrations
echo ℹ️  Running database migrations...
if exist "init_db.js" (
    node init_db.js >nul 2>&1
    echo ✅ Database initialized
)

REM Run additional migration scripts
for %%f in (add_*.js fix_*.js) do (
    if exist "%%f" (
        echo ℹ️  Running migration: %%f
        node "%%f" >nul 2>&1
    )
)

REM Start server
echo ℹ️  Starting server...
cd /d "%SERVER_DIR%"
start /b node index.js > server.log 2>&1

REM Wait for server to start
timeout /t 3 /nobreak >nul

REM Test server
echo ℹ️  Testing server...
timeout /t 2 /nobreak >nul

REM Show server status
echo.
echo ℹ️  Server Status:
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv ^| findstr "index.js"') do (
    echo ✅ Server is running (PID: %%i)
    echo    - Log file: %SERVER_DIR%server.log
    echo    - Available at: http://localhost:5005/
    goto :found_server
)
echo ⚠️  Server is not running
:found_server

REM Show recent logs
if exist "%SERVER_DIR%server.log" (
    echo.
    echo ℹ️  Recent server logs:
    powershell "Get-Content '%SERVER_DIR%server.log' | Select-Object -Last 5"
)

echo.
echo ✅ Update server lokal selesai!
echo.
echo 📋 Server Information:
echo    - Port: 5005
echo    - URLs:
echo      * http://localhost:5005/
echo      * http://localhost:5005/api
echo      * http://localhost:5005/api/status
echo.
echo 📁 Backup files: %BACKUP_DIR%
echo 📄 Update log: %LOG_FILE%

pause 