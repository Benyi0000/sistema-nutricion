#!/usr/bin/env python
"""
Script para limpiar y corregir la base de datos
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.users.models import User, Person, Patient

def fix_database():
    print("=" * 60)
    print("ARREGLANDO BASE DE DATOS")
    print("=" * 60)
    
    # 1. Arreglar el administrador
    print("\n1. Arreglando administrador...")
    try:
        admin = User.objects.get(dni='00000000')
        admin.is_superuser = True
        admin.is_staff = True
        admin.is_active = True
        admin.role = 'nutricionista'  # Los admins son nutricionistas también
        admin.save()
        print(f"   ✓ Admin corregido: {admin.dni} - {admin.email}")
    except User.DoesNotExist:
        print("   ✗ Admin no encontrado")
    
    # 2. Arreglar emails duplicados de nutricionistas
    print("\n2. Arreglando emails duplicados...")
    nutri_duplicados = User.objects.filter(email='nutri@nutrisalud.com', role='nutricionista')
    if nutri_duplicados.count() > 1:
        for i, nutri in enumerate(nutri_duplicados):
            if i > 0:  # Dejar el primero, cambiar los demás
                new_email = f"nutricionista{nutri.dni}@nutrisalud.com"
                print(f"   • Cambiando {nutri.dni}: {nutri.email} → {new_email}")
                nutri.email = new_email
                nutri.save()
        print(f"   ✓ {nutri_duplicados.count() - 1} nutricionistas actualizados")
    else:
        print("   ✓ No hay emails duplicados")
    
    # 3. Eliminar paciente con DNI problemático
    print("\n3. Limpiando pacientes problemáticos...")
    try:
        user_problema = User.objects.get(dni='12345679')
        print(f"   • Encontrado usuario con DNI 12345679: {user_problema.email}")
        if hasattr(user_problema, 'person'):
            if hasattr(user_problema.person, 'patient'):
                user_problema.person.patient.delete()
                print("   ✓ Paciente eliminado")
            user_problema.person.delete()
            print("   ✓ Person eliminado")
        user_problema.delete()
        print("   ✓ Usuario eliminado")
    except User.DoesNotExist:
        print("   ✓ DNI 12345679 no existe (OK)")
    
    # 4. Mostrar estado final
    print("\n" + "=" * 60)
    print("ESTADO FINAL DE LA BASE DE DATOS")
    print("=" * 60)
    
    print("\n📊 USUARIOS:")
    for user in User.objects.all().order_by('role', 'dni'):
        role_icon = "👑" if user.is_superuser else ("🥗" if user.role == 'nutricionista' else "👤")
        active_status = "✓" if user.is_active else "✗"
        print(f"   {role_icon} [{active_status}] {user.dni:10s} | {user.email:30s} | {user.role:15s}")
    
    print("\n📋 PACIENTES:")
    for patient in Patient.objects.all():
        nutri = patient.assigned_nutritionist
        nutri_name = f"{nutri.first_name} {nutri.last_name}" if nutri else "Sin asignar"
        print(f"   👤 {patient.person.user.dni:10s} | {patient.person.user.first_name} {patient.person.user.last_name:20s} | Nutricionista: {nutri_name}")
    
    print("\n" + "=" * 60)
    print("✅ BASE DE DATOS CORREGIDA")
    print("=" * 60)
    print("\nAhora puedes crear el paciente con DNI 12345679")
    print("Credenciales del admin: DNI 00000000, password: admin123")

if __name__ == '__main__':
    fix_database()


