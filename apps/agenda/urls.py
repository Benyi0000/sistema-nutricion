
# apps/agenda/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Creamos un router para registrar nuestros ViewSets
router = DefaultRouter()

# Registra los endpoints para la configuración del Nutricionista
router.register(r'ubicaciones', views.UbicacionViewSet, basename='ubicacion')
router.register(r'tipos-consulta', views.TipoConsultaConfigViewSet, basename='tipo-consulta')
router.register(r'disponibilidad', views.DisponibilidadHorariaViewSet, basename='disponibilidad')
router.register(r'bloqueos', views.BloqueoDisponibilidadViewSet, basename='bloqueo')

# --- PRÓXIMAMENTE (Día 2 - Parte B) ---
# Aquí registraremos el TurnoViewSet y el SlotsAPIView

urlpatterns = [
    # Incluye todas las URLs generadas por el router
    path('', include(router.urls)),
]