from apps.agenda.utils import calculate_available_slots
from apps.user.models import Nutricionista
from datetime import date

nutricionista = Nutricionista.objects.get(id=1)

slots = calculate_available_slots(
    nutricionista=nutricionista,
    start_date=date(2025, 11, 24),
    end_date=date(2025, 11, 24),
    ubicacion_id=1,
    tipo_consulta_id=1
)

print("="*60)
print(f"SLOTS DISPONIBLES: {len(slots)}")
print("="*60)

for slot in slots:
    hora = slot['inicio'].strftime('%H:%M')
    print(f"  {hora}")

print("\nSlot 15:00 esta en lista:", any(s['inicio'].strftime('%H:%M') == '15:00' for s in slots))
