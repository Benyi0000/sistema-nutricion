from apps.agenda.models import Turno, TurnoState, Ubicacion, TipoConsultaConfig
from apps.user.models import Nutricionista
from django.utils import timezone
from datetime import timedelta
import zoneinfo

# Crear turno en timezone Argentina
nutri = Nutricionista.objects.get(id=1)
ubi = Ubicacion.objects.get(id=1)
tipo = TipoConsultaConfig.objects.get(id=1)

# Timezone Argentina
tz_argentina = zoneinfo.ZoneInfo("America/Argentina/Cordoba")

# Crear datetime para 24 nov 2025 15:00 hora Argentina
from datetime import datetime
inicio = datetime(2025, 11, 24, 15, 0, 0, tzinfo=tz_argentina)
fin = inicio + timedelta(minutes=45)
expira = timezone.now() + timedelta(minutes=15)

print("Creando turno TENTATIVO:")
print(f"  inicio: {inicio} ({inicio.tzinfo})")
print(f"  inicio UTC: {inicio.astimezone(timezone.utc)}")
print(f"  fin: {fin}")
print(f"  expira: {expira}")

t = Turno.objects.create(
    nutricionista=nutri,
    ubicacion=ubi,
    tipo_consulta=tipo,
    start_time=inicio,
    end_time=fin,
    state=TurnoState.TENTATIVO,
    soft_hold_expires_at=expira
)

print(f"\n✓ Turno creado:")
print(f"  ID: {t.id}")
print(f"  start_time: {t.start_time}")
print(f"  start_time UTC: {t.start_time.astimezone(timezone.utc)}")
