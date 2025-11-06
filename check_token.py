# Script para verificar el estado del token
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.agenda.models import MagicLinkToken, Turno
from django.utils import timezone

token_uuid = "aebda134-0285-4bdd-b215-8b34fa6f7fa4"

try:
    token = MagicLinkToken.objects.get(token=token_uuid)
    print(f"✅ Token encontrado: {token.token}")
    print(f"   - Acción: {token.action}")
    print(f"   - Usado en: {token.used_at}")
    print(f"   - Expira en: {token.expires_at}")
    print(f"   - Ahora: {timezone.now()}")
    print(f"   - Expirado: {token.expires_at < timezone.now()}")
    
    if token.turno:
        print(f"   - Turno ID: {token.turno.id}")
        print(f"   - Estado turno: {token.turno.state}")
        print(f"   - Soft hold expira: {token.turno.soft_hold_expires_at}")
    else:
        print("   - No tiene turno asociado")
        
except MagicLinkToken.DoesNotExist:
    print(f"❌ Token {token_uuid} no existe en la base de datos")
