from apps.agenda.models import Turno
from django.utils import timezone

turnos = Turno.objects.filter(
    nutricionista_id=1, 
    ubicacion_id=1, 
    start_time__date='2025-11-24'
).values('id', 'start_time', 'end_time', 'state', 'soft_hold_expires_at')

print("Turnos en 24-nov:")
for t in turnos:
    print(t)
