#!/usr/bin/env python
"""
Script para hacer una reserva de turno a través del API público del turnero.
"""

import os
import django
import requests
import json
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.utils import timezone
from apps.user.models import Nutricionista

# Configuración
BASE_URL = "http://localhost:8000"
API_PUBLIC = f"{BASE_URL}/api/public/agenda"

def reservar_turno():
    """
    Hace una reserva completa a través del API público del turnero.
    """
    print("=" * 70)
    print("🎯 RESERVA DE TURNO PÚBLICO - TEST DE EMAIL")
    print("=" * 70)
    
    # 1. Obtener un nutricionista
    print("\n📋 Paso 1: Obteniendo nutricionista...")
    nutri = Nutricionista.objects.first()
    if not nutri:
        print("❌ No hay nutricionistas en el sistema")
        return
    
    print(f"   ✅ Nutricionista: {nutri.full_name} (ID: {nutri.id})")
    
    # 2. Obtener ubicaciones
    print("\n📍 Paso 2: Obteniendo ubicaciones...")
    response = requests.get(f"{API_PUBLIC}/ubicaciones/", params={"nutricionista": nutri.id})
    
    if response.status_code != 200:
        print(f"   ❌ Error al obtener ubicaciones: {response.status_code}")
        print(f"   {response.text}")
        return
    
    ubicaciones = response.json()
    if not ubicaciones:
        print("   ❌ No hay ubicaciones disponibles")
        return
    
    # Buscar la ubicación con ID=1 (Consultorio principal)
    ubicacion = next((u for u in ubicaciones if u['id'] == 1), ubicaciones[0])
    print(f"   ✅ Ubicación: {ubicacion['nombre']} (ID: {ubicacion['id']})")
    
    # 3. Obtener tipos de consulta
    print("\n📝 Paso 3: Obteniendo tipos de consulta...")
    response = requests.get(f"{API_PUBLIC}/tipos-consulta/", params={"nutricionista": nutri.id})
    
    if response.status_code != 200:
        print(f"   ❌ Error al obtener tipos de consulta: {response.status_code}")
        print(f"   {response.text}")
        return
    
    tipos = response.json()
    if not tipos:
        print("   ❌ No hay tipos de consulta disponibles")
        return
    
    tipo_consulta = tipos[0]
    print(f"   ✅ Tipo: {tipo_consulta['tipo_display']} (ID: {tipo_consulta['id']})")
    
    # 4. Buscar slots disponibles
    print("\n🕐 Paso 4: Buscando slots disponibles...")
    
    # Buscar slots para los próximos 7 días
    start_date = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = start_date + timedelta(days=7)
    
    params = {
        "nutricionista_id": nutri.id,
        "ubicacion_id": ubicacion['id'],
        "tipo_consulta_id": tipo_consulta['id'],
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
    }
    
    response = requests.get(f"{API_PUBLIC}/slots/", params=params)
    
    if response.status_code != 200:
        print(f"   ❌ Error al obtener slots: {response.status_code}")
        print(f"   {response.text}")
        return
    
    slots = response.json()
    
    print(f"   📊 Slots encontrados: {len(slots)}")
    
    if not slots or len(slots) == 0:
        print("   ❌ No hay slots disponibles en los próximos 7 días")
        return
    
    # Tomar el primer slot disponible
    slot = slots[0]
    print(f"   ✅ Slot seleccionado: {slot['inicio']}")
    
    # 5. Crear la reserva
    print("\n📧 Paso 5: Creando reserva de turno...")
    
    # Calcular end_time basado en la duración del tipo de consulta (45 minutos según el slot)
    from dateutil.parser import parse as parse_datetime
    start_dt = parse_datetime(slot['inicio'])
    end_dt = parse_datetime(slot['fin'])
    
    turno_data = {
        "nutricionista": nutri.id,
        "ubicacion": ubicacion['id'],
        "tipo_consulta": tipo_consulta['id'],
        "start_time": slot['inicio'],
        "end_time": slot['fin'],
        "nombre_completo": "Benjamin Benitez",
        "email": "benjaminbenitez2003@gmail.com",
        "telefono": "+54 9 11 1234-5678",
    }
    
    print(f"   📤 Enviando datos:")
    print(f"      Email: {turno_data['email']}")
    print(f"      Fecha: {slot['inicio']}")
    
    response = requests.post(
        f"{API_PUBLIC}/turnos/",
        json=turno_data,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code != 201:
        print(f"   ❌ Error al crear turno: {response.status_code}")
        print(f"   {response.text}")
        return
    
    turno_creado = response.json()
    
    print("\n" + "=" * 70)
    print("✨ ¡TURNO CREADO EXITOSAMENTE!")
    print("=" * 70)
    print(f"📅 Turno ID: {turno_creado.get('id')}")
    print(f"📍 Ubicación: {ubicacion['nombre']}")
    print(f"📝 Tipo: {tipo_consulta['tipo_display']}")
    print(f"🕐 Fecha: {slot['inicio']}")
    print(f"📧 Email: benjaminbenitez2003@gmail.com")
    print(f"⏰ Estado: TENTATIVO (esperando confirmación)")
    print("\n💌 Se ha enviado un email de verificación!")
    print("\n📁 En modo DEBUG, revisa la carpeta 'sent_emails' para ver el email.")
    print("=" * 70)

if __name__ == '__main__':
    try:
        reservar_turno()
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
