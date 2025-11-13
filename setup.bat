@echo off
echo ========================================
echo   SETUP - Sistema de Nutricion
echo ========================================
echo.

REM Verificar si Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python no está instalado o no está en el PATH
    echo Por favor, instala Python desde https://www.python.org/
    pause
    exit /b 1
)

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js no está instalado o no está en el PATH
    echo Por favor, instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Creando entorno virtual de Python...
if not exist "venv" (
    python -m venv venv
    echo Entorno virtual creado exitosamente
) else (
    echo El entorno virtual ya existe
)
echo.

echo [2/4] Activando entorno virtual e instalando dependencias de Python...
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Error al instalar dependencias de Python
    pause
    exit /b 1
)
echo Dependencias de Python instaladas correctamente
echo.

echo [3/4] Instalando dependencias de Node.js...
cd /d "%~dp0"
call npm install
if errorlevel 1 (
    echo [ERROR] Error al instalar dependencias de Node.js
    pause
    exit /b 1
)
echo Dependencias de Node.js instaladas correctamente
echo.

echo [4/4] Verificando archivo .env...
if not exist ".env" (
    echo [ADVERTENCIA] El archivo .env no existe
    echo Por favor, crea un archivo .env con las variables de entorno necesarias
) else (
    echo Archivo .env encontrado
)
echo.

echo ========================================
echo   SETUP COMPLETADO
echo ========================================
echo.
echo Para iniciar el servidor, ejecuta: start.bat
echo.
pause

