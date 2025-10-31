# Script para extender la expiración del token para pruebas
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.agenda.models import MagicLinkToken
from django.utils import timezone
from datetime import timedelta

token_uuid = "aebda134-0285-4bdd-b215-8b34fa6f7fa4"

try:
    token = MagicLinkToken.objects.get(token=token_uuid)
    
    # Extender la expiración 20 minutos más
    nueva_expiracion = timezone.now() + timedelta(minutes=20)
    token.expires_at = nueva_expiracion
    token.save()
    
    # También extender el soft_hold del turno
    if token.turno:
        token.turno.soft_hold_expires_at = nueva_expiracion
        token.turno.save()
        print(f"✅ Token y turno extendidos hasta: {nueva_expiracion}")
        print(f"   Nuevo link: http://localhost:5173/confirmar-turno/{token.token}")
    else:
        print("❌ El token no tiene turno asociado")
        
except MagicLinkToken.DoesNotExist:
    print(f"❌ Token no encontrado")
