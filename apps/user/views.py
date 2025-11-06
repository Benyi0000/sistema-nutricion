# apps/user/views.py

from rest_framework import status, permissions, generics, viewsets, mixins
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.exceptions import PermissionDenied
from django.core.paginator import Paginator
from django.db.models import Q
from django.db import models as django_models
from .models import Especialidad, Nutricionista
from .serializers import (
    NutricionistaAltaSerializer,
    EspecialidadSerializer,
    NutricionistaListSerializer,
    NutricionistaUpdateSerializer,
    PacienteUpdateSerializer,  # Agregar el nuevo serializer
)
# --- LIMPIEZA: Imports duplicados eliminados ---
# from .models import Especialidad
# from .serializers import (
#     NutricionistaAltaSerializer,
#     EspecialidadSerializer,
# )
from rest_framework import permissions, status
from .models import Pregunta, Consulta, TipoConsulta
from .serializers import (
    PreguntaSerializer,
    ConsultaInicialSerializer,
    ConsultaSeguimientoSerializer,
    ConsultaListItemSerializer,
)

from rest_framework.permissions import IsAuthenticated
from .models import Paciente, AsignacionNutricionistaPaciente
from .serializers import PacienteListSerializer
from rest_framework.generics import RetrieveAPIView
from .models import Paciente
from .serializers import PacienteDetailSerializer


# GET /api/user/especialidades/
class EspecialidadListView(generics.ListAPIView):
    queryset = Especialidad.objects.all().order_by('nombre')
    serializer_class = EspecialidadSerializer
    permission_classes = [permissions.IsAuthenticated]  # usa IsAdminUser si querés


# POST /api/user/nutricionistas/
# Crea usuario + perfil Nutricionista
class NutricionistaAltaView(APIView):
    permission_classes = [permissions.IsAdminUser]  # solo admin puede listar/crear

    # GET /api/user/nutricionistas/?page=1&page_size=10&search=ana
    def get(self, request):
        qs = (
            Nutricionista.objects
            .select_related('user')
            .prefetch_related('especialidades')
            .all()
        )

        search = (request.query_params.get('search') or '').strip()
        if search:
            qs = qs.filter(
                Q(user__dni__icontains=search) |
                Q(user__email__icontains=search) |
                # --- MODIFICADO ---
                # Buscamos en los campos 'nombre' y 'apellido' del modelo Nutricionista
                Q(nombre__icontains=search) |
                Q(apellido__icontains=search) |
                # --- FIN MODIFICADO ---
                Q(matricula__icontains=search) |
                Q(telefono__icontains=search) |
                Q(especialidades__nombre__icontains=search)
            ).distinct()

        try:
            page = int(request.query_params.get('page', 1))
        except ValueError:
            page = 1
        try:
            page_size = int(request.query_params.get('page_size', 10))
        except ValueError:
            page_size = 10

        # --- MODIFICADO ---
        # Ordenamos por los campos 'apellido' y 'nombre' del modelo Nutricionista
        qs = qs.order_by('apellido', 'nombre')
        paginator = Paginator(qs, page_size)
        page_obj = paginator.get_page(page)

        data = {
            'count': paginator.count,
            'num_pages': paginator.num_pages,
            'page': page_obj.number,
            'page_size': page_size,
            'results': NutricionistaListSerializer(page_obj.object_list, many=True, context={'request': request}).data
        }
        return Response(data, status=status.HTTP_200_OK)

    # POST /api/user/nutricionistas/ (crear)
    def post(self, request):
        ser = NutricionistaAltaSerializer(data=request.data)
        if ser.is_valid():
            data = ser.save()
            return Response(data, status=status.HTTP_201_CREATED)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import api_view, permission_classes

@method_decorator(ensure_csrf_cookie, name='dispatch')
class NutricionistaProfileView(generics.RetrieveUpdateAPIView):
    """GET, PATCH /api/user/nutricionistas/me/"""
    serializer_class = NutricionistaUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Devuelve el perfil del nutricionista logueado
        return getattr(self.request.user, 'nutricionista', None)

    def get(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance:
            return Response({"detail": "Perfil de nutricionista no encontrado."}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


@method_decorator(ensure_csrf_cookie, name='dispatch')
class PacienteProfileView(generics.RetrieveUpdateAPIView):
    """GET, PATCH /api/user/pacientes/me/"""
    serializer_class = PacienteUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Devuelve el perfil del paciente logueado
        return getattr(self.request.user, 'paciente', None)

    def get(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance:
            return Response({"detail": "Perfil de paciente no encontrado."}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


from django.http import JsonResponse

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@ensure_csrf_cookie
def csrf_cookie_view(request):
    """Vista para forzar el envío de la cookie CSRF."""
    return JsonResponse({"detail": "CSRF cookie set"})


# POST /api/user/me/password_changed/
# Marca que el usuario ya cambió la contraseña (must_change_password=False)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def marcar_password_cambiada(request):
    user = request.user
    if hasattr(user, 'must_change_password') and user.must_change_password:
        user.must_change_password = False
        user.save(update_fields=['must_change_password'])
    return Response({'ok': True}, status=status.HTTP_200_OK)


# apps/user/views.py

class PreguntasListView(APIView):
    """GET /api/user/preguntas/?scope=inicial|seguimiento (default: inicial)"""
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        scope = (request.query_params.get("scope") or "inicial").lower()
        nutri = getattr(request.user, "nutricionista", None)
        base = Pregunta.objects.filter(activo=True)
        if scope == "inicial":
            base = base.filter(es_inicial=True)
        # generales + personalizadas del nutri
        qs = base.filter(Q(owner__isnull=True) | Q(owner=nutri)).order_by("orden","id")
        # deduplicar por codigo, priorizando del nutri
        out, vistos = [], set()
        for p in sorted(qs, key=lambda x: (0 if x.owner_id else 1, x.orden, x.id)):
            key = (p.codigo or f"id:{p.id}")
            if key in vistos: continue
            vistos.add(key); out.append(p)
        data = PreguntaSerializer(out, many=True).data
        return Response(data, status=status.HTTP_200_OK)

class ConsultaInicialView(APIView):
    """POST /api/user/consultas/inicial/"""
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        ser = ConsultaInicialSerializer(data=request.data, context={"request": request})
        if ser.is_valid():
            data = ser.save()
            return Response(data, status=status.HTTP_201_CREATED)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class ConsultaSeguimientoView(APIView):
    """POST /api/user/consultas/seguimiento/"""
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        ser = ConsultaSeguimientoSerializer(data=request.data, context={"request": request})
        if ser.is_valid():
            data = ser.save()
            return Response(data, status=status.HTTP_201_CREATED)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class ConsultasPacienteListView(APIView):
    """GET /api/user/consultas/?paciente_id=..."""
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        paciente_id = request.query_params.get("paciente_id")
        if not paciente_id:
            return Response({"paciente_id":"Requerido"}, status=status.HTTP_400_BAD_REQUEST)
        qs = Consulta.objects.filter(paciente_id=paciente_id).order_by("-fecha","-id")
        from .serializers import ConsultaDetailSerializer
        data = ConsultaDetailSerializer(qs, many=True).data
        return Response(data, status=status.HTTP_200_OK)
    





class PacientesNutricionistaListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        nutri = getattr(request.user, "nutricionista", None)
        if nutri is None:
            return Response({"detail": "Solo nutricionistas pueden ver pacientes"}, status=403)

        asignaciones = AsignacionNutricionistaPaciente.objects.filter(
            nutricionista=nutri
        ).select_related("paciente")

        pacientes = [a.paciente for a in asignaciones]
        data = PacienteListSerializer(pacientes, many=True).data
        return Response(data)



class PacienteDetailView(RetrieveAPIView):
    queryset = Paciente.objects.all()
    serializer_class = PacienteDetailSerializer
    lookup_field = "id"


# --- API: preguntas personalizadas ---
# --- API: preguntas personalizadas ---
from rest_framework import mixins, viewsets, permissions
from .models import Pregunta

from .serializers import (
    PreguntaPersonalizadaCreateSerializer,
    PreguntaSerializer,
)

class PreguntaPersonalizadaViewSet(mixins.CreateModelMixin,
                                     mixins.ListModelMixin,
                                     mixins.RetrieveModelMixin,
                                     mixins.UpdateModelMixin,
                                     mixins.DestroyModelMixin,
                                     viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # ✅ coherente con tu PreguntasListView: owner = nutricionista
        nutri = getattr(self.request.user, "nutricionista", None)
        return Pregunta.objects.filter(owner=nutri).order_by("-id")

    def get_serializer_class(self):
        return PreguntaSerializer if self.action == "list" else PreguntaPersonalizadaCreateSerializer

    def get_serializer_context(self):
        return {"request": self.request}

# --- Vista para desvincular cuentas sociales (AJAX friendly) ---
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from social_django.utils import load_strategy, load_backend
from social_core.exceptions import AuthException
import requests

@login_required
@require_POST
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def custom_disconnect(request, backend):
    strategy = load_strategy(request)
    backend_instance = load_backend(strategy, backend, redirect_uri=None)
    backend_instance.disconnect(user=request.user)
    return JsonResponse({'status': 'ok'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def link_google_account(request):
    """
    Vincula una cuenta de Google usando el access_token.
    Este endpoint debe usarse en lugar del flujo web tradicional
    para garantizar consistencia en el UID.
    """
    access_token = request.data.get('access_token')
    if not access_token:
        return Response(
            {'error': 'access_token es requerido'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Obtener información del usuario de Google
        google_user_info_url = 'https://www.googleapis.com/oauth2/v2/userinfo'
        headers = {'Authorization': f'Bearer {access_token}'}
        response = requests.get(google_user_info_url, headers=headers)
        
        if response.status_code != 200:
            return Response(
                {'error': 'Token inválido o expirado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        google_data = response.json()
        google_id = google_data.get('id')
        google_email = google_data.get('email')
        
        if not google_id or not google_email:
            return Response(
                {'error': 'No se pudo obtener la información de Google'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar que el email de Google coincida con el del usuario
        if google_email != request.user.email:
            return Response(
                {'error': 'El correo de Google no coincide con el correo de tu cuenta'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar si ya existe una vinculación
        from social_django.models import UserSocialAuth
        existing = UserSocialAuth.objects.filter(
            user=request.user,
            provider='google-oauth2'
        ).first()
        
        if existing:
            # Actualizar el UID si es diferente (por si estaba mal)
            if existing.uid != google_id:
                existing.uid = google_id
                existing.extra_data = google_data
                existing.save()
                return Response({
                    'status': 'updated',
                    'message': 'Vinculación actualizada correctamente'
                })
            return Response({
                'status': 'already_linked',
                'message': 'Esta cuenta ya está vinculada'
            })
        
        # Crear la vinculación
        UserSocialAuth.objects.create(
            user=request.user,
            provider='google-oauth2',
            uid=google_id,
            extra_data=google_data
        )
        
        return Response({
            'status': 'linked',
            'message': 'Cuenta vinculada correctamente'
        })
        
    except requests.RequestException as e:
        return Response(
            {'error': f'Error al comunicarse con Google: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        return Response(
            {'error': f'Error al vincular cuenta: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def google_oauth_login(request):
    """
    Login con Google usando access_token.
    Este endpoint reemplaza /auth/o/google-oauth2/ de Djoser
    para usar el flujo de popup en lugar del flujo de redirección.
    """
    access_token = request.data.get('access_token')
    if not access_token:
        return Response(
            {'non_field_errors': ['access_token es requerido']},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Obtener información del usuario de Google
        import requests
        google_user_info_url = 'https://www.googleapis.com/oauth2/v2/userinfo'
        headers = {'Authorization': f'Bearer {access_token}'}
        response = requests.get(google_user_info_url, headers=headers)
        
        if response.status_code != 200:
            return Response(
                {'non_field_errors': ['Token inválido o expirado']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        google_data = response.json()
        google_id = google_data.get('id')
        google_email = google_data.get('email')
        
        if not google_id or not google_email:
            return Response(
                {'non_field_errors': ['No se pudo obtener la información de Google']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar la vinculación con este google_id (UID)
        from social_django.models import UserSocialAuth
        try:
            social_auth = UserSocialAuth.objects.select_related('user').get(
                provider='google-oauth2',
                uid=google_id
            )
        except UserSocialAuth.DoesNotExist:
            return Response(
                {'non_field_errors': [
                    'Esta cuenta de Google no está vinculada a ningún usuario. '
                    'Por favor, inicia sesión con tu DNI y contraseña, luego '
                    'vincula tu cuenta de Google desde el panel de configuración.'
                ]},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = social_auth.user
        
        # Verificar que el usuario esté activo
        if not user.is_active:
            return Response(
                {'non_field_errors': ['Esta cuenta está desactivada']},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Generar tokens JWT usando SimpleJWT
        from rest_framework_simplejwt.tokens import RefreshToken
        
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        
        return Response({
            'access': str(access),
            'refresh': str(refresh),
        }, status=status.HTTP_200_OK)
        
    except requests.RequestException as e:
        return Response(
            {'non_field_errors': [f'Error al comunicarse con Google: {str(e)}']},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response(
            {'non_field_errors': [f'Error al iniciar sesión: {str(e)}']},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ──────────────────────────────────────────────────────────────────────
# Sistema de Plantillas
# ──────────────────────────────────────────────────────────────────────

from .models import PlantillaConsulta, PlantillaPregunta
from .serializers import (
    PlantillaConsultaSerializer,
    PlantillaConsultaListSerializer,
    PlantillaConsultaCreateUpdateSerializer,
    PlantillaPreguntaSerializer,
)


class PlantillaConsultaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar plantillas de consulta.
    
    - list: Listar plantillas del nutricionista + plantillas del sistema
    - retrieve: Detalle de plantilla con todas sus preguntas
    - create: Crear nueva plantilla
    - update/partial_update: Actualizar plantilla
    - destroy: Eliminar plantilla (solo propias)
    
    Actions adicionales:
    - duplicar: Duplicar una plantilla existente
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Devuelve:
        - Plantillas del sistema (owner=None)
        - Plantillas del nutricionista actual (owner=nutricionista)
        """
        nutri = getattr(self.request.user, 'nutricionista', None)
        if not nutri:
            # Si no es nutricionista, devolver vacío
            return PlantillaConsulta.objects.none()
        
        # Filtrar por tipo_consulta si se especifica en query params
        queryset = PlantillaConsulta.objects.filter(
            Q(owner=None) | Q(owner=nutri)
        ).select_related('owner').prefetch_related('preguntas_config__pregunta')
        
        tipo_consulta = self.request.query_params.get('tipo_consulta')
        if tipo_consulta:
            queryset = queryset.filter(tipo_consulta=tipo_consulta)
        
        activo = self.request.query_params.get('activo')
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() in ['true', '1', 'yes'])
        
        return queryset.order_by('-es_predeterminada', 'tipo_consulta', 'nombre')
    
    def get_serializer_class(self):
        """Usar serializers diferentes según la acción"""
        if self.action == 'list':
            return PlantillaConsultaListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PlantillaConsultaCreateUpdateSerializer
        return PlantillaConsultaSerializer
    
    def get_serializer_context(self):
        """Agregar owner al contexto para create/update"""
        context = super().get_serializer_context()
        nutri = getattr(self.request.user, 'nutricionista', None)
        context['owner'] = nutri
        return context
    
    def perform_create(self, serializer):
        """El owner ya se asigna en el serializer desde el contexto"""
        serializer.save()
    
    def perform_update(self, serializer):
        """Actualizar plantilla"""
        serializer.save()
    
    def perform_destroy(self, instance):
        """Solo permitir eliminar plantillas propias (no del sistema)"""
        if instance.owner_id is None:
            raise PermissionDenied("No puedes eliminar plantillas del sistema")
        
        nutri = getattr(self.request.user, 'nutricionista', None)
        is_superuser = getattr(self.request.user, 'is_superuser', False)

        if not nutri and not is_superuser:
            raise PermissionDenied("Solo un nutricionista puede eliminar plantillas")

        if nutri and instance.owner_id != nutri.id and not is_superuser:
            raise PermissionDenied("No puedes eliminar plantillas de otros nutricionistas")
        
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def duplicar(self, request, pk=None):
        """
        Duplica una plantilla existente.
        
        Body (opcional):
        - nuevo_nombre: str (default: "{nombre} (copia)")
        """
        plantilla = self.get_object()
        nutri = getattr(request.user, 'nutricionista', None)
        
        nuevo_nombre = request.data.get('nuevo_nombre', f"{plantilla.nombre} (copia)")
        nueva_plantilla = plantilla.duplicar(nuevo_owner=nutri, nuevo_nombre=nuevo_nombre)
        
        serializer = PlantillaConsultaSerializer(nueva_plantilla)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def predeterminadas(self, request):
        """
        Devuelve las plantillas predeterminadas del nutricionista.
        Query params:
        - tipo_consulta: INICIAL o SEGUIMIENTO (opcional)
        """
        nutri = getattr(request.user, 'nutricionista', None)
        if not nutri:
            return Response([], status=status.HTTP_200_OK)
        
        queryset = PlantillaConsulta.objects.filter(
            owner=nutri,
            es_predeterminada=True,
            activo=True
        )
        
        tipo_consulta = request.query_params.get('tipo_consulta')
        if tipo_consulta:
            queryset = queryset.filter(tipo_consulta=tipo_consulta)
        
        serializer = PlantillaConsultaListSerializer(queryset, many=True)
        return Response(serializer.data)


class PlantillaPreguntaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar preguntas dentro de una plantilla.
    Endpoint anidado: /plantillas/{plantilla_id}/preguntas/
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PlantillaPreguntaSerializer
    
    def get_queryset(self):
        """Filtrar preguntas de la plantilla especificada"""
        plantilla_id = self.kwargs.get('plantilla_pk')
        nutri = getattr(self.request.user, 'nutricionista', None)
        
        if not nutri or not plantilla_id:
            return PlantillaPregunta.objects.none()
        
        # Verificar que la plantilla pertenezca al nutricionista o sea del sistema
        plantilla = PlantillaConsulta.objects.filter(
            id=plantilla_id
        ).filter(
            Q(owner=None) | Q(owner=nutri)
        ).first()
        
        if not plantilla:
            return PlantillaPregunta.objects.none()
        
        return PlantillaPregunta.objects.filter(
            plantilla=plantilla
        ).select_related('pregunta').order_by('orden')
    
    def get_serializer_context(self):
        """Agregar plantilla al contexto"""
        context = super().get_serializer_context()
        plantilla_id = self.kwargs.get('plantilla_pk')
        if plantilla_id:
            context['plantilla'] = PlantillaConsulta.objects.filter(id=plantilla_id).first()
        return context
    
    def perform_create(self, serializer):
        """Asignar plantilla al crear pregunta"""
        plantilla_id = self.kwargs.get('plantilla_pk')
        plantilla = PlantillaConsulta.objects.get(id=plantilla_id)
        
        # Verificar permisos: solo el owner puede editar
        nutri = getattr(self.request.user, 'nutricionista', None)
        if plantilla.owner_id and plantilla.owner_id != nutri.id:
            raise PermissionDenied("No puedes modificar plantillas de otros nutricionistas")
        if plantilla.owner_id is None:
            raise PermissionDenied("No puedes modificar plantillas del sistema")
        
        serializer.save(plantilla=plantilla)
    
    def perform_update(self, serializer):
        """Verificar permisos antes de actualizar"""
        instance = self.get_object()
        nutri = getattr(self.request.user, 'nutricionista', None)
        
        if instance.plantilla.owner_id and instance.plantilla.owner_id != nutri.id:
            raise PermissionDenied("No puedes modificar plantillas de otros nutricionistas")
        if instance.plantilla.owner_id is None:
            raise PermissionDenied("No puedes modificar plantillas del sistema")
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Verificar permisos antes de eliminar"""
        nutri = getattr(self.request.user, 'nutricionista', None)
        
        if instance.plantilla.owner_id and instance.plantilla.owner_id != nutri.id:
            raise PermissionDenied("No puedes modificar plantillas de otros nutricionistas")
        if instance.plantilla.owner_id is None:
            raise PermissionDenied("No puedes modificar plantillas del sistema")
        
        instance.delete()


# ──────────────────────────────────────────────────────────────────────
# Vistas públicas (turnero público)
# ──────────────────────────────────────────────────────────────────────

from rest_framework.permissions import AllowAny
from .serializers import NutricionistaPublicSerializer


class NutricionistasPublicosListView(generics.ListAPIView):
    """
    GET /api/nutricionistas/publicos/
    Lista todos los nutricionistas que tienen turnero público habilitado.
    No requiere autenticación.
    """
    serializer_class = NutricionistaPublicSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        # Obtener nutricionistas activos con sus configuraciones
        from apps.agenda.models import ProfessionalSettings
        
        # Obtener IDs de nutricionistas con booking público habilitado
        settings_ids = ProfessionalSettings.objects.filter(
            booking_mode='PUBLICO'
        ).values_list('nutricionista_id', flat=True)
        
        return Nutricionista.objects.filter(
            id__in=settings_ids,
            user__is_active=True
        ).prefetch_related('especialidades').order_by('apellido', 'nombre')


class NutricionistaPublicDetailView(generics.RetrieveAPIView):
    """
    GET /api/nutricionistas/<id>/publico/
    Obtiene la información pública de un nutricionista específico.
    No requiere autenticación.
    """
    serializer_class = NutricionistaPublicSerializer
    permission_classes = [AllowAny]
    queryset = Nutricionista.objects.all()
    lookup_field = 'id'
    
    def get_queryset(self):
        # Verificar que el nutricionista tenga booking público habilitado
        from apps.agenda.models import ProfessionalSettings
        
        settings_ids = ProfessionalSettings.objects.filter(
            booking_mode='PUBLICO'
        ).values_list('nutricionista_id', flat=True)
        
        return Nutricionista.objects.filter(
            id__in=settings_ids,
            user__is_active=True
        ).prefetch_related('especialidades')

