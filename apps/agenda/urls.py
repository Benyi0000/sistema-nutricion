
# apps/agenda/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UbicacionViewSet,
    TipoConsultaConfigViewSet,
    DisponibilidadHorariaViewSet,
    BloqueoDisponibilidadViewSet,
    ProfessionalSettingsViewSet,
    SlotsAPIView,
    TurnoViewSet, # Importar la nueva vista
    # TurnoViewSet (lo añadiremos después)
)

# Creamos un router para registrar nuestros ViewSets
router = DefaultRouter()
router.register(r'ubicaciones', UbicacionViewSet, basename='ubicacion')
router.register(r'tipos-consulta', TipoConsultaConfigViewSet, basename='tipoconsulta')
router.register(r'disponibilidades', DisponibilidadHorariaViewSet, basename='disponibilidad')
router.register(r'bloqueos', BloqueoDisponibilidadViewSet, basename='bloqueo')
router.register(r'professional-settings', ProfessionalSettingsViewSet, basename='professionalsettings')
router.register(r'turnos', TurnoViewSet, basename='turno')

urlpatterns = [
    path('', include(router.urls)),
    # Nueva ruta para los slots
    path(
        'nutricionista/<int:nutricionista_id>/slots/',
        SlotsAPIView.as_view(),
        name='nutricionista-slots'
    ),
]