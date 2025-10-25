from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    NutricionistaAltaView,
    NutricionistaProfileView,
    PacienteProfileView,  # Agregar la nueva vista
    EspecialidadListView,
    marcar_password_cambiada,
    csrf_cookie_view,
    PreguntasListView,
    ConsultaInicialView,
    ConsultaSeguimientoView,
    ConsultasPacienteListView,
    PacientesNutricionistaListView,
    PacienteDetailView,
    PreguntaPersonalizadaViewSet,  # <- ViewSet para banco personalizado
    custom_disconnect,
    link_google_account,
    google_oauth_login,
)

# Router para endpoints de preguntas personalizadas (list/create)
router = DefaultRouter()
router.register(
    r"preguntas/personalizadas",
    PreguntaPersonalizadaViewSet,
    basename="pregunta-personalizada",
)

urlpatterns = [
    path("google-login/", google_oauth_login, name="google_oauth_login"),
    path("link-google/", link_google_account, name="link_google_account"),
    path("disconnect/<str:backend>/", custom_disconnect, name="custom_disconnect"),
    path("pacientes/<int:id>/", PacienteDetailView.as_view()),
    path("pacientes/me/", PacienteProfileView.as_view()),  # Agregar endpoint para perfil del paciente
    path("pacientes/", PacientesNutricionistaListView.as_view()),
    path("preguntas/", PreguntasListView.as_view()),
    path("consultas/inicial/", ConsultaInicialView.as_view()),
    path("consultas/seguimiento/", ConsultaSeguimientoView.as_view()),
    path("consultas/", ConsultasPacienteListView.as_view()),
    path("nutricionistas/me/", NutricionistaProfileView.as_view()),
    path("nutricionistas/", NutricionistaAltaView.as_view()),
    path("especialidades/", EspecialidadListView.as_view()),
    path("me/password_changed/", marcar_password_cambiada),
    path("csrf-cookie/", csrf_cookie_view),
]

# Agrega las rutas del router (preguntas/personalizadas/)
urlpatterns += router.urls
