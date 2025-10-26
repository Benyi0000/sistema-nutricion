@echo off
echo ========================================
echo    NUTRICION - Iniciando Servidores
echo ========================================
echo.

REM Verificar si el entorno virtual existe
if not exist "venv\Scripts\activate.bat" (
    echo ERROR: No se encuentra el entorno virtual.
    echo Por favor, ejecuta: python -m venv venv
    pause
    exit /b 1
)

REM Iniciar Backend Django en una nueva ventana
echo [1/2] Iniciando Backend Django...
start "Backend Django" cmd /k "venv\Scripts\activate.bat && python manage.py runserver"

REM Esperar 3 segundos
timeout /t 3 /nobreak > nul

REM Iniciar Frontend React en una nueva ventana
echo [2/2] Iniciando Frontend React...
start "Frontend React" cmd /k "npm run dev"

echo.
echo ========================================
echo    Servidores iniciados correctamente
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause > nul

