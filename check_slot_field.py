from apps.agenda.models import Turno

t = Turno.objects.get(id=40)

print("Turno ID 40:")
print(f"  start_time: {t.start_time}")
print(f"  end_time: {t.end_time}")
print(f"  slot: {t.slot}")
print(f"  slot type: {type(t.slot)}")

if t.slot:
    print(f"  slot.lower: {t.slot.lower}")
    print(f"  slot.upper: {t.slot.upper}")
else:
    print("  slot es NULL!")
