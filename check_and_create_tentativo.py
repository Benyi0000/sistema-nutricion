from apps.agenda.models import Turno, TurnoState, Ubicacion, TipoConsultaConfig
from apps.user.models import Nutricionista
from django.utils import timezone
from datetime import timedelta, date

# 1. Ver turnos existentes en 24-nov
print("=" * 60)
print("TURNOS EXISTENTES EN 24-NOV")
print("=" * 60)

turnos_existentes = Turno.objects.filter(
    nutricionista_id=1,
    ubicacion_id=1,
    start_time__date=date(2025, 11, 24)
)

print(f"Total: {turnos_existentes.count()}")
for t in turnos_existentes:
    print(f"\nID: {t.id}")
    print(f"  Horario: {t.start_time} - {t.end_time}")
    print(f"  Estado: {t.state}")
    if t.soft_hold_expires_at:
        now = timezone.now()
        diff = (t.soft_hold_expires_at - now).total_seconds() / 60
        if diff > 0:
            print(f"  Expira en: {diff:.1f} minutos")
        else:
            print(f"  EXPIRADO hace {abs(diff):.1f} minutos")

# 2. Buscar un slot diferente para crear TENTATIVO
print("\n" + "=" * 60)
print("CREANDO NUEVO TURNO TENTATIVO EN SLOT LIBRE")
print("=" * 60)

# Probar slot 14:00-14:45
nutri = Nutricionista.objects.get(id=1)
ubi = Ubicacion.objects.get(id=1)
tipo = TipoConsultaConfig.objects.get(id=1)

inicio = timezone.now().replace(hour=14, minute=0, second=0, microsecond=0) + timedelta(days=24)
fin = inicio + timedelta(minutes=45)
expira = timezone.now() + timedelta(minutes=15)

try:
    t = Turno.objects.create(
        nutricionista=nutri,
        ubicacion=ubi,
        tipo_consulta=tipo,
        start_time=inicio,
        end_time=fin,
        state=TurnoState.TENTATIVO,
        soft_hold_expires_at=expira
    )
    
    print(f"\n✓ TURNO TENTATIVO CREADO EXITOSAMENTE")
    print(f"  ID: {t.id}")
    print(f"  Slot: {t.start_time.strftime('%Y-%m-%d %H:%M')} - {t.end_time.strftime('%H:%M')}")
    print(f"  Expira: {t.soft_hold_expires_at}")
    mins = (t.soft_hold_expires_at - timezone.now()).total_seconds() / 60
    print(f"  Minutos restantes: {mins:.1f}")
    
except Exception as e:
    print(f"\n✗ ERROR al crear turno:")
    print(f"  {str(e)}")
    print("\n  Intentando con slot 15:00...")
    
    inicio = timezone.now().replace(hour=15, minute=0, second=0, microsecond=0) + timedelta(days=24)
    fin = inicio + timedelta(minutes=45)
    
    try:
        t = Turno.objects.create(
            nutricionista=nutri,
            ubicacion=ubi,
            tipo_consulta=tipo,
            start_time=inicio,
            end_time=fin,
            state=TurnoState.TENTATIVO,
            soft_hold_expires_at=expira
        )
        print(f"\n✓ TURNO TENTATIVO CREADO EXITOSAMENTE (slot alternativo)")
        print(f"  ID: {t.id}")
        print(f"  Slot: {t.start_time.strftime('%Y-%m-%d %H:%M')} - {t.end_time.strftime('%H:%M')}")
        print(f"  Expira: {t.soft_hold_expires_at}")
        mins = (t.soft_hold_expires_at - timezone.now()).total_seconds() / 60
        print(f"  Minutos restantes: {mins:.1f}")
    except Exception as e2:
        print(f"  ERROR: {str(e2)}")

print("\n" + "=" * 60)
