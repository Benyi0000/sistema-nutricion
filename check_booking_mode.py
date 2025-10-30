# check_booking_mode.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.user.models import Nutricionista
from apps.agenda.models import ProfessionalSettings

print("\n=== Nutricionistas y sus configuraciones de booking ===\n")

nutricionistas = Nutricionista.objects.all()

for nutri in nutricionistas:
    print(f"ID: {nutri.id}")
    print(f"Nombre: {nutri.nombre} {nutri.apellido}")
    print(f"DNI: {nutri.user.dni}")
    print(f"Email: {nutri.user.email}")
    
    # Obtener o crear ProfessionalSettings
    settings, created = ProfessionalSettings.objects.get_or_create(
        nutricionista=nutri,
        defaults={
            'booking_mode': 'PUBLICO',  # Por defecto PUBLICO
            'buffer_before_min': 0,
            'buffer_after_min': 0,
        }
    )
    
    if created:
        print(f"✅ ProfessionalSettings creado con booking_mode=PUBLICO")
    else:
        print(f"Booking mode actual: {settings.booking_mode}")
        if settings.booking_mode != 'PUBLICO':
            print(f"⚠️  Cambiando a PUBLICO...")
            settings.booking_mode = 'PUBLICO'
            settings.save()
            print(f"✅ Actualizado a PUBLICO")
    
    print("-" * 50)

print("\n✅ Verificación completada\n")
