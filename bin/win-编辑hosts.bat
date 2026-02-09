@echo off
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting administrative privileges...
    powershell -Command "Start-Process '%~f0' -Verb runAs"
    exit /b
)
set "hostsFilePath=%windir%\System32\drivers\etc\hosts"
if not exist "%hostsFilePath%" ( 
    echo Not found hosts file. filepath: "%hostsFilePath%"
    pause
) else ( 
    start notepad "%hostsFilePath%"
)
ipconfig /flushdns
echo Restart to use the edited hosts file.
timeout /t 5