"""
Script para corregir el UID de las cuentas de Google vinculadas.
Este script actualiza los UIDs que están guardados como email en lugar del ID de Google.
"""
import os
import django
import sys

# Configurar Django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from social_django.models import UserSocialAuth
import requests


def get_google_id_from_email(email, access_token=None):
    """
    Obtiene el ID de Google a partir del email.
    Si se proporciona un access_token, se usa para verificar.
    """
    if access_token:
        try:
            url = 'https://www.googleapis.com/oauth2/v2/userinfo'
            headers = {'Authorization': f'Bearer {access_token}'}
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                return data.get('id'), data
        except Exception as e:
            print(f"Error al obtener información de Google: {e}")
    
    return None, None


def fix_google_uids():
    """
    Corrige los UIDs de las cuentas de Google que están guardados como email.
    """
    print("Buscando cuentas de Google con UID incorrecto...")
    
    social_auths = UserSocialAuth.objects.filter(provider='google-oauth2')
    
    if not social_auths.exists():
        print("No se encontraron cuentas de Google vinculadas.")
        return
    
    for social in social_auths:
        print(f"\n{'='*60}")
        print(f"Usuario: {social.user.dni} - {social.user.email}")
        print(f"UID actual: {social.uid}")
        print(f"Provider: {social.provider}")
        
        # Verificar si el UID es un email (formato incorrecto)
        if '@' in social.uid:
            print("⚠️  El UID está en formato de email (incorrecto)")
            print("\nPara corregir esto, el usuario debe:")
            print("1. Desvincular la cuenta actual")
            print("2. Volver a vincular usando el nuevo flujo")
            print("\nO puedes eliminar esta vinculación manualmente:")
            print(f"   UserSocialAuth.objects.get(id={social.id}).delete()")
            
            # Preguntar si desea eliminar
            respuesta = input("\n¿Deseas eliminar esta vinculación ahora? (s/n): ")
            if respuesta.lower() == 's':
                social.delete()
                print("✓ Vinculación eliminada. El usuario puede volver a vincular correctamente.")
        else:
            print("✓ El UID tiene el formato correcto (ID numérico)")
            print(f"Extra data: {social.extra_data.get('email', 'N/A')}")


if __name__ == '__main__':
    print("="*60)
    print("Script de corrección de UIDs de Google OAuth")
    print("="*60)
    fix_google_uids()
    print("\n" + "="*60)
    print("Proceso completado")
    print("="*60)
