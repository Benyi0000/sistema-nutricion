from apps.agenda.models import Turno, TurnoState, Ubicacion, TipoConsultaConfig
from apps.user.models import Nutricionista
from psycopg2.extras import DateTimeTZRange
from django.utils import timezone
from datetime import timedelta

nutri = Nutricionista.objects.get(id=1)
ubi = Ubicacion.objects.get(id=1)
tipo = TipoConsultaConfig.objects.get(id=1)

# Crear slot para el 24 de noviembre a las 12:00
inicio = timezone.now().replace(hour=12, minute=0, second=0, microsecond=0) + timedelta(days=24)
fin = inicio + timedelta(minutes=45)
expira = timezone.now() + timedelta(minutes=15)

t = Turno.objects.create(
    nutricionista=nutri,
    ubicacion=ubi,
    tipo_consulta=tipo,
    start_time=inicio,
    end_time=fin,
    state=TurnoState.TENTATIVO,
    soft_hold_expires_at=expira
)

print("="*60)
print("TURNO TENTATIVO CREADO")
print("="*60)
print(f"ID: {t.id}")
print(f"Slot: {t.slot.lower.strftime('%Y-%m-%d %H:%M')} - {t.slot.upper.strftime('%H:%M')}")
print(f"Expira: {t.soft_hold_expires_at.strftime('%Y-%m-%d %H:%M:%S')}")
mins = (t.soft_hold_expires_at - timezone.now()).total_seconds() / 60
print(f"Minutos restantes: {mins:.1f}")
print("="*60)
