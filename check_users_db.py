"""
Script para verificar qué usuarios existen en la base de datos
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.user.models import UserAccount

print("=" * 70)
print("USUARIOS EN LA BASE DE DATOS")
print("=" * 70)

users = UserAccount.objects.all()

if not users:
    print("\n❌ NO HAY USUARIOS en la base de datos")
else:
    print(f"\n✅ Se encontraron {users.count()} usuario(s):\n")
    for user in users:
        print(f"   ID: {user.id}")
        print(f"   DNI: {user.dni}")
        print(f"   Email: {user.email}")
        print(f"   Activo: {user.is_active}")
        print(f"   Staff: {user.is_staff}")
        
        # Verificar si tiene perfil de nutricionista
        try:
            nutri = user.nutricionista
            print(f"   ✅ Tiene perfil de Nutricionista (ID: {nutri.id})")
        except:
            print(f"   ❌ NO tiene perfil de Nutricionista")
        
        print("-" * 70)
