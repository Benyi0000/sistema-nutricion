#!/usr/bin/env python
"""
Script para crear disponibilidad de prueba para el nutricionista.
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.utils import timezone
from datetime import time, datetime, timedelta
from apps.user.models import Nutricionista
from apps.agenda.models import DisponibilidadHoraria, Ubicacion

def crear_disponibilidad():
    """
    Crea disponibilidad para el nutricionista hoy o mañana.
    """
    print("=" * 70)
    print("📅 CREANDO DISPONIBILIDAD DE PRUEBA")
    print("=" * 70)
    
    # Obtener nutricionista y ubicación
    nutri = Nutricionista.objects.first()
    if not nutri:
        print("❌ No hay nutricionistas")
        return
    
    ubicacion = Ubicacion.objects.filter(nutricionista=nutri).first()
    if not ubicacion:
        print("❌ No hay ubicaciones")
        return
    
    print(f"\n👤 Nutricionista: {nutri.full_name}")
    print(f"📍 Ubicación: {ubicacion.nombre}")
    
    # Obtener el día de hoy
    hoy = timezone.now().date()
    dia_semana = hoy.weekday()  # 0=Lunes, 6=Domingo
    
    print(f"📆 Día de hoy: {hoy} ({DisponibilidadHoraria.DiaSemana(dia_semana).label})")
    
    # Verificar si ya existe disponibilidad para hoy
    disp_existente = DisponibilidadHoraria.objects.filter(
        nutricionista=nutri,
        ubicacion=ubicacion,
        dia_semana=dia_semana
    ).first()
    
    if disp_existente:
        print(f"\n✅ Ya existe disponibilidad para hoy:")
        print(f"   {disp_existente.hora_inicio} - {disp_existente.hora_fin}")
        return
    
    # Crear disponibilidad de 14:00 a 18:00 para hoy
    hora_actual = timezone.now().time()
    
    # Si ya pasaron las 14:00, crear disponibilidad para mañana
    if hora_actual >= time(14, 0):
        # Crear para mañana
        manana = hoy + timedelta(days=1)
        dia_semana_crear = manana.weekday()
        print(f"\n⏰ Ya pasaron las 14:00, creando disponibilidad para mañana:")
        print(f"   {manana} ({DisponibilidadHoraria.DiaSemana(dia_semana_crear).label})")
    else:
        dia_semana_crear = dia_semana
        print(f"\n⏰ Creando disponibilidad para hoy:")
    
    # Crear la disponibilidad
    disp = DisponibilidadHoraria.objects.create(
        nutricionista=nutri,
        ubicacion=ubicacion,
        dia_semana=dia_semana_crear,
        hora_inicio=time(14, 0),
        hora_fin=time(18, 0),
        slot_minutes=30
    )
    
    print(f"\n✅ Disponibilidad creada:")
    print(f"   Día: {disp.get_dia_semana_display()}")
    print(f"   Horario: {disp.hora_inicio} - {disp.hora_fin}")
    print(f"   Duración de slots: {disp.slot_minutes} minutos")
    print(f"   Ubicación: {ubicacion.nombre}")
    print("\n" + "=" * 70)

if __name__ == '__main__':
    crear_disponibilidad()
