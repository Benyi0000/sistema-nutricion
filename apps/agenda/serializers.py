# apps/agenda/serializers.py
from rest_framework import serializers
from .models import Ubicacion, TipoConsultaConfig, DisponibilidadHoraria, BloqueoDisponibilidad
from apps.user.models import Nutricionista

class UbicacionSerializer(serializers.ModelSerializer):
    """
    Serializer para las ubicaciones del nutricionista.
    """
    # Hacemos que 'nutricionista' sea de solo lectura.
    # Se asignará automáticamente desde el usuario logueado en el ViewSet.
    nutricionista = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Ubicacion
        fields = [
            'id', 
            'nutricionista', 
            'nombre', 
            'direccion', 
            'is_virtual', 
            'timezone',
            'lat',
            'lng',
            'place_id'
        ]

class TipoConsultaConfigSerializer(serializers.ModelSerializer):
    """
    Serializer para los tipos de consulta (servicios) del nutricionista.
    """
    nutricionista = serializers.PrimaryKeyRelatedField(read_only=True)
    # Mostramos el "nombre" legible del tipo de consulta (ej: "Inicial")
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = TipoConsultaConfig
        fields = [
            'id',
            'nutricionista',
            'tipo',
            'tipo_display', # Mostramos el valor legible
            'duracion_min',
            'precio',
            'buffer_before_min',
            'buffer_after_min',
            'canal_por_defecto',
        ]

class DisponibilidadHorariaSerializer(serializers.ModelSerializer):
    """
    Serializer para las reglas de disponibilidad (horarios recurrentes).
    """
    nutricionista = serializers.PrimaryKeyRelatedField(read_only=True)
    # Mostramos el "nombre" legible del día (ej: "Lunes")
    dia_semana_display = serializers.CharField(source='get_dia_semana_display', read_only=True)

    class Meta:
        model = DisponibilidadHoraria
        fields = [
            'id',
            'nutricionista',
            'ubicacion',
            'dia_semana',
            'dia_semana_display', # Mostramos el valor legible
            'hora_inicio',
            'hora_fin',
            'slot_minutes',
        ]

class BloqueoDisponibilidadSerializer(serializers.ModelSerializer):
    """
    Serializer para los bloqueos (vacaciones, etc.).
    """
    nutricionista = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = BloqueoDisponibilidad
        fields = [
            'id',
            'nutricionista',
            'ubicacion',
            'start_time',
            'end_time',
            'motivo',
        ]