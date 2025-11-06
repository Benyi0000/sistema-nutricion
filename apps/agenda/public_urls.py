from django.urls import path
from . import views

urlpatterns = [
    # GET /api/public/agenda/slots/?nutricionista_id=...&...
    path(
        'slots/',
        views.PublicSlotsView.as_view(),
        name='public-slots'
    ),
    
    # POST /api/public/agenda/turnos/
    path(
        'turnos/',
        views.PublicTurnoCreateView.as_view(),
        name='public-turno-create'
    ),
    
    # POST /api/public/agenda/turnos/verify/
    path(
        'turnos/verify/',
        views.PublicTurnoVerifyView.as_view(),
        name='public-turno-verify'
    ),
    
    # GET /api/public/agenda/ubicaciones/?nutricionista=<id>
    path(
        'ubicaciones/',
        views.PublicUbicacionesView.as_view(),
        name='public-ubicaciones'
    ),
    
    # GET /api/public/agenda/tipos-consulta/?nutricionista=<id>
    path(
        'tipos-consulta/',
        views.PublicTiposConsultaView.as_view(),
        name='public-tipos-consulta'
    ),
]