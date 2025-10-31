import os
from celery import Celery

# Establecer el módulo de settings de Django para el 'celery' prog.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')

# Usar un string aquí significa que el worker no tiene que
# serializar el objeto de configuración.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Cargar automáticamente módulos de tareas desde todas las apps registradas de Django
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self!r}')