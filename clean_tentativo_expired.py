#!/usr/bin/env python
"""
Script para limpiar turnos TENTATIVO expirados y verificar turnos activos.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.agenda.models import Turno, TurnoState
from django.utils import timezone

print("\n" + "="*80)
print("TURNOS TENTATIVO (SOFT HOLD)")
print("="*80)

now = timezone.now()
print(f"Hora actual: {now}\n")

# Buscar todos los turnos TENTATIVO
turnos_tentativo = Turno.objects.filter(
    state=TurnoState.TENTATIVO
).order_by('-soft_hold_expires_at')

print(f"Total de turnos TENTATIVO: {turnos_tentativo.count()}\n")

activos = []
expirados = []

for turno in turnos_tentativo:
    if turno.soft_hold_expires_at and turno.soft_hold_expires_at > now:
        activos.append(turno)
    else:
        expirados.append(turno)

print(f"✅ ACTIVOS (no expirados): {len(activos)}")
for turno in activos:
    minutos_restantes = (turno.soft_hold_expires_at - now).total_seconds() / 60
    print(f"  - ID {turno.id}: {turno.slot.lower} → {turno.slot.upper}")
    print(f"    Expira en: {minutos_restantes:.1f} minutos")
    print(f"    Nutricionista: {turno.nutricionista_id}, Ubicación: {turno.ubicacion_id}")
    print()

print(f"\n❌ EXPIRADOS (deben ser limpiados): {len(expirados)}")
for turno in expirados:
    if turno.soft_hold_expires_at:
        minutos_pasados = (now - turno.soft_hold_expires_at).total_seconds() / 60
        print(f"  - ID {turno.id}: {turno.slot.lower} → {turno.slot.upper}")
        print(f"    Expirado hace: {minutos_pasados:.1f} minutos")
    else:
        print(f"  - ID {turno.id}: {turno.slot.lower} → {turno.slot.upper}")
        print(f"    SIN soft_hold_expires_at (error)")
    print()

if expirados:
    print("="*80)
    confirm = input(f"¿Desea eliminar los {len(expirados)} turnos TENTATIVO expirados? (s/n): ")
    
    if confirm.lower() == 's':
        for turno in expirados:
            turno_id = turno.id
            turno.delete()
            print(f"  ✅ Turno {turno_id} eliminado")
        print(f"\n✅ {len(expirados)} turnos TENTATIVO expirados eliminados.")
    else:
        print("\n❌ Operación cancelada.")
else:
    print("\n✅ No hay turnos TENTATIVO expirados para limpiar.")

print("="*80)
