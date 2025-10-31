# Script para verificar el último turno creado
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.agenda.models import Turno
from django.utils import timezone

# Obtener el último turno creado
ultimo_turno = Turno.objects.order_by('-created_at').first()

if ultimo_turno:
    print(f"✅ Último turno encontrado:")
    print(f"   ID: {ultimo_turno.id}")
    print(f"   Estado: {ultimo_turno.state}")
    print(f"   Paciente (intake): {ultimo_turno.intake_answers.get('nombre_completo', 'N/A')}")
    print(f"   Email: {ultimo_turno.intake_answers.get('email', 'N/A')}")
    print(f"   Nutricionista: {ultimo_turno.nutricionista.full_name}")
    print(f"   Fecha/Hora: {ultimo_turno.start_time}")
    print(f"   Creado: {ultimo_turno.created_at}")
    print(f"   Soft hold expira: {ultimo_turno.soft_hold_expires_at}")
else:
    print("❌ No hay turnos en la base de datos")
