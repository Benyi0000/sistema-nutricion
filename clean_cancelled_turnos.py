#!/usr/bin/env python
"""
Script para limpiar turnos cancelados que están bloqueando slots disponibles.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.agenda.models import Turno, TurnoState
from django.utils import timezone

print("\n" + "="*80)
print("LIMPIEZA DE TURNOS CANCELADOS")
print("="*80)

# Buscar todos los turnos cancelados
turnos_cancelados = Turno.objects.filter(
    state=TurnoState.CANCELADO
)

print(f"\nTotal de turnos CANCELADOS encontrados: {turnos_cancelados.count()}")

if turnos_cancelados.count() > 0:
    print("\nTurnos a eliminar:")
    for turno in turnos_cancelados:
        print(f"  - ID: {turno.id}, Slot: {turno.slot.lower} → {turno.slot.upper}, Estado: {turno.state}")
    
    confirm = input("\n¿Desea eliminar estos turnos cancelados? (s/n): ")
    
    if confirm.lower() == 's':
        count = turnos_cancelados.count()
        turnos_cancelados.delete()
        print(f"\n✅ {count} turnos cancelados eliminados exitosamente.")
    else:
        print("\n❌ Operación cancelada.")
else:
    print("\n✅ No hay turnos cancelados para limpiar.")

print("="*80)
