from django.conf import settings

print("="*60)
print("CONFIGURACIÓN DE EMAIL")
print("="*60)
print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
print(f"EMAIL_FILE_PATH: {getattr(settings, 'EMAIL_FILE_PATH', 'NO CONFIGURADO')}")
print(f"DEFAULT_FROM_EMAIL: {getattr(settings, 'DEFAULT_FROM_EMAIL', 'NO CONFIGURADO')}")
print(f"DEBUG: {settings.DEBUG}")
print("="*60)
