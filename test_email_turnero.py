#!/usr/bin/env python
"""
Script para enviar un email de prueba usando el sistema de notificaciones del turnero.
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.utils import timezone
from apps.agenda.models import NotificationLog, NotificationChannel
from apps.agenda.tasks import send_notification_email

def test_email():
    """
    Crea un NotificationLog de prueba y lo procesa.
    """
    print("=" * 60)
    print("📧 TEST DE EMAIL DEL SISTEMA DE TURNERO")
    print("=" * 60)
    
    # Crear un NotificationLog de prueba
    test_payload = {
        'destinatario': 'benjaminbenitez2003@gmail.com',
        'nombre_paciente': 'Benjamin Benitez (Prueba)',
        'nombre_nutri': 'Sistema de Nutrición',
        'tipo_consulta': 'Consulta de Prueba',
        'fecha_hora_inicio': timezone.now().strftime('%d/%m/%Y %H:%M'),
        'ubicacion_nombre': 'Consultorio de Pruebas',
        'email_paciente': 'benjaminbenitez2003@gmail.com',
        'telefono_paciente': '+54 9 11 1234-5678',
    }
    
    print("\n📝 Creando NotificationLog de prueba...")
    print(f"   Destinatario: {test_payload['destinatario']}")
    print(f"   Template: public_booking_confirmed_paciente")
    
    log = NotificationLog.objects.create(
        channel=NotificationChannel.EMAIL,
        template='public_booking_confirmed_paciente',
        payload=test_payload,
        turno=None,  # Sin turno para esta prueba
        paciente=None,  # Sin paciente registrado
        profesional=None,  # Sin nutricionista específico
    )
    
    print(f"   ✅ NotificationLog creado con ID: {log.id}")
    
    # Procesar el email (esto lo haría Celery normalmente)
    print("\n📤 Procesando el email...")
    
    try:
        # Ejecutar la tarea de forma síncrona (sin Celery)
        send_notification_email(log.id)
        
        # Verificar el resultado
        log.refresh_from_db()
        
        print("\n" + "=" * 60)
        print("📊 RESULTADO:")
        print("=" * 60)
        print(f"   Estado: {'✅ ENVIADO' if log.delivered else '❌ FALLIDO'}")
        print(f"   Enviado en: {log.sent_at}")
        print(f"   Template: {log.template}")
        print(f"   Destinatario: {test_payload['destinatario']}")
        
        if log.delivered:
            print("\n✨ Email enviado exitosamente!")
            print("\n📁 En modo DEBUG, el email se guardó en:")
            print(f"   {os.path.join(os.getcwd(), 'sent_emails')}")
            print("\n💡 Verifica la carpeta 'sent_emails' para ver el contenido del email.")
        else:
            print("\n⚠️  El email NO se envió. Revisa los logs para más detalles.")
        
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ ERROR al procesar el email: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_email()
