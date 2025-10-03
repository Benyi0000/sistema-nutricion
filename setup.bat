@echo off
echo ========================================
echo    SETUP AUTOMATICO - SISTEMA NUTRICION
echo ========================================
echo.

echo [1/6] Activando entorno virtual...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: No se pudo activar el entorno virtual
    echo Creando entorno virtual...
    python -m venv venv
    call venv\Scripts\activate.bat
)
echo ✓ Entorno virtual activado

echo.
echo [2/6] Instalando dependencias de Python...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Fallo al instalar dependencias de Python
    pause
    exit /b 1
)
echo ✓ Dependencias de Python instaladas

echo.
echo [3/6] Instalando dependencias de Node.js...
npm install
if errorlevel 1 (
    echo ERROR: Fallo al instalar dependencias de Node.js
    pause
    exit /b 1
)
echo ✓ Dependencias de Node.js instaladas

echo.
echo [4/7] Configurando variables de entorno...
if not exist .env (
    echo Creando archivo .env...
    echo DEBUG=True > .env
    echo SECRET_KEY=django-insecure-change-this-in-production >> .env
    echo ALLOWED_HOSTS_DEV=localhost,127.0.0.1,0.0.0.0 >> .env
    echo DATABASE_URL=sqlite:///db.sqlite3 >> .env
    echo CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173 >> .env
    echo JWT_SECRET_KEY=jwt-secret-key-change-in-production >> .env
    echo ✓ Archivo .env creado
) else (
    echo ✓ Archivo .env ya existe
)

echo.
echo [5/7] Aplicando migraciones de Django...
python manage.py makemigrations
python manage.py migrate
if errorlevel 1 (
    echo ERROR: Fallo al aplicar migraciones
    pause
    exit /b 1
)
echo ✓ Migraciones aplicadas

echo.
echo [6/7] Recolectando archivos estáticos...
python manage.py collectstatic --noinput
if errorlevel 1 (
    echo ERROR: Fallo al recolectar archivos estáticos
    pause
    exit /b 1
)
echo ✓ Archivos estáticos recolectados

echo.
echo [7/7] Creando usuarios de demostración...
python manage.py setup_all_users
if errorlevel 1 (
    echo ERROR: Fallo al crear usuarios de demostración
    pause
    exit /b 1
)
echo ✓ Usuarios de demostración creados

echo.
echo [8/8] Verificando configuración del sistema...
python manage.py check
if errorlevel 1 (
    echo ERROR: Fallo en la verificación del sistema
    pause
    exit /b 1
)
echo ✓ Sistema verificado correctamente

echo.
echo ========================================
echo    SETUP COMPLETADO EXITOSAMENTE
echo ========================================
echo.
echo ✓ Entorno virtual configurado
echo ✓ Dependencias instaladas (Python + Node.js)
echo ✓ Variables de entorno configuradas
echo ✓ Base de datos migrada
echo ✓ Archivos estáticos recolectados
echo ✓ Usuarios de demostración creados automáticamente
echo ✓ Sistema verificado
echo.
echo ========================================
echo    CREDENCIALES DE ACCESO
echo ========================================
echo.
echo Usuarios de demostración creados automáticamente:
echo ADMIN: DNI 00000000, password: admin123
echo NUTRICIONISTA: DNI 12345678, password: nutri123
echo PACIENTES: password: paciente123
echo   - Carlos López: DNI 20234567
echo   - María Rodríguez: DNI 20345678
echo   - Ana García: DNI 30456789
echo.
echo ========================================
echo    SIGUIENTE PASO
echo ========================================
echo.
echo Para iniciar el servidor, ejecuta: start.bat
echo.
echo URLs del sistema:
echo - Frontend: http://localhost:5173
echo - Backend API: http://localhost:8000/api
echo - Admin: http://localhost:8000/admin
echo.
echo Autenticación JWT configurada para desarrollo
echo.
pause