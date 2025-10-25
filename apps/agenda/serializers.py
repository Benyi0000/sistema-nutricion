# apps/agenda/serializers.py
from rest_framework import serializers
from django.utils import timezone
from .models import Ubicacion, TipoConsultaConfig, DisponibilidadHoraria, BloqueoDisponibilidad, ProfessionalSettings
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

# apps/agenda/serializers.py
# ... (importaciones existentes)
from rest_framework import serializers # Asegúrate de importar serializers

# ... (otros serializers)

class TimeSlotSerializer(serializers.Serializer):
    """Serializer simple para representar un intervalo de tiempo."""
    inicio = serializers.DateTimeField()
    fin = serializers.DateTimeField()



# apps/agenda/serializers.py
# ... (importaciones y serializers existentes)
from .models import Turno, Ubicacion, TipoConsultaConfig # Asegúrate de importar los modelos necesarios
from apps.user.serializers import SimpleUserAccountSerializer # Usaremos un serializer simple para paciente/nutri


# ... (TimeSlotSerializer)

class TurnoSerializer(serializers.ModelSerializer):
    # Usar serializers simplificados o de solo lectura para las relaciones
    paciente = SimpleUserAccountSerializer(read_only=True)
    nutricionista = SimpleUserAccountSerializer(read_only=True)
    
    # Para ubicacion: usar ID al escribir, pero objeto completo al leer
    ubicacion_id = serializers.PrimaryKeyRelatedField(
        queryset=Ubicacion.objects.all(),
        source='ubicacion',
        write_only=True,
        required=False,
        allow_null=True
    )
    ubicacion = UbicacionSerializer(read_only=True)
    
    # Para tipo_consulta: usar ID al escribir, pero objeto completo al leer
    tipo_consulta_id = serializers.PrimaryKeyRelatedField(
        queryset=TipoConsultaConfig.objects.all(),
        source='tipo_consulta',
        write_only=True,
        required=True
    )
    tipo_consulta = TipoConsultaConfigSerializer(read_only=True)
    
    # Campos auxiliares para enviar/recibir el slot como inicio y fin
    slot_inicio = serializers.DateTimeField(write_only=True, required=False)
    slot_fin = serializers.DateTimeField(write_only=True, required=False)

    class Meta:
        model = Turno
        fields = [
            'id',
            'paciente',
            'nutricionista',
            'ubicacion',
            'ubicacion_id',  # Para escritura
            'tipo_consulta',
            'tipo_consulta_id',  # Para escritura
            'slot', # El campo DateTimeRangeField (lectura)
            'slot_inicio', # Para escritura
            'slot_fin',    # Para escritura
            'start_time',  # Agregar para lectura
            'end_time',    # Agregar para lectura
            'state',
            'notas_paciente',
            'created_at',  # CORREGIDO: era 'fecha_creacion', ahora 'created_at'
        ]
        read_only_fields = [
            'id',
            'paciente',         # Se asignará automáticamente al crear
            'nutricionista',    # Se asignará automáticamente al crear
            'ubicacion',        # Solo lectura (objeto completo)
            'tipo_consulta',    # Solo lectura (objeto completo)
            'slot',             # Solo lectura, se construye desde slot_inicio y slot_fin
            'start_time',       # Solo lectura
            'end_time',         # Solo lectura
            'state',            # Se manejará con acciones o estado inicial
            'created_at',       # CORREGIDO
        ]

    def validate(self, data):
        # Si se envían slot_inicio y slot_fin, construir el Range y establecer start/end times
        slot_inicio = data.pop('slot_inicio', None)
        slot_fin = data.pop('slot_fin', None)
        
        if slot_inicio and slot_fin:
            from psycopg.types.range import Range
            data['slot'] = Range(slot_inicio, slot_fin, bounds='[)')
            # También establecer start_time y end_time (requeridos por el modelo)
            data['start_time'] = slot_inicio
            data['end_time'] = slot_fin
        
        slot = data.get('slot')
        tipo_consulta = data.get('tipo_consulta')

        if slot and tipo_consulta:
             # Calcula la duración del slot proporcionado
             duracion_slot_min = (slot.upper - slot.lower).total_seconds() / 60
             # Obtiene la duración esperada del tipo de consulta (en minutos)
             duracion_esperada_min = tipo_consulta.duracion_min
             if abs(duracion_slot_min - duracion_esperada_min) > 1: # Tolerancia de 1 min
                 raise serializers.ValidationError(
                     f"La duración del slot ({duracion_slot_min} min) no coincide con la duración "
                     f"del tipo de consulta ({duracion_esperada_min} min)."
                 )

        # Validar que el slot no esté en el pasado al crear
        if slot and slot.lower <= timezone.now() and not self.instance: # Solo al crear
             raise serializers.ValidationError("No se pueden solicitar turnos en el pasado.")

        return data

    # NOTA: La asignación de 'paciente' y 'nutricionista' se hará en la vista (perform_create).
    #       El estado inicial también se pondrá en la vista.

# ... (TurnoSerializer que crearemos después)


class ProfessionalSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer para la configuración profesional del nutricionista.
    """
    nutricionista = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = ProfessionalSettings
        fields = [
            'id',
            'nutricionista',
            'booking_mode',
            'payments_enabled',
            'payment_methods',
            'free_cancel_hours',
            'min_reschedule_hours',
            'no_show_fee_type',
            'no_show_fee_value',
            'deposit_enabled',
            'deposit_type',
            'deposit_value',
            'anticipacion_minima',
            'anticipacion_maxima',
            'buffer_before_min',
            'buffer_after_min',
            'teleconsulta_enabled',
        ]
        read_only_fields = ['id', 'nutricionista']
    
    def to_representation(self, instance):
        """Convertir timedelta a días/horas para el frontend"""
        data = super().to_representation(instance)
        
        # Convertir anticipacion_minima de timedelta a horas
        if instance.anticipacion_minima:
            data['anticipacion_minima_hours'] = int(instance.anticipacion_minima.total_seconds() / 3600)
        
        # Convertir anticipacion_maxima de timedelta a días
        if instance.anticipacion_maxima:
            data['anticipacion_maxima_days'] = int(instance.anticipacion_maxima.total_seconds() / 86400)
        
        return data
    
    def to_internal_value(self, data):
        """Convertir días/horas del frontend a timedelta"""
        # Si el frontend envía anticipacion_minima_hours, convertir a timedelta
        if 'anticipacion_minima_hours' in data:
            from datetime import timedelta
            hours = data.pop('anticipacion_minima_hours')
            data['anticipacion_minima'] = timedelta(hours=hours)
        
        # Si el frontend envía anticipacion_maxima_days, convertir a timedelta
        if 'anticipacion_maxima_days' in data:
            from datetime import timedelta
            days = data.pop('anticipacion_maxima_days')
            data['anticipacion_maxima'] = timedelta(days=days)
        
        return super().to_internal_value(data)