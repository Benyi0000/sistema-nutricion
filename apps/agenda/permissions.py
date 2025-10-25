# apps/agenda/permissions.py
from rest_framework import permissions
from apps.user.models import Nutricionista

class IsNutriOwner(permissions.BasePermission):
    """
    Permiso personalizado para permitir solo a los nutricionistas
    ver o editar sus propios objetos de agenda (Ubicacion, Disponibilidad, etc.)
    """

    def has_permission(self, request, view):
        # Primero, verifica que el usuario esté autenticado
        print(f"🔍 IsNutriOwner.has_permission:")
        print(f"   Usuario: {request.user}")
        print(f"   ¿Autenticado?: {request.user.is_authenticated if request.user else False}")
        
        if not request.user or not request.user.is_authenticated:
            print("   ❌ Usuario NO autenticado")
            return False
        
        # Luego, verifica que el usuario tenga un perfil de Nutricionista
        try:
            nutri = request.user.nutricionista
            print(f"   ✅ Usuario tiene perfil de Nutricionista (ID: {nutri.id})")
        except Nutricionista.DoesNotExist:
            print("   ❌ Usuario NO tiene perfil de Nutricionista")
            return False # No es un nutricionista, denegar acceso.
        
        return True # Es un nutricionista autenticado

    def has_object_permission(self, request, view, obj):
        # 'obj' es la instancia del modelo (ej: Ubicacion, BloqueoDisponibilidad)
        
        # El modelo 'Ubicacion' tiene el nutricionista en obj.nutricionista
        if hasattr(obj, 'nutricionista'):
            return obj.nutricionista == request.user.nutricionista
        
        # El modelo 'DisponibilidadHoraria' tiene el nutricionista en obj.ubicacion.nutricionista
        # (Aunque tu modelo avanzado lo tiene directo, así cubrimos ambos)
        if hasattr(obj, 'ubicacion'):
            return obj.ubicacion.nutricionista == request.user.nutricionista
            
        return False