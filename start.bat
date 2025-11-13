@echo off
echo ========================================
echo   INICIANDO - Sistema de Nutricion
echo ========================================
echo.

REM Cambiar al directorio del script
cd /d "%~dp0"

REM Verificar si existe el entorno virtual
if not exist "venv" (
    echo [ERROR] El entorno virtual no existe
    echo Por favor, ejecuta setup.bat primero
    pause
    exit /b 1
)

REM Activar entorno virtual
echo Activando entorno virtual...
call venv\Scripts\activate.bat

REM Verificar si las dependencias están instaladas
if not exist "node_modules" (
    echo [ADVERTENCIA] Las dependencias de Node.js no están instaladas
    echo Ejecutando npm install...
    call npm install
)

REM Verificar migraciones de Django
echo.
echo Verificando migraciones de Django...
python manage.py makemigrations --noinput
python manage.py migrate --noinput

REM Iniciar servidor Django en una nueva ventana
echo.
echo Iniciando servidor Django (puerto 8000)...
start "Django Server" cmd /k "call venv\Scripts\activate.bat && python manage.py runserver"

REM Esperar un momento para que Django inicie
timeout /t 3 /nobreak >nul

REM Iniciar servidor Vite en otra nueva ventana
echo Iniciando servidor Vite (puerto 5173)...
start "Vite Server" cmd /k "npm run dev"

echo.
echo ========================================
echo   SERVIDORES INICIADOS
echo ========================================
echo.
echo Backend Django: http://localhost:8000
echo Frontend Vite:  http://localhost:5173
echo.
echo Presiona cualquier tecla para cerrar esta ventana
echo (Los servidores seguirán ejecutándose en sus propias ventanas)
echo.
pause >nul

