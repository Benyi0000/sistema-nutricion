@echo off
echo ========================================
echo    INICIANDO SERVIDOR - SISTEMA NUTRICION
echo ========================================
echo.

echo Activando entorno virtual...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: No se pudo activar el entorno virtual
    echo Ejecuta setup.bat primero para configurar el proyecto
    pause
    exit /b 1
)

echo.
echo ¿Qué servidor deseas iniciar?
echo 1. Solo Django (Backend) - Puerto 8000
echo 2. Solo Frontend (Vite) - Puerto 5173  
echo 3. Ambos servidores (Django + Vite)
echo.
set /p opcion=Selecciona una opción (1-3): 

if "%opcion%"=="1" goto django_only
if "%opcion%"=="2" goto vite_only
if "%opcion%"=="3" goto both_servers
echo Opción inválida
pause
exit /b 1

:django_only
echo.
echo Iniciando servidor Django...
echo Backend API disponible en: http://localhost:8000/api
echo Admin Django disponible en: http://localhost:8000/admin
echo Panel de administración: http://localhost:8000
echo.
echo Autenticación JWT configurada
echo Endpoint de login: http://localhost:8000/api/auth/login/
echo.
echo Presiona Ctrl+C para detener el servidor
python manage.py runserver
goto end

:vite_only
echo.
echo Iniciando servidor Vite (Frontend React)...
echo Aplicación web disponible en: http://localhost:5173
echo.
echo Presiona Ctrl+C para detener el servidor
npm run dev
goto end

:both_servers
echo.
echo Iniciando ambos servidores...
echo Backend API (Django): http://localhost:8000/api
echo Admin Django: http://localhost:8000/admin
echo Frontend React (Vite): http://localhost:5173
echo.
echo Presiona Ctrl+C para detener ambos servidores
echo.
start "Servidor Django - Backend" cmd /c "call venv\Scripts\activate.bat && python manage.py runserver"
timeout /t 3 /nobreak >nul
start "Servidor Vite - Frontend" cmd /c "npm run dev"
echo.
echo Ambos servidores iniciados en ventanas separadas
echo Cierra las ventanas del terminal para detener los servidores
echo.
echo URLs del sistema:
echo - Aplicación web: http://localhost:5173
echo - API Backend: http://localhost:8000/api
echo - Admin Django: http://localhost:8000/admin
echo - Login JWT: http://localhost:8000/api/auth/login/
echo.
echo Autenticación JWT configurada para desarrollo
pause
goto end

:end
echo.
echo Servidor detenido
pause

