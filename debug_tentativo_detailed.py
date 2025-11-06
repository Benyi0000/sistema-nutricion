from apps.agenda.utils import calculate_available_slots
from apps.agenda.models import Turno, TurnoState
from apps.user.models import Nutricionista
from datetime import date
from django.utils import timezone

nutricionista = Nutricionista.objects.get(id=1)
start_date = date(2025, 11, 24)
end_date = date(2025, 11, 24)
ubicacion_id = 1
tipo_consulta_id = 1

# Primero verificar turnos TENTATIVO activos manualmente
print("="*60)
print("VERIFICACION MANUAL DE TURNOS TENTATIVO")
print("="*60)

now = timezone.now()
print(f"Hora actual: {now}")
print()

tentativo_turnos = Turno.objects.filter(
    nutricionista_id=1,
    ubicacion_id=1,
    state=TurnoState.TENTATIVO,
    start_time__date=start_date
)

print(f"Total turnos TENTATIVO en 24-nov: {tentativo_turnos.count()}")
for t in tentativo_turnos:
    print(f"\nID {t.id}:")
    print(f"  Slot: {t.start_time.strftime('%H:%M')} - {t.end_time.strftime('%H:%M')}")
    print(f"  soft_hold_expires_at: {t.soft_hold_expires_at}")
    if t.soft_hold_expires_at:
        if t.soft_hold_expires_at > now:
            mins = (t.soft_hold_expires_at - now).total_seconds() / 60
            print(f"  ✓ ACTIVO - Expira en {mins:.1f} minutos")
        else:
            mins = (now - t.soft_hold_expires_at).total_seconds() / 60
            print(f"  ✗ EXPIRADO - Hace {mins:.1f} minutos")
    else:
        print(f"  ✗ Sin soft_hold_expires_at")

# Ahora verificar con el filtro que usa calculate_available_slots
print("\n" + "="*60)
print("TURNOS QUE DEBERIAN BLOQUEAR SLOTS (con filtro Q)")
print("="*60)

from django.db.models import Q
from psycopg.types.range import Range

day_start = timezone.make_aware(timezone.datetime.combine(start_date, timezone.datetime.min.time()))
day_end = day_start + timezone.timedelta(days=1)

turnos_ocupados = Turno.objects.filter(
    nutricionista=nutricionista,
    slot__overlap=Range(day_start, day_end, bounds='[)')
)

print(f"Turnos con overlap en rango: {turnos_ocupados.count()}")

# Aplicar filtro de ubicacion
turnos_ocupados = turnos_ocupados.filter(ubicacion_id=ubicacion_id)
print(f"Turnos en ubicacion {ubicacion_id}: {turnos_ocupados.count()}")

# Aplicar filtro de estado
turnos_ocupados = turnos_ocupados.filter(
    Q(state__in=[TurnoState.RESERVADO, TurnoState.CONFIRMADO, TurnoState.ATENDIDO]) |
    (Q(state=TurnoState.TENTATIVO) & Q(soft_hold_expires_at__gt=now))
)

print(f"Turnos activos (incluye TENTATIVO no expirado): {turnos_ocupados.count()}")
print()

for t in turnos_ocupados:
    print(f"ID {t.id}: {t.start_time.strftime('%H:%M')}-{t.end_time.strftime('%H:%M')} - Estado: {t.state}")

print("\n" + "="*60)
print("SLOTS DISPONIBLES (via calculate_available_slots)")
print("="*60)

slots = calculate_available_slots(
    nutricionista=nutricionista,
    start_date=start_date,
    end_date=end_date,
    ubicacion_id=ubicacion_id,
    tipo_consulta_id=tipo_consulta_id
)

print(f"Slots disponibles: {len(slots)}")
for slot in slots:
    inicio_str = slot['inicio'].strftime('%H:%M')
    fin_str = slot['fin'].strftime('%H:%M')
    marca = " ← ESTE NO DEBERIA ESTAR" if inicio_str == "15:00" else ""
    print(f"  {inicio_str} - {fin_str}{marca}")
