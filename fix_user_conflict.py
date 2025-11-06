"""
Script para limpiar y recrear el usuario 13261481 como SOLO paciente
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.user.models import UserAccount, Nutricionista, Paciente
from datetime import date

DNI = '13261481'
EMAIL = 'valentinbenitez2157@gmail.com'
FECHA_NACIMIENTO = date(1957, 5, 21)

print("=" * 70)
print("🔧 LIMPIEZA Y RECREACIÓN DEL USUARIO 13261481")
print("=" * 70)

# 1. Buscar usuario existente
try:
    user = UserAccount.objects.get(dni=DNI)
    print(f"\n✅ Usuario encontrado: {user.dni} - {user.email}")
    
    # Verificar perfiles
    nutri = Nutricionista.objects.filter(user=user).first()
    paciente = Paciente.objects.filter(user=user).first()
    
    print(f"   Perfil Nutricionista: {'SÍ (ID: {})'.format(nutri.id) if nutri else 'NO'}")
    print(f"   Perfil Paciente: {'SÍ (ID: {})'.format(paciente.id) if paciente else 'NO'}")
    
    # 2. Eliminar perfiles
    if nutri:
        print(f"\n🗑️  Eliminando perfil de Nutricionista...")
        nutri.delete()
        print(f"   ✅ Perfil de Nutricionista eliminado")
    
    if paciente:
        print(f"\n🗑️  Eliminando perfil de Paciente...")
        paciente.delete()
        print(f"   ✅ Perfil de Paciente eliminado")
    
    # 3. Eliminar usuario
    print(f"\n🗑️  Eliminando usuario completo...")
    user.delete()
    print(f"   ✅ Usuario eliminado completamente")
    
except UserAccount.DoesNotExist:
    print(f"\n⚠️  Usuario {DNI} no existe, se creará desde cero")

# 4. Recrear usuario SOLO como paciente
print(f"\n" + "=" * 70)
print(f"🆕 CREANDO NUEVO USUARIO COMO PACIENTE")
print("=" * 70)

# Calcular contraseña según fórmula
ddmm = FECHA_NACIMIENTO.strftime("%d%m")
password = f"{DNI}{ddmm}"

print(f"\n📝 Datos del nuevo usuario:")
print(f"   DNI: {DNI}")
print(f"   Email: {EMAIL}")
print(f"   Fecha nacimiento: {FECHA_NACIMIENTO}")
print(f"   Contraseña: {password}")

# Crear usuario
new_user = UserAccount.objects.create_user(
    dni=DNI,
    email=EMAIL,
    password=password,
    is_staff=False,
    is_superuser=False,
    must_change_password=True
)
print(f"\n✅ Usuario creado (ID: {new_user.id})")

# Crear perfil de Paciente
new_paciente = Paciente.objects.create(
    user=new_user,
    fecha_nacimiento=FECHA_NACIMIENTO,
    nombre="Valentin",  # Ajusta según necesites
    apellido="Benitez"  # Ajusta según necesites
)
print(f"✅ Perfil de Paciente creado (ID: {new_paciente.id})")

# Verificar contraseña
print(f"\n" + "=" * 70)
print(f"🔐 VERIFICACIÓN DE CONTRASEÑA")
print("=" * 70)
print(f"   Contraseña correcta ({password}): {new_user.check_password(password)}")
print(f"   Contraseña alternativa ({DNI}salud): {new_user.check_password(f'{DNI}salud')}")

print(f"\n" + "=" * 70)
print(f"✅ PROCESO COMPLETADO")
print("=" * 70)
print(f"\n🔑 Credenciales para login:")
print(f"   DNI: {DNI}")
print(f"   Contraseña: {password}")
print(f"   Rol: PACIENTE (sin perfil de Nutricionista)")
print("=" * 70)
