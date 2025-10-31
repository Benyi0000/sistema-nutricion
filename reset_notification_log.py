# Script para resetear un NotificationLog y reenviarlo
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.agenda.models import NotificationLog
from apps.agenda.tasks import send_notification_email

# Resetear el log 13
try:
    log = NotificationLog.objects.get(id=13)
    log.sent_at = None
    log.delivered = False
    log.save()
    print(f"✅ Log {log.id} reseteado")
    
    # Reenviarlo
    send_notification_email.delay(log.id)
    print(f"📧 Tarea de envío programada para Log {log.id}")
except NotificationLog.DoesNotExist:
    print("❌ Log 13 no existe")
