#!/usr/bin/env python
"""
Script para verificar turnos que están causando conflictos de solapamiento.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.agenda.models import Turno, TurnoState
from django.utils import timezone
from psycopg.types.range import Range

print("\n" + "="*80)
print("TURNOS EXISTENTES PARA NUTRICIONISTA 1, UBICACION 1")
print("="*80)

# Buscar turnos del 3 de noviembre 2025
turnos = Turno.objects.filter(
    nutricionista_id=1,
    ubicacion_id=1,
    slot__overlap=Range('2025-11-03 13:00:00+00', '2025-11-03 16:00:00+00', bounds='[)')
).order_by('slot')

now = timezone.now()
print(f"\nHora actual: {now}")
print(f"Total de turnos encontrados: {turnos.count()}\n")

for turno in turnos:
    print(f"ID: {turno.id}")
    print(f"  Estado: {turno.state}")
    print(f"  Slot: {turno.slot.lower} → {turno.slot.upper}")
    print(f"  Slot (ISO): {turno.slot.lower.isoformat()} → {turno.slot.upper.isoformat()}")
    
    if turno.state == TurnoState.TENTATIVO:
        print(f"  Soft Hold Expira: {turno.soft_hold_expires_at}")
        if turno.soft_hold_expires_at:
            if turno.soft_hold_expires_at > now:
                print(f"  ⚠️  ACTIVO (expira en {(turno.soft_hold_expires_at - now).total_seconds()/60:.1f} minutos)")
            else:
                print(f"  ✅ EXPIRADO (hace {(now - turno.soft_hold_expires_at).total_seconds()/60:.1f} minutos)")
    
    print(f"  Tipo Consulta: {turno.tipo_consulta}")
    if turno.tipo_consulta:
        print(f"    Buffer Antes: {turno.tipo_consulta.buffer_before_min} min")
        print(f"    Buffer Después: {turno.tipo_consulta.buffer_after_min} min")
    
    email = turno.intake_answers.get('email', 'N/A') if turno.intake_answers else 'N/A'
    print(f"  Paciente Email: {email}")
    print(f"  Created: {turno.created_at}")
    print()

print("="*80)
print("SLOTS INTENTADOS RESERVAR (según log):")
print("="*80)
print("Slot 1: 2025-11-03 14:00:00+00 → 2025-11-03 14:45:00+00 (45 min)")
print("Conflicto con: 2025-11-03 14:15:00+00 → 2025-11-03 15:00:00+00 (45 min)")
print("\n⚠️  Solapamiento: 14:15 - 14:45 (30 minutos de conflicto)")
print("="*80)
