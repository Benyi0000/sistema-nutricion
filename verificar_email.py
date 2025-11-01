#!/usr/bin/env python
"""
Script para verificar el estado de los emails enviados.
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.agenda.models import NotificationLog

# Buscar el último log para benjaminbenitez2003@gmail.com
log = NotificationLog.objects.filter(
    payload__destinatario='benjaminbenitez2003@gmail.com'
).order_by('-id').first()

if log:
    print("=" * 70)
    print("📧 ÚLTIMO EMAIL ENVIADO")
    print("=" * 70)
    print(f"Log ID: {log.id}")
    print(f"Email destino: {log.payload.get('destinatario')}")
    print(f"Template: {log.template}")
    print(f"Canal: {log.channel}")
    print(f"Enviado en: {log.sent_at}")
    print(f"Entregado: {'✅ SÍ' if log.delivered else '❌ NO'}")
    print(f"\nNombre paciente: {log.payload.get('nombre_paciente')}")
    print(f"Nutricionista: {log.payload.get('nombre_nutri')}")
    print(f"Fecha turno: {log.payload.get('fecha_hora_inicio')}")
    
    if log.delivered:
        print("\n✨ El email fue enviado exitosamente!")
        print("🔍 Revisa la bandeja de entrada de benjaminbenitez2003@gmail.com")
    else:
        print("\n⚠️  El email NO fue entregado")
        if log.sent_at:
            print("El log indica que se intentó enviar pero falló.")
        else:
            print("El email está pendiente de procesamiento por Celery.")
    print("=" * 70)
else:
    print("❌ No se encontró ningún email para benjaminbenitez2003@gmail.com")
