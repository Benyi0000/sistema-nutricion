import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.user.models import UserAccount, Nutricionista
from apps.agenda.models import ProfessionalSettings, DisponibilidadHoraria

# Buscar TODOS los nutricionistas
nutricionistas = Nutricionista.objects.all()
print(f"📋 Total de nutricionistas en el sistema: {nutricionistas.count()}\n")

for nutri in nutricionistas:
    user = nutri.user
    print(f"{'='*60}")
    print(f"Nutricionista ID: {nutri.id}")
    print(f"UserAccount ID: {user.id}")
    print(f"DNI: {user.dni}")
    print(f"Email: {user.email}")
    print(f"Nombre: {nutri.nombre} {nutri.apellido}")
    
    # Buscar configuración profesional (usa el perfil Nutricionista, no UserAccount)
    settings = ProfessionalSettings.objects.filter(nutricionista=nutri).first()
    if settings:
        print(f"✅ Tiene ProfessionalSettings (ID: {settings.id})")
        
        # Buscar disponibilidades (van directamente al nutricionista)
        disponibilidades = DisponibilidadHoraria.objects.filter(nutricionista=nutri)
        print(f"   Disponibilidades: {disponibilidades.count()}")
        
        if disponibilidades.exists():
            for disp in disponibilidades[:3]:  # Mostrar solo las primeras 3
                dias = {0: 'Lun', 1: 'Mar', 2: 'Mié', 3: 'Jue', 4: 'Vie', 5: 'Sáb', 6: 'Dom'}
                print(f"   - {dias[disp.dia_semana]}: {disp.hora_inicio}-{disp.hora_fin}")
    else:
        print(f"⚠️  NO tiene ProfessionalSettings")
    
    print()
