#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.user.models import Paciente, Consulta, UserAccount

# Buscar paciente por DNI
dni = "13261481"
print(f"\n=== Buscando paciente con DNI: {dni} ===")

user = UserAccount.objects.filter(dni=dni).first()
if not user:
    print(f"❌ No existe usuario con DNI {dni}")
    exit()

print(f"✅ Usuario encontrado: {user.email}")

# Buscar paciente
paciente = getattr(user, 'paciente', None)
if not paciente:
    print(f"❌ El usuario no tiene perfil de paciente")
    exit()

print(f"✅ Paciente encontrado: {paciente.nombre} {paciente.apellido}")
print(f"   ID: {paciente.id}")

# Buscar consultas
consultas = Consulta.objects.filter(paciente=paciente).order_by('-fecha')
print(f"\n=== Consultas del paciente (Total: {consultas.count()}) ===")

if consultas.count() == 0:
    print("❌ No hay consultas registradas para este paciente")
else:
    for c in consultas:
        print(f"\n📋 Consulta ID: {c.id}")
        print(f"   Tipo: {c.tipo}")
        print(f"   Fecha: {c.fecha}")
        print(f"   Nutricionista: {c.nutricionista.user.first_name} {c.nutricionista.user.last_name}")
        print(f"   Plantilla usada: {c.plantilla_usada.nombre if c.plantilla_usada else 'Manual'}")
        print(f"   # Respuestas: {len(c.respuestas)}")
        print(f"   Métricas: {list(c.metricas.keys())}")
        
        # Mostrar algunas respuestas
        if c.respuestas:
            print(f"   Primeras 3 respuestas:")
            for resp in c.respuestas[:3]:
                print(f"      - {resp.get('pregunta')}: {resp.get('valor')} {resp.get('unidad', '')}")

print("\n=== Verificación del endpoint ===")
print(f"GET /api/user/consultas/?paciente_id={paciente.id}")
