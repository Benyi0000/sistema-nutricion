from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    NutricionistaAltaView,
    EspecialidadListView,
    marcar_password_cambiada,
    PreguntasListView,
    ConsultaInicialView,
    ConsultaSeguimientoView,
    ConsultasPacienteListView,
    PacientesNutricionistaListView,
    PacienteDetailView,
    PreguntaPersonalizadaViewSet,  # <- ViewSet para banco personalizado
)

# Router para endpoints de preguntas personalizadas (list/create)
router = DefaultRouter()
router.register(
    r"preguntas/personalizadas",
    PreguntaPersonalizadaViewSet,
    basename="pregunta-personalizada",
)

urlpatterns = [
    path("pacientes/<int:id>/", PacienteDetailView.as_view()),
    path("pacientes/", PacientesNutricionistaListView.as_view()),
    path("preguntas/", PreguntasListView.as_view()),
    path("consultas/inicial/", ConsultaInicialView.as_view()),
    path("consultas/seguimiento/", ConsultaSeguimientoView.as_view()),
    path("consultas/", ConsultasPacienteListView.as_view()),
    path("nutricionistas/", NutricionistaAltaView.as_view()),
    path("especialidades/", EspecialidadListView.as_view()),
    path("me/password_changed/", marcar_password_cambiada),
]

# Agrega las rutas del router (preguntas/personalizadas/)
urlpatterns += router.urls
