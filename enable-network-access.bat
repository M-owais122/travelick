@echo off
echo ===============================================
echo    VR Tour Network Access Setup
echo ===============================================
echo.

REM Run as Administrator check
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo This script requires Administrator privileges!
    echo Please run as Administrator.
    pause
    exit /b 1
)

echo [1/3] Adding Windows Firewall rules for port 3001...
netsh advfirewall firewall delete rule name="VR Tour Platform In" >nul 2>&1
netsh advfirewall firewall delete rule name="VR Tour Platform Out" >nul 2>&1
netsh advfirewall firewall add rule name="VR Tour Platform In" dir=in action=allow protocol=TCP localport=3001
netsh advfirewall firewall add rule name="VR Tour Platform Out" dir=out action=allow protocol=TCP localport=3001
echo Firewall rules added successfully!
echo.

echo [2/3] Setting up WSL2 port forwarding...
REM Get WSL2 IP address
for /f "tokens=2 delims=:" %%a in ('wsl hostname -I') do set WSL_IP=%%a
set WSL_IP=%WSL_IP: =%

REM Remove existing port proxy
netsh interface portproxy delete v4tov4 listenport=3001 listenaddress=0.0.0.0 >nul 2>&1

REM Add new port proxy
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=%WSL_IP%
echo Port forwarding configured!
echo.

echo [3/3] Getting network information...
echo.
echo Your VR Tour is now accessible at:
echo ===============================================
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        echo   http://%%b:3001
    )
)
echo ===============================================
echo.
echo Share these URLs with other devices on your network!
echo.
echo Press any key to exit...
pause >nul