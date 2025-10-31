# Script para listar los turnos del nutricionista ID=1
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.agenda.models import Turno
from apps.user.models import Nutricionista

# Obtener nutricionista ID=1
try:
    nutri = Nutricionista.objects.get(id=1)
    print(f"✅ Nutricionista: {nutri.full_name}\n")
    
    # Obtener TODOS sus turnos
    turnos = Turno.objects.filter(nutricionista=nutri).order_by('-created_at')
    
    print(f"Total de turnos: {turnos.count()}\n")
    
    for turno in turnos[:10]:  # Mostrar los últimos 10
        paciente_info = "Paciente público" if not turno.paciente else turno.paciente.full_name
        if not turno.paciente and turno.intake_answers:
            paciente_info = f"Público: {turno.intake_answers.get('nombre_completo', 'N/A')}"
        
        print(f"ID: {turno.id}")
        print(f"  Estado: {turno.state}")
        print(f"  Paciente: {paciente_info}")
        print(f"  Fecha: {turno.start_time}")
        print(f"  Creado: {turno.created_at}")
        print()
        
except Nutricionista.DoesNotExist:
    print("❌ Nutricionista ID=1 no existe")
