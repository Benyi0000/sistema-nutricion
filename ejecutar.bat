@echo off
echo ========================================
echo   EJECUTABLE - Sistema de Nutricion
echo ========================================
echo.

REM Cambiar al directorio del script
cd /d "%~dp0"

REM Verificar si el setup ya se ejecutó
if not exist "venv" (
    echo El setup no se ha ejecutado aún.
    echo Ejecutando setup primero...
    echo.
    call setup.bat
    if errorlevel 1 (
        echo [ERROR] El setup falló. Por favor, revisa los errores anteriores.
        pause
        exit /b 1
    )
    echo.
    echo Setup completado. Iniciando servidores...
    echo.
) else (
    echo Setup ya completado. Iniciando servidores...
    echo.
)

REM Iniciar los servidores
call start.bat

