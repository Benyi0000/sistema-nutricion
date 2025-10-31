# Este archivo debe estar en la misma carpeta que settings.py

# Importar la app de Celery (condicional para evitar errores si no está instalado)
try:
    from .celery import app as celery_app
    __all__ = ('celery_app',)
except ImportError:
    # Celery no está disponible (normal en algunos contextos como manage.py shell)
    pass