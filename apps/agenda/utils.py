# apps/agenda/utils.py
import datetime
from django.utils import timezone
from psycopg.types.range import Range
from .models import DisponibilidadHoraria, BloqueoDisponibilidad, Turno, TipoConsultaConfig, ProfessionalSettings, TurnoState

def calculate_available_slots(nutricionista, start_date, end_date, duracion_minutos=None, ubicacion_id=None):
    """
    Calcula los slots de tiempo disponibles para un nutricionista en un rango de fechas.

    Args:
        nutricionista: Instancia del perfil Nutricionista.
        start_date: Fecha de inicio (date object).
        end_date: Fecha de fin (date object, inclusiva).
        duracion_minutos: Duración del slot deseado en minutos. Si es None, usa la predeterminada.
        ubicacion_id: ID de la ubicación para filtrar disponibilidades. Si es None, no filtra por ubicación.

    Returns:
        Lista de diccionarios [{'inicio': datetime, 'fin': datetime}] representando los slots.
    """
    available_slots = []
    current_tz = timezone.get_current_timezone()

    # 1. Obtener configuración del profesional
    try:
        settings = ProfessionalSettings.objects.get(nutricionista=nutricionista)
        # Por ahora, usamos una duración fija si no se especifica.
        # Idealmente, esto debería venir de TipoConsultaConfig o ser un parámetro.
        if duracion_minutos is None:
             # Buscamos una configuración de consulta predeterminada o la primera
            default_tipo_consulta = TipoConsultaConfig.objects.filter(
                nutricionista=nutricionista
            ).order_by('id').first()
            if default_tipo_consulta:
                duracion_minutos = default_tipo_consulta.duracion_min
            else:
                duracion_minutos = 60 # Default fallback si no hay TipoConsultaConfig
    except ProfessionalSettings.DoesNotExist:
        duracion_minutos = duracion_minutos or 60 # Default si no hay settings

    slot_duration = datetime.timedelta(minutes=duracion_minutos)

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
            current_slot_start = start_dt
            while current_slot_start + slot_duration <= end_dt:
                daily_potential_slots.append(Range(
                    current_slot_start,
                    current_slot_start + slot_duration,
                    bounds='[)'
                ))
                current_slot_start += slot_duration # Avanzar al siguiente slot potencial

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

        turnos_ocupados = Turno.objects.filter(
            nutricionista=nutricionista,
            state__in=[TurnoState.TENTATIVO, TurnoState.RESERVADO, TurnoState.CONFIRMADO],  # Estados que ocupan el slot
            slot__overlap=Range(day_start, day_end, bounds='[)')
        )

        # Convertir bloqueos y turnos a rangos para fácil comparación
        occupied_ranges = []
        for b in bloqueos:
            # Crear un rango desde start_time hasta end_time
            occupied_ranges.append(Range(b.start_time, b.end_time, bounds='[)'))
        for t in turnos_ocupados:
            occupied_ranges.append(t.slot)

        # 4. Filtrar slots potenciales eliminando los ocupados
        for potential_slot in daily_potential_slots:
            is_occupied = False
            for occupied in occupied_ranges:
                # Usamos 'overlap' para verificar si hay alguna intersección
                if potential_slot.lower < occupied.upper and potential_slot.upper > occupied.lower:
                   is_occupied = True
                   break
            if not is_occupied:
                available_slots.append({
                    'inicio': potential_slot.lower,
                    'fin': potential_slot.upper
                })

        # Avanzar al siguiente día
        current_date += datetime.timedelta(days=1)

    # Ordenar los slots por fecha y hora de inicio
    available_slots.sort(key=lambda x: x['inicio'])

    return available_slots