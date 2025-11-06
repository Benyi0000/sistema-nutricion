from django.test import RequestFactory
from apps.agenda.views import PublicTurnoCreateView
from apps.user.models import Nutricionista
from apps.agenda.models import Ubicacion, TipoConsultaConfig, Turno, NotificationLog
from datetime import datetime
import zoneinfo
import json

# Crear request factory
factory = RequestFactory()

# Datos del turno
data = {
    "nutricionista_id": 1,
    "ubicacion_id": 1,
    "tipo_consulta_id": 1,
    "start_time": "2025-11-24T14:00:00-03:00",  # 24 nov 14:00 Argentina
    "end_time": "2025-11-24T14:45:00-03:00",
    "paciente_nombre": "Test Celery",
    "paciente_email": "test@celery.com",
    "paciente_telefono": "+5493512345678"
}

print("="*60)
print("CREANDO TURNO VIA API PUBLICA")
print("="*60)
print(f"Data: {json.dumps(data, indent=2)}")

# Crear request POST
request = factory.post(
    '/api/public/agenda/turnos/',
    data=json.dumps(data),
    content_type='application/json'
)

# Instanciar view
view = PublicTurnoCreateView.as_view()

try:
    response = view(request)
    print(f"\nResponse status: {response.status_code}")
    
    if response.status_code == 201:
        print("✓ Turno creado exitosamente")
        
        # Ver el turno creado
        ultimo_turno = Turno.objects.latest('id')
        print(f"\nTurno ID: {ultimo_turno.id}")
        print(f"  Estado: {ultimo_turno.state}")
        print(f"  Horario: {ultimo_turno.start_time}")
        print(f"  Expira: {ultimo_turno.soft_hold_expires_at}")
        
        # Ver NotificationLog
        logs = NotificationLog.objects.filter(turno=ultimo_turno)
        print(f"\nNotificationLogs creados: {logs.count()}")
        for log in logs:
            print(f"  ID {log.id}: delivered={log.delivered}, channel={log.channel}")
    else:
        print(f"✗ Error: {response.status_code}")
        if hasattr(response, 'data'):
            print(f"  Data: {response.data}")
            
except Exception as e:
    print(f"✗ Exception: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
print("VERIFICANDO EMAILS ENVIADOS")
print("="*60)

import os
sent_emails_dir = "sent_emails"
if os.path.exists(sent_emails_dir):
    files = os.listdir(sent_emails_dir)
    print(f"Archivos en sent_emails/: {len(files)}")
    for f in sorted(files)[-3:]:  # Ultimos 3
        print(f"  - {f}")
else:
    print("Carpeta sent_emails/ no existe")
