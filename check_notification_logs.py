from apps.agenda.models import NotificationLog

logs = NotificationLog.objects.all().order_by('-sent_at')[:10]

print("="*60)
print("ULTIMOS 10 NOTIFICATION LOGS")
print("="*60)

for l in logs:
    print(f"\nID {l.id}:")
    print(f"  Turno ID: {l.turno_id}")
    print(f"  Canal: {l.channel}")
    print(f"  Template: {l.template}")
    if l.paciente:
        print(f"  Paciente: {l.paciente.email}")
    print(f"  Delivered: {l.delivered}")
    print(f"  Sent at: {l.sent_at}")
    if l.delivery_meta:
        print(f"  Meta: {l.delivery_meta}")
