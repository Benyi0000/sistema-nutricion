# apps/user/public_urls.py
from django.urls import path
from . import views

urlpatterns = [
    # GET /api/public/nutricionistas/
    path('', views.NutricionistasPublicosListView.as_view(), name='nutricionistas-publicos-list'),
    
    # GET /api/public/nutricionistas/<id>/
    path('<int:id>/', views.NutricionistaPublicDetailView.as_view(), name='nutricionista-publico-detail'),
]
