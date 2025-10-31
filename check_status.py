from apps.agenda.models import Turno, NotificationLog

print("="*60)
print("ESTADO ACTUAL")
print("="*60)
print(f"Total turnos: {Turno.objects.count()}")
print(f"Total logs: {NotificationLog.objects.count()}")

if Turno.objects.exists():
    ultimo_turno = Turno.objects.latest('id')
    print(f"\nUltimo turno:")
    print(f"  ID: {ultimo_turno.id}")
    print(f"  Hora: {ultimo_turno.start_time}")
    print(f"  Estado: {ultimo_turno.state}")

if NotificationLog.objects.exists():
    ultimo_log = NotificationLog.objects.latest('id')
    print(f"\nUltimo log:")
    print(f"  ID: {ultimo_log.id}")
    print(f"  Turno: {ultimo_log.turno_id}")
    print(f"  Delivered: {ultimo_log.delivered}")
    print(f"  Sent at: {ultimo_log.sent_at}")
