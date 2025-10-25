"""
Script para verificar asignaciones entre nutricionistas y pacientes
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.user.models import UserAccount, Nutricionista, Paciente, AsignacionNutricionistaPaciente

print("=" * 70)
print("🔍 VERIFICACIÓN DE ASIGNACIONES NUTRICIONISTA-PACIENTE")
print("=" * 70)

# Verificar paciente 13261481
paciente_dni = '13261481'
nutri_dni = '41270484'

try:
    user_paciente = UserAccount.objects.get(dni=paciente_dni)
    paciente = Paciente.objects.get(user=user_paciente)
    print(f"\n✅ Paciente encontrado:")
    print(f"   DNI: {user_paciente.dni}")
    print(f"   Email: {user_paciente.email}")
    print(f"   Paciente ID: {paciente.id}")
    print(f"   Nombre: {paciente.full_name}")
except Exception as e:
    print(f"\n❌ Error al buscar paciente: {e}")
    exit(1)

try:
    user_nutri = UserAccount.objects.get(dni=nutri_dni)
    nutricionista = Nutricionista.objects.get(user=user_nutri)
    print(f"\n✅ Nutricionista encontrado:")
    print(f"   DNI: {user_nutri.dni}")
    print(f"   Email: {user_nutri.email}")
    print(f"   Nutricionista ID: {nutricionista.id}")
    print(f"   Nombre: {nutricionista.full_name}")
except Exception as e:
    print(f"\n❌ Error al buscar nutricionista: {e}")
    exit(1)

# Buscar asignaciones
print(f"\n" + "=" * 70)
print("📋 ASIGNACIONES EXISTENTES")
print("=" * 70)

asignaciones = AsignacionNutricionistaPaciente.objects.filter(
    paciente=paciente
)

if asignaciones.exists():
    for asig in asignaciones:
        estado = "✅ ACTIVA" if asig.activo else "❌ INACTIVA"
        print(f"\n{estado}")
        print(f"   Nutricionista: {asig.nutricionista.full_name} (ID: {asig.nutricionista.id})")
        print(f"   Paciente: {asig.paciente.full_name} (ID: {asig.paciente.id})")
        print(f"   Fecha desde: {asig.fecha_desde}")
        print(f"   Fecha hasta: {asig.fecha_hasta or 'Sin fecha fin'}")
else:
    print(f"\n⚠️  NO HAY ASIGNACIONES para el paciente {paciente.full_name}")
    print(f"\n💡 Creando asignación...")
    
    # Crear la asignación
    nueva_asignacion = AsignacionNutricionistaPaciente.objects.create(
        nutricionista=nutricionista,
        paciente=paciente,
        activo=True
    )
    print(f"✅ Asignación creada:")
    print(f"   ID: {nueva_asignacion.id}")
    print(f"   Nutricionista: {nueva_asignacion.nutricionista.full_name}")
    print(f"   Paciente: {nueva_asignacion.paciente.full_name}")
    print(f"   Estado: {'ACTIVA' if nueva_asignacion.activo else 'INACTIVA'}")

print(f"\n" + "=" * 70)
print("✅ VERIFICACIÓN COMPLETADA")
print("=" * 70)
