# Script para verificar el estado de los servidores
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VERIFICANDO ESTADO DE SERVIDORES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Backend Django (puerto 8000)
Write-Host "[Backend Django - Puerto 8000]" -ForegroundColor Yellow
$backendRunning = $false
try {
    $backend = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
    if ($backend) {
        Write-Host "  ✓ Backend está CORRIENDO" -ForegroundColor Green
        $backendProcess = Get-Process -Id $backend.OwningProcess -ErrorAction SilentlyContinue
        Write-Host "  Proceso: $($backendProcess.ProcessName) (PID: $($backend.OwningProcess))" -ForegroundColor Gray
        $backendRunning = $true
    }
} catch {
    Write-Host "  ✗ Backend NO está corriendo" -ForegroundColor Red
    Write-Host "  Solución: Ejecuta 'python manage.py runserver'" -ForegroundColor Yellow
}

Write-Host ""

# Verificar Frontend React (puerto 5173)
Write-Host "[Frontend React - Puerto 5173]" -ForegroundColor Yellow
$frontendRunning = $false
try {
    $frontend = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
    if ($frontend) {
        Write-Host "  ✓ Frontend está CORRIENDO" -ForegroundColor Green
        $frontendProcess = Get-Process -Id $frontend.OwningProcess -ErrorAction SilentlyContinue
        Write-Host "  Proceso: $($frontendProcess.ProcessName) (PID: $($frontend.OwningProcess))" -ForegroundColor Gray
        $frontendRunning = $true
    }
} catch {
    Write-Host "  ✗ Frontend NO está corriendo" -ForegroundColor Red
    Write-Host "  Solución: Ejecuta 'npm run dev'" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Resumen
if ($backendRunning -and $frontendRunning) {
    Write-Host "  ✓ TODO OK - Ambos servidores corriendo" -ForegroundColor Green
    Write-Host ""
    Write-Host "  URLs:" -ForegroundColor Cyan
    Write-Host "  - Backend:  http://localhost:8000" -ForegroundColor White
    Write-Host "  - Frontend: http://localhost:5173" -ForegroundColor White
} elseif (!$backendRunning -and !$frontendRunning) {
    Write-Host "  ✗ AMBOS servidores están DETENIDOS" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Para iniciar ambos servidores:" -ForegroundColor Yellow
    Write-Host "  1. Abre una terminal y ejecuta: python manage.py runserver" -ForegroundColor White
    Write-Host "  2. Abre otra terminal y ejecuta: npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "  O simplemente ejecuta: .\start-dev.bat" -ForegroundColor Cyan
} else {
    Write-Host "  ⚠ Falta iniciar un servidor" -ForegroundColor Yellow
    if (!$backendRunning) {
        Write-Host "  - Inicia el backend: python manage.py runserver" -ForegroundColor White
    }
    if (!$frontendRunning) {
        Write-Host "  - Inicia el frontend: npm run dev" -ForegroundColor White
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

