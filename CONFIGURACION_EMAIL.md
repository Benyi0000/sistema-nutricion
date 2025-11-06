# Configuración de Email para Sistema de Nutrición

Este sistema soporta dos niveles de configuración de email:

1. **Email del Sistema**: Para notificaciones automáticas de turnos cuando el nutricionista no tiene email configurado
2. **Email por Nutricionista**: Cada nutricionista puede tener su propio email SMTP para enviar notificaciones a sus pacientes

## 1. Configurar Email del Sistema (Gmail)

### Paso 1: Crear una cuenta de Gmail para el sistema

Crea una cuenta de Gmail específica para el sistema, por ejemplo: `sistema.nutricion2024@gmail.com`

### Paso 2: Habilitar "Contraseñas de aplicación" en Gmail

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Ve a "Seguridad" → "Verificación en dos pasos" (debes habilitarla primero)
3. Busca "Contraseñas de aplicaciones"
4. Genera una contraseña para "Correo" en "Otro dispositivo"
5. **Guarda esta contraseña** (será algo como: `abcd efgh ijkl mnop`)

### Paso 3: Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto (si no existe) con:

```env
# === EMAIL DEL SISTEMA ===
# Se usa cuando el nutricionista NO tiene email personalizado configurado

# En desarrollo: usa DEBUG=True para guardar emails en archivos
DEBUG=True

# En producción: cambia a False y configura estas variables
SYSTEM_EMAIL_HOST=smtp.gmail.com
SYSTEM_EMAIL_PORT=587
SYSTEM_EMAIL_USE_TLS=True
SYSTEM_EMAIL_USE_SSL=False
SYSTEM_EMAIL_HOST_USER=sistema.nutricion2024@gmail.com
SYSTEM_EMAIL_HOST_PASSWORD=abcd efgh ijkl mnop
SYSTEM_DEFAULT_FROM_EMAIL=Sistema Nutrición <sistema.nutricion2024@gmail.com>
```

### Paso 4: Probar en desarrollo

Mientras `DEBUG=True`, los emails se guardan en la carpeta `sent_emails/` en lugar de enviarse.

Para probar con emails reales:
1. Cambia temporalmente `DEBUG=False` en `.env`
2. Reinicia Django
3. Crea un turno de prueba
4. Verifica que llegue el email

## 2. Configurar Email por Nutricionista

### Desde el Admin de Django

1. Ve a http://localhost:8000/admin/
2. Ingresa a "Nutricionistas"
3. Edita o crea un nutricionista
4. Completa los campos de email:
   - **Email host**: `smtp.gmail.com`
   - **Email port**: `587`
   - **Email username**: `nutricionista.email@gmail.com`
   - **Email password**: (contraseña de aplicación de Gmail)
   - **Email use tls**: ✓ (marcado)
   - **Email use ssl**: ☐ (desmarcado)

### Desde la API REST

```bash
# Actualizar el nutricionista con su configuración de email
PATCH /api/user/nutricionistas/{id}/

{
  "email_host": "smtp.gmail.com",
  "email_port": 587,
  "email_username": "nutricionista.email@gmail.com",
  "email_password": "abcd efgh ijkl mnop",
  "email_use_tls": true,
  "email_use_ssl": false
}
```

## 3. Lógica de Envío de Emails

El sistema usa esta jerarquía para decidir desde qué email enviar:

```
┌─────────────────────────────────────────┐
│ ¿El turno tiene un nutricionista_id?    │
└───────────┬─────────────────────────────┘
            │
       ┌────▼────┐
       │   SÍ    │
       └────┬────┘
            │
┌───────────▼──────────────────────────────┐
│ ¿El nutricionista tiene email config?    │
└────────────┬─────────────────────────────┘
             │
        ┌────▼────┐
        │   SÍ    │────► Enviar desde email del nutricionista
        └─────────┘
             │
        ┌────▼────┐
        │   NO    │────► Enviar desde email del sistema
        └─────────┘
```

## 4. Troubleshooting

### Error: "SMTPAuthenticationError"

**Causa**: Contraseña incorrecta o no estás usando "Contraseña de aplicación"

**Solución**:
1. Verifica que tengas la verificación en dos pasos habilitada en Gmail
2. Genera una nueva contraseña de aplicación
3. Copia la contraseña SIN espacios en el `.env`

### Error: "SMTPConnectError" o "Connection refused"

**Causa**: Puerto o host incorrecto, o firewall bloqueando

**Solución**:
1. Verifica que `EMAIL_PORT=587` y `EMAIL_USE_TLS=True`
2. Si usas puerto 465, debes cambiar `EMAIL_USE_SSL=True` y `EMAIL_USE_TLS=False`
3. Verifica tu firewall

### Los emails no llegan

**En desarrollo**:
- Verifica que `DEBUG=False` (si quieres emails reales)
- Si `DEBUG=True`, revisa la carpeta `sent_emails/`

**En producción**:
- Verifica los logs de Celery: busca "Email enviado exitosamente"
- Verifica la tabla `NotificationLog`: campo `delivered` debe ser `True`
- Revisa la carpeta de SPAM del destinatario

### Ver logs de email

```python
# En la terminal de Django o Celery, busca:
INFO - Email enviado exitosamente para Log 123 (Template: public_booking_verification)

# Si hay error:
ERROR - Error al enviar email para Log 123: ...
```

## 5. Seguridad

⚠️ **IMPORTANTE**: 

- **NUNCA** subas el archivo `.env` a Git
- Agrega `.env` al `.gitignore`
- En producción, usa variables de entorno del sistema operativo o servicios como AWS Secrets Manager
- Las contraseñas de los nutricionistas se guardan en **texto plano** en la base de datos
  - Para mayor seguridad, considera encriptar estos campos usando `django-encrypted-model-fields`

## 6. Otros proveedores de email

### Gmail
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

### Yahoo
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=SG.xxxxxxxxxx
```

## 7. Testing

Para probar el sistema completo:

```bash
# 1. Iniciar RabbitMQ (en WSL)
docker run -it --rm --name rabbitqm -p 5672:5672 -p 15672:15672 rabbitmq:management

# 2. Iniciar Celery worker (en PowerShell)
.\venv\Scripts\python.exe -m celery -A core worker --pool=solo -l info

# 3. Iniciar Django (en otra terminal)
.\venv\Scripts\python.exe manage.py runserver

# 4. Crear un turno de prueba usando turno_test.json
Invoke-RestMethod -Uri "http://localhost:8000/api/public/agenda/turnos/" -Method POST -ContentType "application/json" -Body (Get-Content turno_test.json -Raw)

# 5. Verificar:
# - En desarrollo: archivo en sent_emails/
# - En producción: email real en la bandeja del destinatario
# - En base de datos: NotificationLog con delivered=True
```
