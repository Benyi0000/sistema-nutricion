# Script para iniciar Celery en Windows con pool 'solo'
# Usar este script en lugar de: celery -A core worker -l info

Write-Host "🚀 Iniciando Celery Worker para Windows..." -ForegroundColor Green
Write-Host "Pool: solo (compatible con Windows)" -ForegroundColor Yellow
Write-Host ""

celery -A core worker --pool=solo -l info

# Notas:
# - El pool 'solo' ejecuta tareas de forma síncrona (una a la vez)
# - Es la solución recomendada para desarrollo en Windows
# - En producción (Linux), usar el pool 'prefork' por defecto
