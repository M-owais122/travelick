@echo off
echo ===============================================
echo    VR Tour Network Access Fix
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

echo [1/4] Getting WSL2 IP address...
for /f "tokens=1" %%a in ('wsl hostname -I') do set WSL_IP=%%a
echo WSL2 IP: %WSL_IP%
echo.

echo [2/4] Removing old port forwarding rules...
netsh interface portproxy delete v4tov4 listenport=3001 listenaddress=0.0.0.0 >nul 2>&1
echo.

echo [3/4] Adding new port forwarding rule...
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=%WSL_IP%
if %errorLevel% EQU 0 (
    echo Port forwarding configured successfully!
) else (
    echo ERROR: Failed to configure port forwarding
    pause
    exit /b 1
)
echo.

echo [4/4] Configuring Windows Firewall...
netsh advfirewall firewall delete rule name="VR Tour Port 3001" >nul 2>&1
netsh advfirewall firewall add rule name="VR Tour Port 3001" dir=in action=allow protocol=TCP localport=3001
if %errorLevel% EQU 0 (
    echo Firewall rule added successfully!
) else (
    echo ERROR: Failed to configure firewall
)
echo.

echo [INFO] Getting your Windows IP addresses...
echo Your VR Tour is accessible at these URLs:
echo ===============================================
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        echo   http://%%b:3001
    )
)
echo ===============================================
echo.

echo [VERIFY] Testing port forwarding...
netsh interface portproxy show v4tov4
echo.

echo Setup complete! Try accessing from other devices now.
echo Press any key to exit...
pause >nul