from apps.agenda.utils import calculate_available_slots
from apps.user.models import Nutricionista
from datetime import date

nutricionista = Nutricionista.objects.get(id=1)
start_date = date(2025, 11, 24)
end_date = date(2025, 11, 24)
ubicacion_id = 1
tipo_consulta_id = 1

print("="*60)
print("TEST DE SLOTS DISPONIBLES")
print("="*60)
print(f"Nutricionista: {nutricionista.id}")
print(f"Fecha: {start_date}")
print(f"Ubicación: {ubicacion_id}")
print(f"Tipo Consulta: {tipo_consulta_id}")
print("="*60)

slots = calculate_available_slots(
    nutricionista=nutricionista,
    start_date=start_date,
    end_date=end_date,
    ubicacion_id=ubicacion_id,
    tipo_consulta_id=tipo_consulta_id
)

print(f"\nSlots disponibles: {len(slots)}")
for slot in slots:
    print(f"  {slot['inicio'].strftime('%H:%M')} - {slot['fin'].strftime('%H:%M')}")

print("\n" + "="*60)
print("VERIFICANDO TURNOS TENTATIVO ACTIVOS")
print("="*60)

from apps.agenda.models import Turno, TurnoState
from django.utils import timezone

now = timezone.now()
tentativo = Turno.objects.filter(
    state=TurnoState.TENTATIVO,
    soft_hold_expires_at__gt=now,
    nutricionista_id=1,
    ubicacion_id=1
)

print(f"\nTurnos TENTATIVO activos: {tentativo.count()}")
for t in tentativo:
    print(f"  ID {t.id}: {t.slot.lower.strftime('%H:%M')} - {t.slot.upper.strftime('%H:%M')}")
    mins = (t.soft_hold_expires_at - now).total_seconds() / 60
    print(f"    Expira en: {mins:.1f} minutos")
