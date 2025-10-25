from django.shortcuts import render

# Create your views here.
# apps/agenda/views.py
from rest_framework import viewsets, permissions, serializers
from rest_framework.response import Response
from rest_framework import status
from .models import (
    Ubicacion, 
    TipoConsultaConfig, 
    DisponibilidadHoraria, 
    BloqueoDisponibilidad,
    ProfessionalSettings
)
from .serializers import (
    UbicacionSerializer, 
    TipoConsultaConfigSerializer, 
    DisponibilidadHorariaSerializer, 
    BloqueoDisponibilidadSerializer,
    ProfessionalSettingsSerializer
)
from .permissions import IsNutriOwner # <-- Importamos nuestro permiso personalizado

class NutriConfigBaseViewSet(viewsets.ModelViewSet):
    """
    Clase base para todos los ViewSets de configuración del Nutricionista.
    
    - Aplica el permiso IsNutriOwner.
    - Filtra automáticamente el queryset para mostrar solo los objetos
      del nutricionista logueado.
    - Asigna automáticamente al nutricionista logueado al crear un objeto.
    """
    permission_classes = [permissions.IsAuthenticated, IsNutriOwner]

    def get_queryset(self):
        """
        Sobrescribimos para filtrar y que el nutricionista
        solo vea sus propios objetos.
        """
        # Ya verificamos que el user tiene .nutricionista en el permiso
        nutri = self.request.user.nutricionista
        # Filtra el queryset original basado en el nutricionista
        return self.queryset.filter(nutricionista=nutri)

    def perform_create(self, serializer):
        """
        Sobrescribimos para asignar automáticamente el nutricionista
        al crear un nuevo objeto (Ubicacion, Bloqueo, etc.)
        """
        nutri = self.request.user.nutricionista
        serializer.save(nutricionista=nutri)

# --- ViewSets de Configuración ---

class UbicacionViewSet(NutriConfigBaseViewSet):
    """
    API endpoint para que el Nutricionista gestione sus Ubicaciones.
    (CRUD: /api/agenda/ubicaciones/)
    """
    queryset = Ubicacion.objects.all()
    serializer_class = UbicacionSerializer

class TipoConsultaConfigViewSet(NutriConfigBaseViewSet):
    """
    API endpoint para que el Nutricionista gestione sus Tipos de Consulta.
    (CRUD: /api/agenda/tipos-consulta/)
    """
    queryset = TipoConsultaConfig.objects.all()
    serializer_class = TipoConsultaConfigSerializer

class DisponibilidadHorariaViewSet(NutriConfigBaseViewSet):
    """
    API endpoint para que el Nutricionista gestione sus Horarios.
    (CRUD: /api/agenda/disponibilidad/)
    """
    queryset = DisponibilidadHoraria.objects.all()
    serializer_class = DisponibilidadHorariaSerializer

class BloqueoDisponibilidadViewSet(NutriConfigBaseViewSet):
    """
    API endpoint para que el Nutricionista gestione sus Bloqueos.
    (CRUD: /api/agenda/bloqueos/)
    """
    queryset = BloqueoDisponibilidad.objects.all()
    serializer_class = BloqueoDisponibilidadSerializer


class ProfessionalSettingsViewSet(viewsets.ModelViewSet):
    """
    API endpoint para que el Nutricionista gestione su configuración profesional.
    Solo puede tener una configuración (OneToOne con Nutricionista).
    """
    queryset = ProfessionalSettings.objects.all()
    serializer_class = ProfessionalSettingsSerializer
    permission_classes = [permissions.IsAuthenticated, IsNutriOwner]
    
    def get_queryset(self):
        """Filtrar para que solo vea su propia configuración"""
        nutri = self.request.user.nutricionista
        return self.queryset.filter(nutricionista=nutri)
    
    def list(self, request, *args, **kwargs):
        """
        Sobrescribir list para retornar directamente el objeto único
        en lugar de un array.
        """
        nutri = request.user.nutricionista
        # Obtener o crear la configuración
        settings, created = ProfessionalSettings.objects.get_or_create(
            nutricionista=nutri
        )
        serializer = self.get_serializer(settings)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        """Asignar automáticamente el nutricionista"""
        nutri = self.request.user.nutricionista
        serializer.save(nutricionista=nutri)


# --- PRÓXIMAMENTE (Día 2 - Parte B) ---
# Aquí es donde irá el SlotsAPIView y el TurnoViewSet,
# pero con esto el nutri ya puede configurar su agenda.# apps/agenda/views.py
# ... (importaciones existentes)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.shortcuts import get_object_or_404
from apps.user.models import UserAccount
import datetime
from .utils import calculate_available_slots # Importar la función
from .serializers import TimeSlotSerializer   # Importar el serializer

# ... (otros ViewSets)

class SlotsAPIView(APIView):
    """
    Vista para obtener los slots de tiempo disponibles para un nutricionista
    en un rango de fechas dado.
    """
    permission_classes = [permissions.IsAuthenticated] # O IsAdminUser si solo admins pueden ver todos

    def get(self, request, nutricionista_id):
        # Obtener el nutricionista
        nutricionista = get_object_or_404(UserAccount, id=nutricionista_id, rol=UserAccount.Rol.NUTRICIONISTA)

        # Obtener parámetros de fecha de la query string
        fecha_inicio_str = request.query_params.get('fecha_inicio')
        fecha_fin_str = request.query_params.get('fecha_fin')
        duracion_str = request.query_params.get('duracion') # Opcional

        # Validar fechas
        if not fecha_inicio_str or not fecha_fin_str:
            return Response(
                {"error": "Los parámetros 'fecha_inicio' y 'fecha_fin' son requeridos (YYYY-MM-DD)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            fecha_inicio = datetime.datetime.strptime(fecha_inicio_str, '%Y-%m-%d').date()
            fecha_fin = datetime.datetime.strptime(fecha_fin_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {"error": "Formato de fecha inválido. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar rango de fechas (opcional, ej. no más de X días)
        if fecha_fin < fecha_inicio:
             return Response(
                {"error": "La fecha de fin no puede ser anterior a la fecha de inicio."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if (fecha_fin - fecha_inicio).days > 30: # Limitar a ~1 mes por performance
             return Response(
                {"error": "El rango de fechas no puede exceder los 31 días."},
                status=status.HTTP_400_BAD_REQUEST
            )

        duracion_minutos = None
        if duracion_str:
            try:
                duracion_minutos = int(duracion_str)
                if duracion_minutos <= 0:
                     raise ValueError()
            except ValueError:
                 return Response(
                    {"error": "La duración debe ser un número entero positivo de minutos."},
                    status=status.HTTP_400_BAD_REQUEST
                )


        # Calcular slots disponibles usando la función del utils.py
        slots = calculate_available_slots(nutricionista, fecha_inicio, fecha_fin, duracion_minutos)

        # Serializar los resultados
        serializer = TimeSlotSerializer(slots, many=True)
        return Response(serializer.data)
    

# apps/agenda/views.py
# ... (importaciones)
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from django.db import transaction
from django.utils import timezone
from .models import Turno, Ubicacion, TipoConsultaConfig # Importar modelos
from .serializers import TurnoSerializer # Importar serializer
from .permissions import IsNutriOwner # Reutilizar permiso si aplica

# ... (Otras vistas)

class TurnoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Turnos (citas).
    - Pacientes: Pueden listar sus turnos y solicitar nuevos (create).
    - Nutricionistas: Pueden listar sus turnos, ver detalles y aprobar/cancelar.
    - Admins: Pueden ver todos los turnos.
    """
    serializer_class = TurnoSerializer
    # permission_classes = [permissions.IsAuthenticated] # Permiso base

    def get_queryset(self):
        user = self.request.user
        queryset = Turno.objects.select_related(
            'paciente', 'nutricionista', 'ubicacion', 'tipo_consulta'
        ).order_by('-slot__lower') # Ordenar por fecha descendente

        if user.is_staff or user.is_superuser: # Admin ve todo
            return queryset
        elif user.rol == UserAccount.Rol.NUTRICIONISTA:
            return queryset.filter(nutricionista=user)
        elif user.rol == UserAccount.Rol.PACIENTE:
            return queryset.filter(paciente=user)
        else:
            return Turno.objects.none() # Otros roles no ven nada

    def get_permissions(self):
        """Permisos específicos por acción."""
        if self.action in ['aprobar', 'cancelar_nutri', 'update', 'partial_update', 'destroy']:
            # Solo el nutricionista dueño (o admin) puede modificar/aprobar/cancelar
            return [permissions.IsAuthenticated(), IsNutriOwner()] # Asume IsNutriOwner verifica self.get_object().nutricionista == request.user
        elif self.action == 'create':
            # Solo pacientes pueden crear (solicitar) turnos
             return [permissions.IsAuthenticated()] # Añadir chequeo de rol Paciente
        elif self.action == 'list' or self.action == 'retrieve':
            # Cualquiera autenticado puede listar/ver (el queryset ya filtra)
            return [permissions.IsAuthenticated()]
        return super().get_permissions()


    def perform_create(self, serializer):
        """
        Asigna paciente, nutricionista (de la URL o datos), estado inicial
        y valida que el slot no se solape ANTES de guardar.
        """
        user = self.request.user
        if user.rol != UserAccount.Rol.PACIENTE:
             raise serializers.ValidationError("Solo los pacientes pueden solicitar turnos.")

        # Obtener nutricionista de los datos (o de la URL si la estructura es diferente)
        nutricionista_id = self.request.data.get('nutricionista_id') # Asume que envías el ID del nutri
        if not nutricionista_id:
             raise serializers.ValidationError("Se requiere el ID del nutricionista.")

        nutricionista = get_object_or_404(UserAccount, id=nutricionista_id, rol=UserAccount.Rol.NUTRICIONISTA)

        slot = serializer.validated_data.get('slot')
        ubicacion = serializer.validated_data.get('ubicacion')
        tipo_consulta = serializer.validated_data.get('tipo_consulta')

        # Validar que Ubicacion y TipoConsulta pertenecen al Nutricionista
        settings = ProfessionalSettings.objects.filter(nutricionista=nutricionista).first()
        if not settings:
             raise serializers.ValidationError("El nutricionista no tiene configuración de agenda.")
        if ubicacion and ubicacion.professional_settings != settings:
             raise serializers.ValidationError("La ubicación no pertenece al nutricionista seleccionado.")
        if tipo_consulta.professional_settings != settings:
             raise serializers.ValidationError("El tipo de consulta no pertenece al nutricionista seleccionado.")


        # **Validación CRÍTICA de solapamiento y disponibilidad**
        # (Similar a calculate_available_slots pero para un slot específico)
        # 1. Verificar contra otros turnos TENTATIVOS o CONFIRMADOS
        overlapping_turnos = Turno.objects.filter(
            nutricionista=nutricionista,
            estado__in=[Turno.EstadoTurno.TENTATIVO, Turno.EstadoTurno.CONFIRMADO],
            slot__overlap=slot # Usar overlap para chequear intersección
        ).exists()
        if overlapping_turnos:
             raise serializers.ValidationError("El horario seleccionado ya no está disponible (ocupado por otro turno).")

        # 2. Verificar contra bloqueos
        overlapping_bloqueos = BloqueoDisponibilidad.objects.filter(
            professional_settings__nutricionista=nutricionista,
            slot__overlap=slot
        ).exists()
        if overlapping_bloqueos:
              raise serializers.ValidationError("El horario seleccionado no está disponible (bloqueado).")

        # 3. Verificar si cae dentro de alguna DisponibilidadHoraria válida
        weekday = slot.lower.weekday()
        hora_inicio = slot.lower.time()
        hora_fin = slot.upper.time()
        fecha = slot.lower.date()

        is_within_disponibilidad = DisponibilidadHoraria.objects.filter(
            professional_settings=settings,
            dia_semana=weekday,
            fecha_inicio__lte=fecha,
            fecha_fin__gte=fecha,
            hora_inicio__lte=hora_inicio,
            hora_fin__gte=hora_fin # Asegura que el slot completo esté dentro
        ).exists()

        if not is_within_disponibilidad:
             raise serializers.ValidationError("El horario seleccionado no está dentro de la disponibilidad del nutricionista.")


        # Si pasa todas las validaciones, guardar con datos automáticos
        serializer.save(
            paciente=user,
            nutricionista=nutricionista,
            estado=Turno.EstadoTurno.TENTATIVO # Estado inicial
        )

    # Acción para que el Nutricionista apruebe un turno
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsNutriOwner])
    def aprobar(self, request, pk=None):
        turno = self.get_object()
        if turno.estado != Turno.EstadoTurno.TENTATIVO:
            return Response(
                {"error": "Solo se pueden aprobar turnos en estado TENTATIVO."},
                status=status.HTTP_400_BAD_REQUEST
            )
         # Validar solapamiento OTRA VEZ por si algo cambió mientras estaba tentativo
        overlapping_turnos = Turno.objects.filter(
            nutricionista=turno.nutricionista,
            estado=Turno.EstadoTurno.CONFIRMADO, # Solo contra confirmados ahora? O tentativos también?
            slot__overlap=turno.slot
        ).exclude(pk=turno.pk).exists() # Excluir el turno actual
        if overlapping_turnos:
             # Quizás cambiar el estado a 'CONFLICTO' en lugar de error?
             return Response({"error": "Conflicto de horario detectado. No se puede aprobar."}, status=status.HTTP_409_CONFLICT)


        turno.estado = Turno.EstadoTurno.CONFIRMADO
        # Podrías añadir notas del nutricionista aquí si se envían en el request
        # turno.notas_nutricionista = request.data.get('notas_nutricionista', turno.notas_nutricionista)
        turno.save()
        serializer = self.get_serializer(turno)
        return Response(serializer.data)

    # Acción genérica para cancelar (podría necesitar lógica distinta para paciente vs nutri)
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated]) # Permiso más específico?
    def cancelar(self, request, pk=None):
        turno = self.get_object()
        user = request.user

        # Validar quién puede cancelar qué estado
        can_cancel = False
        if user == turno.paciente and turno.estado in [Turno.EstadoTurno.TENTATIVO, Turno.EstadoTurno.CONFIRMADO]:
             can_cancel = True # Paciente puede cancelar sus turnos (quizás con límite de tiempo antes de la cita?)
        elif user == turno.nutricionista and turno.estado in [Turno.EstadoTurno.TENTATIVO, Turno.EstadoTurno.CONFIRMADO]:
             can_cancel = True # Nutri puede cancelar
        elif user.is_staff: # Admin puede cancelar
             can_cancel = True

        if not can_cancel:
             return Response(
                {"error": "No tienes permiso para cancelar este turno o ya está cancelado/completado."},
                status=status.HTTP_403_FORBIDDEN
             )

        # Validar si ya pasó?
        if turno.slot.lower <= timezone.now() and turno.estado == Turno.EstadoTurno.CONFIRMADO:
             # No permitir cancelar turnos confirmados que ya pasaron? O cambiar a NO_ASISTIO?
             # return Response({"error": "No se puede cancelar un turno que ya ha pasado."}, status=status.HTTP_400_BAD_REQUEST)
             pass # O permitirlo con registro?

        turno.estado = Turno.EstadoTurno.CANCELADO
        # Añadir razón de cancelación?
        # turno.notas_cancelacion = request.data.get('razon')
        turno.save()
        serializer = self.get_serializer(turno)
        return Response(serializer.data)

    # Podrías querer deshabilitar PUT/PATCH directos si usas acciones
    # def update(self, request, *args, **kwargs):
    #     return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)
    # def partial_update(self, request, *args, **kwargs):
    #     return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)