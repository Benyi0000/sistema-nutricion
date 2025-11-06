from django.core.mail import send_mail
from django.conf import settings
import os

print("="*60)
print("TEST DE ENVÍO DE EMAIL")
print("="*60)
print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
print(f"EMAIL_FILE_PATH: {settings.EMAIL_FILE_PATH}")
print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
print("="*60)

try:
    result = send_mail(
        subject='Test Email',
        message='Este es un email de prueba.',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=['test@example.com'],
        fail_silently=False,
    )
    print(f"\n✅ Email enviado exitosamente. Result: {result}")
    print(f"\n📁 Verifica la carpeta: {settings.EMAIL_FILE_PATH}")
    
    # Listar archivos
    if os.path.exists(settings.EMAIL_FILE_PATH):
        files = os.listdir(settings.EMAIL_FILE_PATH)
        print(f"\nArchivos en sent_emails: {len(files)}")
        for f in files:
            print(f"  - {f}")
    else:
        print("\n⚠️  La carpeta sent_emails no existe aún")
        
except Exception as e:
    print(f"\n❌ Error al enviar email: {e}")
