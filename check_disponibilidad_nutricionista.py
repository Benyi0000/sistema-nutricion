import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.user.models import UserAccount
from apps.agenda.models import ProfessionalSettings, DisponibilidadHoraria

# Buscar nutricionista con ID 1
try:
    user = UserAccount.objects.get(id=1)
    print(f"✅ Usuario encontrado: {user.dni} - {user.email}")
    
    if hasattr(user, 'nutricionista'):
        print(f"✅ Usuario tiene perfil de Nutricionista (ID: {user.nutricionista.id})")
        
        # Buscar configuración profesional
        settings = ProfessionalSettings.objects.filter(nutricionista=user).first()
        if settings:
            print(f"✅ Configuración profesional encontrada (ID: {settings.id})")
            print(f"   - Duración por defecto: {settings.duracion_default_minutos} min")
            print(f"   - Anticipación mínima: {settings.anticipacion_minima_horas}h")
            print(f"   - Anticipación máxima: {settings.anticipacion_maxima_dias} días")
            
            # Buscar disponibilidades
            disponibilidades = DisponibilidadHoraria.objects.filter(professional_settings=settings)
            print(f"\n📅 Disponibilidades configuradas: {disponibilidades.count()}")
            
            if disponibilidades.exists():
                for disp in disponibilidades:
                    dias = {0: 'Lun', 1: 'Mar', 2: 'Mié', 3: 'Jue', 4: 'Vie', 5: 'Sáb', 6: 'Dom'}
                    print(f"   - {dias[disp.dia_semana]}: {disp.hora_inicio} - {disp.hora_fin}")
                    print(f"     Vigencia: {disp.fecha_inicio} → {disp.fecha_fin}")
            else:
                print("⚠️  NO HAY DISPONIBILIDADES CONFIGURADAS")
                print("   El nutricionista necesita configurar sus horarios disponibles.")
        else:
            print("⚠️  NO HAY CONFIGURACIÓN PROFESIONAL")
            print("   Se necesita crear ProfessionalSettings para este nutricionista.")
    else:
        print("❌ El usuario NO tiene perfil de Nutricionista")
        
except UserAccount.DoesNotExist:
    print("❌ No se encontró usuario con ID 1")
