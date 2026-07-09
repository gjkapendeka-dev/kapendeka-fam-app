@echo off
cd /d "c:\Users\ginas\OneDrive\Documents\George Master File\Kapendeka Fam App"

REM Activate the virtual environment
call .venv\Scripts\activate.bat

REM Run the migration script
python run_migration.py

REM Keep window open if there's an error
if %ERRORLEVEL% neq 0 (
    echo.
    echo Press any key to exit...
    pause > nul
)
