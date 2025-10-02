from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.core.paginator import Paginator
from django.db.models import Q
from .models import Especialidad, Nutricionista
from .serializers import (
    NutricionistaAltaSerializer,
    EspecialidadSerializer,
    NutricionistaListSerializer,
)
from .models import Especialidad
from .serializers import (
    NutricionistaAltaSerializer,
    EspecialidadSerializer,
)
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
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
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

        qs = qs.order_by('user__last_name', 'user__first_name')
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
