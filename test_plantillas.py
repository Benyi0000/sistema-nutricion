"""
Script de prueba para el sistema de plantillas.
Crea plantillas de ejemplo y verifica el funcionamiento.
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.user.models import (
    Nutricionista, PlantillaConsulta, PlantillaPregunta,
    Pregunta, TipoPregunta, TipoConsulta
)

def crear_preguntas_sistema():
    """Crea preguntas del sistema (owner=None) si no existen"""
    preguntas_base = [
        {
            'texto': '¿Cuál es tu peso actual?',
            'tipo': TipoPregunta.DECIMAL,
            'codigo': 'peso',
            'unidad': 'kg',
            'requerido': True,
            'es_inicial': True,
            'orden': 1,
        },
        {
            'texto': '¿Cuál es tu altura?',
            'tipo': TipoPregunta.DECIMAL,
            'codigo': 'altura',
            'unidad': 'cm',
            'requerido': True,
            'es_inicial': True,
            'orden': 2,
        },
        {
            'texto': '¿Tienes alguna alergia alimentaria?',
            'tipo': TipoPregunta.TEXTO,
            'codigo': 'alergias',
            'requerido': False,
            'es_inicial': True,
            'orden': 3,
        },
        {
            'texto': '¿Realizas actividad física?',
            'tipo': TipoPregunta.OPCION_UNICA,
            'codigo': 'actividad_fisica',
            'opciones': [
                {'valor': 'sedentario', 'etiqueta': 'Sedentario (poco o nada)'},
                {'valor': 'ligero', 'etiqueta': 'Ligero (1-3 días/semana)'},
                {'valor': 'moderado', 'etiqueta': 'Moderado (3-5 días/semana)'},
                {'valor': 'intenso', 'etiqueta': 'Intenso (6-7 días/semana)'},
            ],
            'requerido': True,
            'es_inicial': True,
            'orden': 4,
        },
    ]
    
    preguntas_creadas = []
    for p_data in preguntas_base:
        pregunta, created = Pregunta.objects.get_or_create(
            owner=None,
            codigo=p_data['codigo'],
            defaults=p_data
        )
        if created:
            print(f"✅ Pregunta creada: {pregunta.texto}")
        else:
            print(f"ℹ️  Pregunta ya existe: {pregunta.texto}")
        preguntas_creadas.append(pregunta)
    
    return preguntas_creadas


def crear_plantilla_sistema():
    """Crea una plantilla del sistema para consulta inicial"""
    # Verificar si ya existe
    if PlantillaConsulta.objects.filter(owner=None, nombre='Consulta Inicial Estándar').exists():
        print("ℹ️  Plantilla del sistema ya existe")
        return PlantillaConsulta.objects.get(owner=None, nombre='Consulta Inicial Estándar')
    
    # Crear plantilla
    plantilla = PlantillaConsulta.objects.create(
        owner=None,
        nombre='Consulta Inicial Estándar',
        descripcion='Plantilla predeterminada del sistema para consultas iniciales',
        tipo_consulta=TipoConsulta.INICIAL,
        es_predeterminada=True,
        activo=True,
        config={
            'calcular_imc': True,
            'mostrar_graficos': True,
        }
    )
    print(f"✅ Plantilla del sistema creada: {plantilla.nombre}")
    
    # Agregar preguntas
    preguntas = Pregunta.objects.filter(owner=None, es_inicial=True).order_by('orden')
    for i, pregunta in enumerate(preguntas):
        PlantillaPregunta.objects.create(
            plantilla=plantilla,
            pregunta=pregunta,
            orden=i,
            requerido_en_plantilla=pregunta.requerido,
            visible=True,
        )
        print(f"   ➕ Pregunta agregada: {pregunta.texto}")
    
    return plantilla


def probar_duplicar_plantilla():
    """Prueba la función de duplicar plantilla"""
    plantilla_original = PlantillaConsulta.objects.filter(
        owner=None, 
        nombre='Consulta Inicial Estándar'
    ).first()
    
    if not plantilla_original:
        print("❌ No se encontró la plantilla original")
        return
    
    # Obtener un nutricionista para duplicar
    nutri = Nutricionista.objects.first()
    if not nutri:
        print("❌ No hay nutricionistas en el sistema")
        return
    
    # Duplicar
    nueva_plantilla = plantilla_original.duplicar(
        nuevo_owner=nutri,
        nuevo_nombre='Mi Plantilla Personalizada'
    )
    
    print(f"✅ Plantilla duplicada: {nueva_plantilla.nombre}")
    print(f"   Owner: {nueva_plantilla.owner}")
    print(f"   Preguntas: {nueva_plantilla.preguntas_config.count()}")
    
    return nueva_plantilla


def generar_snapshot_ejemplo():
    """Prueba la generación de snapshot"""
    from apps.user.models import Consulta
    
    plantilla = PlantillaConsulta.objects.first()
    if not plantilla:
        print("❌ No hay plantillas para generar snapshot")
        return
    
    # Crear una consulta temporal para probar
    consulta = Consulta()
    snapshot = consulta.generar_snapshot_de_plantilla(plantilla)
    
    print(f"✅ Snapshot generado:")
    print(f"   Plantilla: {snapshot['nombre']}")
    print(f"   Preguntas: {len(snapshot['preguntas'])}")
    print(f"   Fecha: {snapshot['snapshot_date']}")
    
    return snapshot


def main():
    print("\n" + "="*60)
    print("PRUEBA DEL SISTEMA DE PLANTILLAS")
    print("="*60 + "\n")
    
    print("1️⃣  Creando preguntas del sistema...")
    preguntas = crear_preguntas_sistema()
    print(f"   Total preguntas: {len(preguntas)}\n")
    
    print("2️⃣  Creando plantilla del sistema...")
    plantilla_sistema = crear_plantilla_sistema()
    print(f"   ID: {plantilla_sistema.id}\n")
    
    print("3️⃣  Probando duplicación de plantilla...")
    plantilla_duplicada = probar_duplicar_plantilla()
    if plantilla_duplicada:
        print(f"   ID: {plantilla_duplicada.id}\n")
    
    print("4️⃣  Generando snapshot de ejemplo...")
    snapshot = generar_snapshot_ejemplo()
    if snapshot:
        print(f"   ✅ Snapshot generado correctamente\n")
    
    print("="*60)
    print("RESUMEN")
    print("="*60)
    print(f"Plantillas totales: {PlantillaConsulta.objects.count()}")
    print(f"Plantillas del sistema: {PlantillaConsulta.objects.filter(owner=None).count()}")
    print(f"Plantillas de nutricionistas: {PlantillaConsulta.objects.exclude(owner=None).count()}")
    print(f"Preguntas en plantillas: {PlantillaPregunta.objects.count()}")
    print("="*60 + "\n")


if __name__ == '__main__':
    main()
