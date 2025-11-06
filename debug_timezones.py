from apps.agenda.models import Turno
from django.utils import timezone
import pytz

# Ver el timezone del turno 40
t = Turno.objects.get(id=40)

print("Turno ID 40:")
print(f"  start_time: {t.start_time}")
print(f"  start_time UTC: {t.start_time.astimezone(pytz.UTC)}")
print(f"  start_time Argentina: {t.start_time.astimezone(pytz.timezone('America/Argentina/Cordoba'))}")

# Ahora verificar timezone de ahora
now = timezone.now()
print(f"\nHora actual: {now}")
print(f"  Timezone: {now.tzinfo}")

# Ver horarios disponibilidad
from apps.agenda.models import DisponibilidadHoraria
from apps.user.models import Nutricionista

nutri = Nutricionista.objects.get(id=1)
disp = DisponibilidadHoraria.objects.filter(nutricionista=nutri).first()

if disp:
    print(f"\nDisponibilidad:")
    print(f"  Horario: {disp.start_time} - {disp.end_time}")
    print(f"  Timezone de ubicacion: {disp.nutricionista.ubicaciones.first().timezone if disp.nutricionista.ubicaciones.exists() else 'N/A'}")
