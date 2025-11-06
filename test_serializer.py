"""
Script para probar el serializer UserDetailSerializer
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.user.models import UserAccount
from apps.user.serializers import UserDetailSerializer

# Obtener el usuario paciente
user = UserAccount.objects.get(dni='13261481')

# Serializar
serializer = UserDetailSerializer(user)
data = serializer.data

print("=" * 70)
print("📊 DATOS DEL SERIALIZER UserDetailSerializer")
print("=" * 70)

for key, value in data.items():
    print(f"{key}: {value}")

print("\n" + "=" * 70)
print(f"✅ nutricionista_id: {data.get('nutricionista_id')}")
print("=" * 70)
