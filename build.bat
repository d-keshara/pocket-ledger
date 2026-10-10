@echo off
rem Builds dist\PocketLedger.exe
rem One-time setup: pip install pywebview pyinstaller
cd /d "%~dp0"
python -m PyInstaller --noconfirm --onefile --windowed --name PocketLedger --icon icon.ico --add-data "web;web" main.py
rmdir /s /q build 2>nul
del PocketLedger.spec 2>nul
echo.
echo Done: dist\PocketLedger.exe
pause
