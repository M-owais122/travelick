@echo off
echo Setting up mobile access for VR Tour Platform...
echo.

REM Get WSL IP
for /f "tokens=2 delims=:" %%i in ('wsl hostname -I') do set WSL_IP=%%i
set WSL_IP=%WSL_IP: =%

echo WSL2 IP: %WSL_IP%
echo Setting up port forwarding...

REM Remove existing port proxy (if any)
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0 >nul 2>&1

REM Add new port proxy
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=%WSL_IP%

if %errorlevel% equ 0 (
    echo ✅ Port forwarding setup successful!
    echo.
    echo 📱 Mobile Access URLs:
    for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4"') do (
        set IP=%%i
        setlocal enabledelayedexpansion
        set IP=!IP: =!
        if not "!IP!"=="127.0.0.1" (
            echo    http://!IP!:3000
        )
        endlocal
    )
    echo.
    echo ⚠️  Make sure Windows Firewall allows connections on port 3000
) else (
    echo ❌ Port forwarding failed. Run this script as Administrator.
)

echo.
echo Press any key to exit...
pause >nul