import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.user.models import UserAccount, Paciente

# Buscar usuario con DNI 13261481
dni = '13261481'
u = UserAccount.objects.filter(dni=dni).first()

if not u:
    print(f"❌ Usuario con DNI {dni} no encontrado")
else:
    print("=" * 50)
    print(f"✅ Usuario encontrado:")
    print(f"   DNI: {u.dni}")
    print(f"   Email: {u.email}")
    
    # Buscar perfil de paciente
    p = Paciente.objects.filter(user=u).first()
    
    if p:
        print(f"   Perfil Paciente: Sí (ID: {p.id})")
        if p.fecha_nacimiento:
            print(f"   Fecha nacimiento: {p.fecha_nacimiento}")
            # Calcular contraseña con fecha
            ddmm = p.fecha_nacimiento.strftime("%d%m")
            password = f"{u.dni}{ddmm}"
        else:
            print(f"   Fecha nacimiento: No registrada")
            # Calcular contraseña sin fecha
            password = f"{u.dni}salud"
    else:
        print(f"   Perfil Paciente: No")
        password = f"{u.dni}salud"
    
    print()
    print("🔑" * 25)
    print(f"   CONTRASEÑA GENERADA: {password}")
    print("🔑" * 25)
