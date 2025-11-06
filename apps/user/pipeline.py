# apps/user/pipeline.py
import logging
from django.contrib.auth import get_user_model
from social_core.exceptions import AuthForbidden

logger = logging.getLogger(__name__)

User = get_user_model()


def require_existing_user(strategy, details, backend, user=None, *args, **kwargs):
    """
    Pipeline que SOLO permite login si el usuario ya existe y está vinculado.
    NO crea usuarios nuevos.
    
    Este pipeline debe ir DESPUÉS de 'social_user' y 'associate_by_email'.
    Si no se encontró un usuario asociado, interrumpe el flujo.
    """
    if user:
        # El usuario existe y está vinculado, todo bien
        logger.info(f"Usuario encontrado: {user.dni} - {user.email}")
        return {'user': user}
    
    # Si llegamos aquí, significa que no hay un usuario vinculado
    email = details.get('email')
    logger.warning(f"Intento de login con Google sin vinculación previa: {email}")
    
    # Buscar si existe un usuario con ese email pero sin vincular
    existing_user = User.objects.filter(email=email).first()
    if existing_user:
        # El usuario existe pero no está vinculado
        logger.warning(f"Usuario existe pero no está vinculado a Google: {existing_user.dni}")
        raise AuthForbidden(
            backend,
            "Esta cuenta de Google no está vinculada a ningún usuario. Por favor, vincule su cuenta desde el panel de configuración."
        )
    else:
        # No existe ningún usuario con ese email
        logger.warning(f"No existe usuario con email: {email}")
        raise AuthForbidden(
            backend,
            "No existe un usuario con este correo electrónico. Contacte al administrador para crear su cuenta."
        )


def save_profile_details(backend, details, user=None, *args, **kwargs):
    """
    Guarda detalles del perfil en extra_data de la autenticación social.
    """
    social = kwargs.get('social')
    if not social:
        logger.warning("No se encontró objeto social en el pipeline")
        return
    
    logger.info(f"Guardando detalles del perfil. Usuario: {user.dni if user else 'N/A'}")
    
    # Guardar email
    if 'email' in details:
        social.extra_data['email'] = details['email']
        logger.info(f"Email guardado en extra_data: {details['email']}")
    
    # Guardar nombre y apellido si están disponibles
    if 'first_name' in details:
        social.extra_data['first_name'] = details['first_name']
    if 'last_name' in details:
        social.extra_data['last_name'] = details['last_name']
    
    social.save()
    logger.info(f"Extra data actualizado: {social.extra_data}")
