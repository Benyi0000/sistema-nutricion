#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.user.models import UserAccount, Nutricionista

# Listar todos los usuarios
print("📋 Usuarios en la base de datos:")
users = UserAccount.objects.all()
for u in users:
    has_nutri = hasattr(u, 'nutricionista')
    try:
        u.nutricionista
        status = "✅ SÍ es nutricionista"
    except Nutricionista.DoesNotExist:
        status = "❌ NO es nutricionista"
    print(f"   - {u.email} (ID: {u.id}) - {status}")
