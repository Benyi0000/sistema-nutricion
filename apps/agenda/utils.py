# apps/agenda/utils.py
import datetime
from django.utils import timezone
from psycopg.types.range import Range
from .models import DisponibilidadHoraria, BloqueoDisponibilidad, Turno, TipoConsultaConfig, ProfessionalSettings, TurnoState
from django.db.models import Q


def calculate_available_slots(nutricionista, start_date, end_date, duracion_minutos=None, ubicacion_id=None, tipo_consulta_id=None):
    """
    Calcula los slots de tiempo disponibles para un nutricionista en un rango de fechas.
    Incluye buffers antes y después de cada consulta.

    Args:
        nutricionista: Instancia del perfil Nutricionista.
        start_date: Fecha de inicio (date object).
        end_date: Fecha de fin (date object, inclusiva).
        duracion_minutos: Duración del slot deseado en minutos. Si es None, usa la predeterminada.
        ubicacion_id: ID de la ubicación para filtrar disponibilidades. Si es None, no filtra por ubicación.
        tipo_consulta_id: ID del TipoConsultaConfig para obtener buffers específicos.

    Returns:
        Lista de diccionarios [{'inicio': datetime, 'fin': datetime}] representando los slots.
        Los slots retornados son solo el tiempo de consulta (sin buffers visibles al paciente).
    """
    available_slots = []
    current_tz = timezone.get_current_timezone()

    # 1. Obtener configuración del profesional y buffers
    buffer_before_min = 0
    buffer_after_min = 0
    
    try:
        settings = ProfessionalSettings.objects.get(nutricionista=nutricionista)
        # Buffers globales por defecto
        buffer_before_min = settings.buffer_before_min
        buffer_after_min = settings.buffer_after_min
        
        # Si se especifica tipo_consulta_id, usar sus buffers específicos
        if tipo_consulta_id:
            try:
                tipo_consulta_config = TipoConsultaConfig.objects.get(
                    id=tipo_consulta_id,
                    nutricionista=nutricionista
                )
                duracion_minutos = tipo_consulta_config.duracion_min
                buffer_before_min = tipo_consulta_config.buffer_before_min
                buffer_after_min = tipo_consulta_config.buffer_after_min
            except TipoConsultaConfig.DoesNotExist:
                pass
        
        # Si no se especificó duración, buscar una por defecto
        if duracion_minutos is None:
            default_tipo_consulta = TipoConsultaConfig.objects.filter(
                nutricionista=nutricionista
            ).order_by('id').first()
            if default_tipo_consulta:
                duracion_minutos = default_tipo_consulta.duracion_min
                if not tipo_consulta_id:  # Solo usar buffers si no se especificó tipo_consulta_id
                    buffer_before_min = default_tipo_consulta.buffer_before_min
                    buffer_after_min = default_tipo_consulta.buffer_after_min
            else:
                duracion_minutos = 60 # Default fallback
    except ProfessionalSettings.DoesNotExist:
        duracion_minutos = duracion_minutos or 60 # Default si no hay settings

    slot_duration = datetime.timedelta(minutes=duracion_minutos)
    buffer_before = datetime.timedelta(minutes=buffer_before_min)
    buffer_after = datetime.timedelta(minutes=buffer_after_min)
    total_duration = buffer_before + slot_duration + buffer_after  # Duración total incluyendo buffers

    # 2. Iterar por cada día en el rango solicitado
    current_date = start_date
    while current_date <= end_date:
        weekday = current_date.weekday() # Lunes=0, Domingo=6

        # Obtener disponibilidades para este día de la semana
        disponibilidades_query = DisponibilidadHoraria.objects.filter(
            nutricionista=nutricionista,
            dia_semana=weekday
        )
        
        # Filtrar por ubicación si se especificó
        if ubicacion_id:
            disponibilidades_query = disponibilidades_query.filter(ubicacion_id=ubicacion_id)
        
        disponibilidades = disponibilidades_query

        daily_potential_slots = []

        for disp in disponibilidades:
            # Combinar fecha con hora de inicio y fin de la disponibilidad
            start_dt = timezone.make_aware(
                datetime.datetime.combine(current_date, disp.hora_inicio),
                current_tz
            )
            end_dt = timezone.make_aware(
                datetime.datetime.combine(current_date, disp.hora_fin),
                current_tz
            )

            # Generar slots potenciales dentro de esta disponibilidad
            # IMPORTANTE: Consideramos el tiempo total (buffer_before + consulta + buffer_after)
            # pero el slot que guardamos es solo el tiempo de consulta
            current_slot_start = start_dt + buffer_before  # Empezar después del primer buffer
            
            while current_slot_start + slot_duration + buffer_after <= end_dt:
                # El slot visible al paciente es solo el tiempo de consulta (sin buffers)
                daily_potential_slots.append({
                    'slot': Range(
                        current_slot_start,
                        current_slot_start + slot_duration,
                        bounds='[)'
                    ),
                    # Guardamos también el rango completo con buffers para verificar solapamientos
                    'total_range': Range(
                        current_slot_start - buffer_before,
                        current_slot_start + slot_duration + buffer_after,
                        bounds='[)'
                    )
                })
                # Avanzar por la duración total (incluyendo buffers)
                current_slot_start += total_duration

        # Si no hay slots potenciales para este día, continuar
        if not daily_potential_slots:
            current_date += datetime.timedelta(days=1)
            continue

        # 3. Obtener bloqueos y turnos existentes para el día actual
        day_start = timezone.make_aware(datetime.datetime.combine(current_date, datetime.time.min), current_tz)
        day_end = timezone.make_aware(datetime.datetime.combine(current_date, datetime.time.max), current_tz)

        bloqueos_query = BloqueoDisponibilidad.objects.filter(
            nutricionista=nutricionista,
            start_time__lt=day_end,  # El bloqueo empieza antes del fin del día
            end_time__gt=day_start   # El bloqueo termina después del inicio del día
        )
        
        # Filtrar bloqueos por ubicación si se especificó
        if ubicacion_id:
            bloqueos_query = bloqueos_query.filter(ubicacion_id=ubicacion_id)
        
        bloqueos = bloqueos_query

        now = timezone.now()
        turnos_ocupados = Turno.objects.filter(
            nutricionista=nutricionista,
            slot__overlap=Range(day_start, day_end, bounds='[)')
        )
        
        # Filtrar por ubicación si se especificó
        if ubicacion_id:
            turnos_ocupados = turnos_ocupados.filter(ubicacion_id=ubicacion_id)
        
        turnos_ocupados = turnos_ocupados.filter(
            # Ocupan slot si están RESERVADOS, CONFIRMADOS o ATENDIDOS
            Q(state__in=[
                TurnoState.RESERVADO, 
                TurnoState.CONFIRMADO, 
                TurnoState.ATENDIDO
            ]) |
            # O si están TENTATIVOS y su soft_hold AÚN NO HA EXPIRADO
            (Q(state=TurnoState.TENTATIVO) & Q(soft_hold_expires_at__gt=now))
        )

        # Convertir bloqueos y turnos a rangos para fácil comparación
        # IMPORTANTE: Para los turnos, debemos considerar también sus buffers
        occupied_ranges = []
        for b in bloqueos:
            # Crear un rango desde start_time hasta end_time
            occupied_ranges.append(Range(b.start_time, b.end_time, bounds='[)'))
        
        for t in turnos_ocupados:
            # Para cada turno existente, obtener sus buffers configurados
            turno_buffer_before = 0
            turno_buffer_after = 0
            
            if t.tipo_consulta:
                turno_buffer_before = t.tipo_consulta.buffer_before_min
                turno_buffer_after = t.tipo_consulta.buffer_after_min
            else:
                # Usar buffers globales del profesional si no hay tipo específico
                try:
                    settings = ProfessionalSettings.objects.get(nutricionista=nutricionista)
                    turno_buffer_before = settings.buffer_before_min
                    turno_buffer_after = settings.buffer_after_min
                except ProfessionalSettings.DoesNotExist:
                    pass
            
            # Expandir el slot del turno para incluir sus buffers
            turno_total_range = Range(
                (t.slot.lower - datetime.timedelta(minutes=turno_buffer_before)),
                (t.slot.upper + datetime.timedelta(minutes=turno_buffer_after)),
                bounds='[)'
            )
            occupied_ranges.append(turno_total_range)

        # 4. Filtrar slots potenciales eliminando los ocupados
        # Verificamos contra el rango TOTAL (con buffers) de cada slot potencial
        for potential_slot_data in daily_potential_slots:
            is_occupied = False
            potential_total_range = potential_slot_data['total_range']
            
            # Convertir potential_total_range a UTC para comparación consistente
            import datetime as dt
            potential_lower_utc = potential_total_range.lower.astimezone(dt.timezone.utc) if potential_total_range.lower.tzinfo else potential_total_range.lower
            potential_upper_utc = potential_total_range.upper.astimezone(dt.timezone.utc) if potential_total_range.upper.tzinfo else potential_total_range.upper
            
            for occupied in occupied_ranges:
                # Convertir occupied a UTC también para comparación consistente
                occupied_lower_utc = occupied.lower.astimezone(dt.timezone.utc) if occupied.lower.tzinfo else occupied.lower
                occupied_upper_utc = occupied.upper.astimezone(dt.timezone.utc) if occupied.upper.tzinfo else occupied.upper
                
                # Verificar si el rango total del slot potencial se solapa con algún rango ocupado
                if potential_lower_utc < occupied_upper_utc and potential_upper_utc > occupied_lower_utc:
                   is_occupied = True
                   break
            
            if potential_slot_data['slot'].lower < now:
                is_occupied = True

            if not is_occupied:
                # Retornar solo el slot de consulta (sin buffers visibles)
                potential_slot = potential_slot_data['slot']
                available_slots.append({
                    'inicio': potential_slot.lower,
                    'fin': potential_slot.upper
                })

        # Avanzar al siguiente día
        current_date += datetime.timedelta(days=1)



    # Ordenar los slots por fecha y hora de inicio
    available_slots.sort(key=lambda x: x['inicio'])


    final_slots = []
    slot_starts = set()
    for slot in available_slots:
        if slot['inicio'] not in slot_starts:
            final_slots.append(slot)
            slot_starts.add(slot['inicio'])

    return final_slots