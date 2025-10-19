import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from social_django.models import UserSocialAuth
from apps.user.models import UserAccount

try:
    user = UserAccount.objects.get(dni='44464273')
    print(f"✅ Usuario encontrado:")
    print(f"   DNI: {user.dni}")
    print(f"   Email: {user.email}")
    print(f"   Nombre: {user.first_name} {user.last_name}")
    print()
    
    socials = UserSocialAuth.objects.filter(user=user)
    print(f"🔗 Vinculaciones de Google: {socials.count()}")
    
    if socials.exists():
        for social in socials:
            print(f"   ✅ Provider: {social.provider}")
            print(f"   ✅ UID: {social.uid}")
            print(f"   ✅ Extra data: {social.extra_data}")
    else:
        print("   ⚠️  No hay vinculaciones activas")
        print()
        print("🔧 ACCIÓN REQUERIDA:")
        print("   1. Login con DNI/password")
        print("   2. Ir a /panel/admin/configuracion")
        print("   3. Click en 'Vincular cuenta de Google'")
        
except UserAccount.DoesNotExist:
    print("❌ Usuario con DNI 44464273 no encontrado")
