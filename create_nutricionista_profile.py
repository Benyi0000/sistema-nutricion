#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.user.models import UserAccount, Nutricionista

# Obtener el usuario
user = UserAccount.objects.get(email='benjaminbenitez55@gmail.com')
print(f"Usuario: {user.email} (ID: {user.id})")

# Verificar si ya tiene perfil
try:
    nutri = user.nutricionista
    print(f"❌ Este usuario YA tiene perfil de nutricionista (ID: {nutri.id})")
except Nutricionista.DoesNotExist:
    # Crear perfil de nutricionista
    nutri = Nutricionista.objects.create(
        user=user,
        matricula_profesional="MP-12345",  # Puedes cambiarlo después
        especialidad="Nutrición General",
        telefono=user.dni,  # Usar el DNI como teléfono temporal
        direccion="Dirección ejemplo"
    )
    print(f"✅ Perfil de Nutricionista creado exitosamente!")
    print(f"   ID Nutricionista: {nutri.id}")
    print(f"   Matrícula: {nutri.matricula_profesional}")
    print(f"\n📌 Ahora puedes acceder a la configuración de agenda!")
