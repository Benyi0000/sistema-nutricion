#!/usr/bin/env python
"""
Comandos útiles para testing y debugging de Google OAuth
Ejecutar con: python test_google_oauth.py [comando]
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from social_django.models import UserSocialAuth
from apps.user.models import UserAccount


def listar_vinculaciones():
    """Lista todas las vinculaciones de Google OAuth"""
    print("\n" + "="*70)
    print("VINCULACIONES DE GOOGLE OAUTH")
    print("="*70)
    
    vinculaciones = UserSocialAuth.objects.filter(provider='google-oauth2')
    
    if not vinculaciones.exists():
        print("⚠️  No hay vinculaciones de Google")
        return
    
    for social in vinculaciones:
        print(f"\n👤 Usuario: {social.user.dni}")
        print(f"   Email: {social.user.email}")
        print(f"   Provider: {social.provider}")
        print(f"   UID: {social.uid}")
        print(f"   UID es email? {'❌ SÍ (incorrecto)' if '@' in social.uid else '✅ NO (correcto)'}")
        print(f"   Google email: {social.extra_data.get('email', 'N/A')}")
        print(f"   Fecha creación: {social.created}")


def verificar_usuario(dni):
    """Verifica el estado de vinculación de un usuario específico"""
    print("\n" + "="*70)
    print(f"VERIFICACIÓN DE USUARIO: {dni}")
    print("="*70)
    
    try:
        user = UserAccount.objects.get(dni=dni)
        print(f"\n✅ Usuario encontrado")
        print(f"   Email: {user.email}")
        print(f"   Staff: {'Sí' if user.is_staff else 'No'}")
        print(f"   Activo: {'Sí' if user.is_active else 'No'}")
        print(f"   Debe cambiar password: {'Sí' if user.must_change_password else 'No'}")
        
        social = UserSocialAuth.objects.filter(user=user, provider='google-oauth2').first()
        
        if social:
            print(f"\n✅ Cuenta de Google vinculada")
            print(f"   UID: {social.uid}")
            if '@' in social.uid:
                print(f"   ⚠️  PROBLEMA: El UID es un email (debería ser un ID numérico)")
                print(f"   📝 Solución: Desvincular y volver a vincular")
            else:
                print(f"   ✅ UID correcto (ID numérico)")
            print(f"   Email en Google: {social.extra_data.get('email', 'N/A')}")
        else:
            print(f"\n⚠️  No hay cuenta de Google vinculada")
            print(f"   📝 Acción: El usuario debe vincular desde el panel de configuración")
            
    except UserAccount.DoesNotExist:
        print(f"\n❌ Usuario con DNI {dni} no encontrado")


def eliminar_vinculacion(dni):
    """Elimina la vinculación de Google de un usuario"""
    print("\n" + "="*70)
    print(f"ELIMINAR VINCULACIÓN: {dni}")
    print("="*70)
    
    try:
        user = UserAccount.objects.get(dni=dni)
        social = UserSocialAuth.objects.filter(user=user, provider='google-oauth2')
        
        if social.exists():
            count = social.count()
            social.delete()
            print(f"\n✅ {count} vinculación(es) eliminada(s)")
            print(f"   El usuario {user.email} debe volver a vincular su cuenta")
        else:
            print(f"\n⚠️  El usuario no tiene vinculación de Google")
            
    except UserAccount.DoesNotExist:
        print(f"\n❌ Usuario con DNI {dni} no encontrado")


def estadisticas():
    """Muestra estadísticas generales"""
    print("\n" + "="*70)
    print("ESTADÍSTICAS")
    print("="*70)
    
    total_usuarios = UserAccount.objects.count()
    usuarios_con_google = UserSocialAuth.objects.filter(provider='google-oauth2').count()
    uids_incorrectos = UserSocialAuth.objects.filter(
        provider='google-oauth2', 
        uid__contains='@'
    ).count()
    
    print(f"\n📊 Total de usuarios: {total_usuarios}")
    print(f"🔗 Usuarios con Google vinculado: {usuarios_con_google}")
    print(f"⚠️  Vinculaciones con UID incorrecto: {uids_incorrectos}")
    
    if uids_incorrectos > 0:
        print(f"\n❌ ACCIÓN REQUERIDA:")
        print(f"   Hay {uids_incorrectos} vinculación(es) con UID incorrecto")
        print(f"   Ejecutar: python test_google_oauth.py listar")


def ayuda():
    """Muestra la ayuda"""
    print("\n" + "="*70)
    print("COMANDOS DISPONIBLES")
    print("="*70)
    print("""
Uso: python test_google_oauth.py [comando] [argumentos]

Comandos:
    listar                  - Lista todas las vinculaciones de Google
    verificar <dni>         - Verifica el estado de un usuario específico
    eliminar <dni>          - Elimina la vinculación de Google de un usuario
    estadisticas            - Muestra estadísticas generales
    ayuda                   - Muestra esta ayuda

Ejemplos:
    python test_google_oauth.py listar
    python test_google_oauth.py verificar 44464273
    python test_google_oauth.py eliminar 44464273
    python test_google_oauth.py estadisticas
    """)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("\n⚠️  Debes especificar un comando")
        ayuda()
        sys.exit(1)
    
    comando = sys.argv[1].lower()
    
    if comando == 'listar':
        listar_vinculaciones()
    elif comando == 'verificar':
        if len(sys.argv) < 3:
            print("\n❌ Debes especificar el DNI")
            print("Ejemplo: python test_google_oauth.py verificar 44464273")
        else:
            verificar_usuario(sys.argv[2])
    elif comando == 'eliminar':
        if len(sys.argv) < 3:
            print("\n❌ Debes especificar el DNI")
            print("Ejemplo: python test_google_oauth.py eliminar 44464273")
        else:
            confirmar = input(f"\n⚠️  ¿Estás seguro de eliminar la vinculación? (s/n): ")
            if confirmar.lower() == 's':
                eliminar_vinculacion(sys.argv[2])
            else:
                print("Operación cancelada")
    elif comando == 'estadisticas':
        estadisticas()
    elif comando == 'ayuda':
        ayuda()
    else:
        print(f"\n❌ Comando desconocido: {comando}")
        ayuda()
    
    print("\n" + "="*70 + "\n")
