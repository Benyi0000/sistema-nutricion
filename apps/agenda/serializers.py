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
    # Permitir especificar Ubicacion y TipoConsulta por ID al crear/actualizar
    ubicacion = serializers.PrimaryKeyRelatedField(
        queryset=Ubicacion.objects.all(), # Se filtrará en la vista
        required=False, # Puede ser nulo si es virtual o no aplica
        allow_null=True
    )
    tipo_consulta = serializers.PrimaryKeyRelatedField(
        queryset=TipoConsultaConfig.objects.all(), # Se filtrará en la vista
        required=True # Asumimos que siempre se requiere un tipo
    )
    # Mostrar el slot como objeto inicio/fin en lugar de Range object? Opcional.
    # slot_inicio = serializers.DateTimeField(source='slot.lower', read_only=True)
    # slot_fin = serializers.DateTimeField(source='slot.upper', read_only=True)

    class Meta:
        model = Turno
        fields = [
            'id',
            'paciente',
            'nutricionista',
            'ubicacion',
            'tipo_consulta',
            'slot', # El campo DateTimeRangeField
            'estado',
            'notas_paciente',
            'notas_nutricionista',
            'fecha_creacion',
            # 'slot_inicio', # Si descomentaste arriba
            # 'slot_fin',    # Si descomentaste arriba
        ]
        read_only_fields = [
            'id',
            'paciente',         # Se asignará automáticamente al crear
            'nutricionista',    # Se asignará automáticamente al crear o por URL
            'estado',           # Se manejará con acciones o estado inicial
            'fecha_creacion',
            'notas_nutricionista', # Solo el nutri debería poder editar esto
        ]

    def validate(self, data):
        # Validaciones adicionales si son necesarias
        # - ¿El slot está realmente disponible? (aunque la SlotsAPIView ayuda, doble check es bueno)
        # - ¿El tipo_consulta y ubicacion pertenecen al nutricionista? (Se hará en la vista)
        # - ¿La duración implícita en 'slot' coincide con 'tipo_consulta.duracion'?
        slot = data.get('slot')
        tipo_consulta = data.get('tipo_consulta')

        if slot and tipo_consulta:
             # Calcula la duración del slot proporcionado
             duracion_slot_min = (slot.upper - slot.lower).total_seconds() / 60
             # Obtiene la duración esperada del tipo de consulta
             duracion_esperada_min = tipo_consulta.duracion_predeterminada.total_seconds() / 60
             if abs(duracion_slot_min - duracion_esperada_min) > 1: # Tolerancia de 1 min por si acaso
                 raise serializers.ValidationError(
                     f"La duración del slot ({duracion_slot_min} min) no coincide con la duración "
                     f"del tipo de consulta '{tipo_consulta.nombre}' ({duracion_esperada_min} min)."
                 )

        # Validar que el slot no esté en el pasado al crear (quizás con un margen)
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