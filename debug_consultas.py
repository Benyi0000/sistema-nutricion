#!/usr/bin/env python
import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.user.models import Paciente, Consulta, UserAccount

# Verificar nombre de la tabla
print("\n=== Información del modelo Consulta ===")
print(f"Tabla: {Consulta._meta.db_table}")
print(f"App label: {Consulta._meta.app_label}")

# Consulta SQL directa
print("\n=== Verificando tabla user_consulta ===")
with connection.cursor() as cursor:
    # Verificar si la tabla existe
    cursor.execute("""
        SELECT tablename FROM pg_catalog.pg_tables 
        WHERE schemaname = 'public' AND tablename LIKE '%consulta%';
    """)
    tablas = cursor.fetchall()
    print(f"Tablas que contienen 'consulta': {tablas}")
    
    # Contar registros
    try:
        cursor.execute("SELECT COUNT(*) FROM user_consulta;")
        count = cursor.fetchone()[0]
        print(f"\nTotal registros en user_consulta: {count}")
    except Exception as e:
        print(f"Error al consultar user_consulta: {e}")
    
    # Si hay registros, mostrar algunos
    if count > 0:
        cursor.execute("""
            SELECT id, paciente_id, nutricionista_id, tipo, fecha 
            FROM user_consulta 
            ORDER BY fecha DESC 
            LIMIT 10;
        """)
        consultas = cursor.fetchall()
        print("\nÚltimas 10 consultas:")
        for c in consultas:
            print(f"  ID: {c[0]}, Paciente: {c[1]}, Nutricionista: {c[2]}, Tipo: {c[3]}, Fecha: {c[4]}")
        
        # Buscar consultas del paciente ID=2
        cursor.execute("""
            SELECT id, tipo, fecha, plantilla_usada_id
            FROM user_consulta 
            WHERE paciente_id = 2
            ORDER BY fecha DESC;
        """)
        consultas_pac2 = cursor.fetchall()
        print(f"\nConsultas del paciente ID=2 (DNI 13261481): {len(consultas_pac2)}")
        for c in consultas_pac2:
            print(f"  ID: {c[0]}, Tipo: {c[1]}, Fecha: {c[2]}, Plantilla: {c[3]}")

# Verificar con ORM
print("\n=== Verificación con Django ORM ===")
total_orm = Consulta.objects.count()
print(f"Total consultas (ORM): {total_orm}")

if total_orm > 0:
    print("\nÚltimas 5 consultas (ORM):")
    for c in Consulta.objects.all().order_by('-fecha')[:5]:
        print(f"  ID: {c.id}, Paciente: {c.paciente_id}, Tipo: {c.tipo}, Fecha: {c.fecha}")

# Verificar paciente
print("\n=== Verificación del paciente ===")
user = UserAccount.objects.filter(dni='13261481').first()
if user:
    paciente = getattr(user, 'paciente', None)
    if paciente:
        print(f"Paciente ID: {paciente.id}")
        print(f"Nombre: {paciente.nombre} {paciente.apellido}")
        
        # Consultas relacionadas
        consultas_rel = paciente.consultas.all()
        print(f"Consultas (related): {consultas_rel.count()}")
        for c in consultas_rel:
            print(f"  - ID: {c.id}, Tipo: {c.tipo}, Fecha: {c.fecha}")
