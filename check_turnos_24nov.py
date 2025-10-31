from apps.agenda.models import Turno
from django.utils import timezone

turnos = Turno.objects.filter(
    nutricionista_id=1, 
    ubicacion_id=1, 
    start_time__date='2025-11-24'
)

print("="*60)
print(f"Turnos en 24-nov para Nutricionista 1, Ubicacion 1: {turnos.count()}")
print("="*60)

for t in turnos:
    start_str = t.start_time.strftime('%H:%M')
    end_str = t.end_time.strftime('%H:%M')
    print(f"ID {t.id}: {start_str} - {end_str}")
    print(f"  State: {t.state}")
    if t.soft_hold_expires_at:
        now = timezone.now()
        if t.soft_hold_expires_at > now:
            mins = (t.soft_hold_expires_at - now).total_seconds() / 60
            print(f"  Expira en: {mins:.1f} minutos")
        else:
            print(f"  YA EXPIRO")
    print("")
