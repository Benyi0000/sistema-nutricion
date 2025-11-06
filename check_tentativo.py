#!/usr/bin/env python
"""
Script para verificar y limpiar turnos TENTATIVO expirados.
Ejecutar con: python manage.py shell < check_tentativo.py
"""
from apps.agenda.models import Turno, TurnoState
from django.utils import timezone

now = timezone.now()
print("\n" + "="*80)
print("VERIFICACIÓN DE TURNOS TENTATIVO")
print("="*80)
print(f"\nHora actual: {now}\n")

# Buscar turnos TENTATIVO
tentativo = Turno.objects.filter(state=TurnoState.TENTATIVO).order_by('-created_at')
print(f"Total de turnos TENTATIVO: {tentativo.count()}\n")

activos = []
expirados = []

for t in tentativo:
    print(f"Turno ID {t.id}:")
    print(f"  Slot: {t.slot.lower} → {t.slot.upper}")
    print(f"  Nutricionista: {t.nutricionista_id}, Ubicación: {t.ubicacion_id}")
    print(f"  Creado: {t.created_at}")
    
    if t.soft_hold_expires_at:
        if t.soft_hold_expires_at > now:
            mins = (t.soft_hold_expires_at - now).total_seconds() / 60
            print(f"  ✅ ACTIVO - Expira en {mins:.1f} minutos")
            activos.append(t)
        else:
            mins = (now - t.soft_hold_expires_at).total_seconds() / 60
            print(f"  ❌ EXPIRADO - Hace {mins:.1f} minutos")
            expirados.append(t)
    else:
        print(f"  ⚠️  SIN fecha de expiración")
        expirados.append(t)
    print()

print("="*80)
print(f"Resumen: {len(activos)} activos, {len(expirados)} expirados")
print("="*80)

if expirados:
    print(f"\nEliminando {len(expirados)} turnos expirados...")
    for t in expirados:
        print(f"  Eliminando Turno ID {t.id}...")
        t.delete()
    print(f"✅ {len(expirados)} turnos eliminados exitosamente.")
else:
    print("\n✅ No hay turnos expirados para limpiar.")
