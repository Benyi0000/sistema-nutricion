import logging
from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail, get_connection
from django.conf import settings
from .models import NotificationLog

# Configurar un logger para esta app
logger = logging.getLogger(__name__)

@shared_task(
    bind=True, 
    max_retries=3, 
    default_retry_delay=60,
    task_track_started=True,  # Rastrea cuando la tarea inicia
    acks_late=True  # Confirma el mensaje solo después de completar la tarea exitosamente
)
def send_notification_email(self, log_id):
    """
    Tarea de Celery para procesar un NotificationLog y enviar el email.
    
    Esta tarea es idempotente: si se ejecuta múltiples veces con el mismo log_id,
    solo procesará el email una vez (la primera).
    """
    try:
        # 1. Obtener el Log
        log = NotificationLog.objects.get(id=log_id, sent_at__isnull=True)
        
        # 2. Extraer datos
        payload = log.payload
        destinatario = payload.get('destinatario')
        template = log.template

        if not destinatario:
            logger.warning(f"NotificationLog {log_id} no tiene 'destinatario' en el payload. Marcando como fallido.")
            log.delivered = False # Marcar como fallido
            log.sent_at = timezone.now() # Marcar como procesado
            log.save()
            return

        # 3. Construir el email basado en el template
        subject = ""
        message = ""

        if template == "public_booking_verification":
            subject = "Confirma tu turno"
            message = f"""
            Hola {payload.get('nombre_paciente', 'paciente')},

            Estás a un paso de confirmar tu turno con {payload.get('nombre_nutri')}.
            
            Turno: {payload.get('tipo_consulta')}
            Cuándo: {payload.get('fecha_hora_inicio')}

            Por favor, haz clic en el siguiente enlace para confirmar tu reserva (expira en 10 minutos):
            {payload.get('verification_url')}
            """
        
        elif template == "public_booking_confirmed_paciente":
            subject = "¡Tu turno está reservado!"
            message = f"""
            Hola {payload.get('nombre_paciente', 'paciente')},

            Tu turno con {payload.get('nombre_nutri')} ha sido reservado con éxito.

            Detalles:
            Tipo de consulta: {payload.get('tipo_consulta')}
            Cuándo: {payload.get('fecha_hora_inicio')}
            Dónde: {payload.get('ubicacion_nombre')}

            ¡Te esperamos!
            """

        elif template == "public_booking_confirmed_nutri":
            subject = f"¡Nuevo turno reservado! (Paciente Público)"
            message = f"""
            Hola {payload.get('nombre_nutri')},

            Has recibido una nueva reserva de un paciente público.

            Detalles:
            Paciente: {payload.get('nombre_paciente')}
            Email: {payload.get('email_paciente')}
            Teléfono: {payload.get('telefono_paciente')}

            Turno:
            Tipo de consulta: {payload.get('tipo_consulta')}
            Cuándo: {payload.get('fecha_hora_inicio')}
            """
        
        else:
            logger.error(f"Template de email desconocido: {template} para Log {log_id}")
            return

        # 4. Determinar desde qué email enviar
        # Si existe un nutricionista_id en el payload, intentar usar su email
        from_email = settings.DEFAULT_FROM_EMAIL
        email_connection = None
        
        nutricionista_id = payload.get('nutricionista_id')
        if nutricionista_id:
            try:
                from apps.user.models import Nutricionista
                nutricionista = Nutricionista.objects.get(id=nutricionista_id)
                
                if nutricionista.has_custom_email():
                    # Usar el email personalizado del nutricionista
                    email_config = nutricionista.get_email_config()
                    from_email = email_config['DEFAULT_FROM_EMAIL']
                    
                    # Crear una conexión SMTP específica para este nutricionista
                    email_connection = get_connection(
                        host=email_config['EMAIL_HOST'],
                        port=email_config['EMAIL_PORT'],
                        username=email_config['EMAIL_HOST_USER'],
                        password=email_config['EMAIL_HOST_PASSWORD'],
                        use_tls=email_config['EMAIL_USE_TLS'],
                        use_ssl=email_config['EMAIL_USE_SSL'],
                        fail_silently=False,
                    )
                    logger.info(f"Usando email personalizado del nutricionista {nutricionista_id}: {from_email}")
                else:
                    # El nutricionista no tiene email configurado, usar el del sistema
                    logger.info(f"Nutricionista {nutricionista_id} sin email configurado, usando email del sistema")
                    if not settings.DEBUG:
                        # En producción, usar la configuración del sistema
                        email_connection = get_connection(
                            host=settings.SYSTEM_EMAIL_HOST,
                            port=settings.SYSTEM_EMAIL_PORT,
                            username=settings.SYSTEM_EMAIL_HOST_USER,
                            password=settings.SYSTEM_EMAIL_HOST_PASSWORD,
                            use_tls=settings.SYSTEM_EMAIL_USE_TLS,
                            use_ssl=settings.SYSTEM_EMAIL_USE_SSL,
                            fail_silently=False,
                        )
                        from_email = settings.SYSTEM_DEFAULT_FROM_EMAIL
            except Exception as nutri_error:
                logger.warning(f"Error al obtener nutricionista {nutricionista_id}: {nutri_error}. Usando email del sistema.")
                if not settings.DEBUG:
                    email_connection = get_connection(
                        host=settings.SYSTEM_EMAIL_HOST,
                        port=settings.SYSTEM_EMAIL_PORT,
                        username=settings.SYSTEM_EMAIL_HOST_USER,
                        password=settings.SYSTEM_EMAIL_HOST_PASSWORD,
                        use_tls=settings.SYSTEM_EMAIL_USE_TLS,
                        use_ssl=settings.SYSTEM_EMAIL_USE_SSL,
                        fail_silently=False,
                    )
                    from_email = settings.SYSTEM_DEFAULT_FROM_EMAIL
        else:
            # No hay nutricionista_id, usar el email del sistema
            logger.info("No se especificó nutricionista_id, usando email del sistema")
            if not settings.DEBUG:
                email_connection = get_connection(
                    host=settings.SYSTEM_EMAIL_HOST,
                    port=settings.SYSTEM_EMAIL_PORT,
                    username=settings.SYSTEM_EMAIL_HOST_USER,
                    password=settings.SYSTEM_EMAIL_HOST_PASSWORD,
                    use_tls=settings.SYSTEM_EMAIL_USE_TLS,
                    use_ssl=settings.SYSTEM_EMAIL_USE_SSL,
                    fail_silently=False,
                )
                from_email = settings.SYSTEM_DEFAULT_FROM_EMAIL
        
        # 5. Enviar el Email
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=from_email,
                recipient_list=[destinatario],
                fail_silently=False,
                connection=email_connection,
            )
            
            # 6. Marcar como enviado exitosamente
            log.sent_at = timezone.now()
            log.delivered = True
            log.save(update_fields=['sent_at', 'delivered'])
            
            logger.info(f"Email enviado exitosamente para Log {log_id} (Template: {template})")
            
        except Exception as email_error:
            # Error al enviar el email, marcar como fallido
            log.sent_at = timezone.now()
            log.delivered = False
            log.save(update_fields=['sent_at', 'delivered'])
            
            logger.error(f"Error al enviar email para Log {log_id}: {email_error}")
            logger.error(f"Traceback completo:", exc_info=True)
            
            # No reintentar si es un error de configuración
            if 'DEFAULT_FROM_EMAIL' in str(email_error) or 'EMAIL_BACKEND' in str(email_error):
                logger.error(f"Error de configuración de email. No se reintentará.")
                return
            
            # Reintentar si es un error de red/SMTP
            raise self.retry(exc=email_error)

    except NotificationLog.DoesNotExist:
        # Esto es normal si la tarea se duplicó en la cola o el log ya fue procesado
        logger.info(f"Log {log_id} ya fue procesado o no existe. Esta es una ejecución duplicada, ignorando de forma segura.")
    except Exception as exc:
        logger.error(f"Error al enviar email para Log {log_id}: {exc}")
        # Reintentar la tarea si es un error de red/SMTP
        raise self.retry(exc=exc)