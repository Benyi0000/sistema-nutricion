# core/settings.py
import os
import environ
from datetime import timedelta
from pathlib import Path

env = environ.Env()
environ.Env.read_env(os.path.join(Path(__file__).resolve().parent.parent, '.env'))

BASE_DIR = Path(__file__).resolve().parent.parent

# --- ENV (respeta tu .env) ---
SECRET_KEY = env("SECRET_KEY", default="dev-secret-key")
DEBUG = env.bool("DEBUG", default=True)

# DEV lists (coma-separado en tu .env)
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS_DEV", default=["*"])
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS_DEV", default=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8000", "http://127.0.0.1:8000"])
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = env.list(
    "CSRF_TRUSTED_ORIGINS_DEV",
    default=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8000", "http://127.0.0.1:8000"],
)

# --- Apps ---
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]
PROJECT_APPS = [
    'apps.agenda',
    "apps.user",
]
THIRD_PARTY_APPS = [
    "corsheaders",
    "rest_framework",
    "djoser",
    "social_django",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "ckeditor",
    "ckeditor_uploader",
]
INSTALLED_APPS = DJANGO_APPS + PROJECT_APPS + THIRD_PARTY_APPS

# --- CKEditor ---
CKEDITOR_CONFIGS = {
    "default": {
        "toolbar": "Custom",
        "toolbar_Custom": [
            ["Bold", "Italic", "Underline"],
            [
                "NumberedList",
                "BulletedList",
                "-",
                "Outdent",
                "Indent",
                "-",
                "JustifyLeft",
                "JustifyCenter",
                "JustifyRight",
                "JustifyBlock",
            ],
            ["Link", "Unlink"],
            ["RemoveFormat", "Source"],
        ],
        "autoParagraph": False,
    }
}
CKEDITOR_UPLOAD_PATH = "media/"

# --- Middleware ---
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # importante: primero
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    'social_django.middleware.SocialAuthExceptionMiddleware',
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

# --- Templates ---
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "dist")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                'social_django.context_processors.backends',       
                'social_django.context_processors.login_redirect',
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"

# --- Database (usa tu DATABASES_URL si existe; si está vacío → SQLite) ---
DB_URL = env("DATABASES_URL", default="").strip()
if DB_URL:
    # ejemplo: postgres://user:pass@host:port/dbname
    DATABASES = {"default": env.db("DATABASES_URL")}
    DATABASES["default"]["ATOMIC_REQUESTS"] = True
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": os.path.join(BASE_DIR, "db.sqlite3"),
        }
    }

# --- Hashers (Argon2) ---
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
    "django.contrib.auth.hashers.BCryptSHA256PasswordHasher",
]

# --- Password validation ---
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --- i18n / TZ ---
LANGUAGE_CODE = "es"
TIME_ZONE = "America/Argentina/Cordoba"
USE_I18N = True
USE_L10N = True
USE_TZ = True

# --- Static & Media ---
STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
STATICFILES_DIRS = [os.path.join(BASE_DIR, "dist")]

MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- DRF / JWT ---
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
}

SIMPLE_JWT = {
    "AUTH_HEADER_TYPES": ("Bearer",),  # Authorization: Bearer <token> (estándar OAuth2/JWT)
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60 * 24),  # 24h
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}

# --- Djoser (login por DNI) ---
DJOSER = {
    "LOGIN_FIELD": "dni",
    "USER_CREATE_PASSWORD_RETYPE": True,
    "SET_PASSWORD_RETYPE": True,
    "PASSWORD_RESET_CONFIRM_RETYPE": True,
    "SEND_CONFIRMATION_EMAIL": False,
    "SEND_ACTIVATION_EMAIL": False,
    "USERNAME_CHANGED_EMAIL_CONFIRMATION": False,
    "PASSWORD_CHANGED_EMAIL_CONFIRMATION": False,
    "PASSWORD_RESET_CONFIRM_URL": "#/password/reset/confirm/{uid}/{token}",
    "USERNAME_RESET_CONFIRM_URL": "#/username/reset/confirm/{uid}/{token}",
    "ACTIVATION_URL": "#/activate/{uid}/{token}",
    "SOCIAL_AUTH_TOKEN_STRATEGY": "djoser.social.token.jwt.TokenStrategy",
    "SOCIAL_AUTH_ALLOWED_REDIRECT_URIS": env.list(
        "SOCIAL_AUTH_ALLOWED_REDIRECT_URIS",
        default=[
            "http://localhost:5173/google-auth",
            "http://localhost:5173/login",
            "http://localhost:5173/",
        ],
    ),
    'SERIALIZERS': {
        'user_create': 'apps.user.serializers.UserCreateSerializer',
        'user': 'apps.user.serializers.UserDetailSerializer',
        'current_user': 'apps.user.serializers.UserDetailSerializer',
        'user_delete': 'djoser.serializers.UserDeleteSerializer',
    },
}

AUTH_USER_MODEL = "user.UserAccount"

# --- Auth backends (Google listo para más adelante) ---
AUTHENTICATION_BACKENDS = (
    "social_core.backends.google.GoogleOAuth2",
    "django.contrib.auth.backends.ModelBackend",
)
SOCIAL_AUTH_USER_MODEL = AUTH_USER_MODEL
SOCIAL_AUTH_URL_NAMESPACE = 'social'
SOCIAL_AUTH_REDIRECT_IS_HTTPS = not DEBUG
SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = env("GOOGLE_CLIENT_ID")
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = env("GOOGLE_CLIENT_SECRET")

# Permitir autenticación usando solo el access_token
SOCIAL_AUTH_GOOGLE_OAUTH2_USE_DEPRECATED_API = False
SOCIAL_AUTH_GOOGLE_OAUTH2_USE_UNIQUE_USER_ID = True

# --- Redirects para SPA ---
LOGIN_URL = 'http://localhost:5173/login'
LOGIN_REDIRECT_URL = 'http://localhost:5173/panel/admin/configuracion'
SOCIAL_AUTH_NEW_ASSOCIATION_REDIRECT_URL = 'http://localhost:5173/panel/admin/configuracion'
SOCIAL_AUTH_DISCONNECT_REDIRECT_URL = 'http://localhost:5173/panel/admin/configuracion'

SOCIAL_AUTH_GOOGLE_OAUTH2_SCOPE = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
]

# Configuración de Pipeline (IMPORTANTE para vincular y login)
# Este pipeline NO crea usuarios nuevos, solo vincula existentes
SOCIAL_AUTH_PIPELINE = (
    'social_core.pipeline.social_auth.social_details',
    'social_core.pipeline.social_auth.social_uid',
    'social_core.pipeline.social_auth.auth_allowed',
    'social_core.pipeline.social_auth.social_user',
    # Intenta asociar por email si el usuario ya está logueado
    'social_core.pipeline.social_auth.associate_by_email',
    # Pipeline personalizado: solo permite login si el usuario existe y está vinculado
    'apps.user.pipeline.require_existing_user',
    'social_core.pipeline.social_auth.associate_user',
    'social_core.pipeline.social_auth.load_extra_data',
    'social_core.pipeline.user.user_details',
    'apps.user.pipeline.save_profile_details',
)

# Configuración adicional para OAuth
SOCIAL_AUTH_GOOGLE_OAUTH2_AUTH_EXTRA_ARGUMENTS = {
    'access_type': 'offline',
}

# Campos protegidos que no se actualizarán desde OAuth
SOCIAL_AUTH_PROTECTED_USER_FIELDS = ['dni']

# Permitir asociación por email cuando el usuario ya está autenticado
SOCIAL_AUTH_ASSOCIATE_BY_MAIL = True

# Logging configuration para debugging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'apps.user.pipeline': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'social_core': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'social_django': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'djoser': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}


# --- CORS/CSRF (dev) ---
# Ya arriba tomamos tus env: CORS_ALLOWED_ORIGINS, CSRF_TRUSTED_ORIGINS
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_HTTPONLY = False # Default es False, pero lo hacemos explícito
SECURE_CROSS_ORIGIN_OPENER_POLICY = 'same-origin-allow-popups'

# --- Deploy overrides (usa tus *_DEPLOY) ---
if not DEBUG:
    ALLOWED_HOSTS = env.list("ALLOWED_HOSTS_DEPLOY", default=ALLOWED_HOSTS)
    CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS_DEPLOY", default=CORS_ALLOWED_ORIGINS)
    CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS_DEPLOY", default=CSRF_TRUSTED_ORIGINS)

    DB_URL = env("DATABASES_URL", default="").strip()
    if DB_URL:
        DATABASES = {"default": env.db("DATABASES_URL")}
        DATABASES["default"]["ATOMIC_REQUESTS"] = True


CELERY_BROKER_URL = 'amqp://guest:guest@localhost:5672//'

# Configuración para Windows: usar pool 'solo' en lugar de 'prefork'
# Esto evita problemas de permisos con billiard en Windows
import sys
if sys.platform == 'win32':
    CELERY_BROKER_POOL_LIMIT = 1
    # El worker debe iniciarse con: celery -A core worker --pool=solo -l info

#CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE


# Configuración de email (¡MUY IMPORTANTE!)
# En desarrollo: Guardar emails en archivos para poder verlos fácilmente
# Cambiar a 'console' si quieres ver en la terminal de Celery
if DEBUG:
    # Guardar emails en la carpeta 'sent_emails' para debugging
    EMAIL_BACKEND = 'django.core.mail.backends.filebased.EmailBackend'
    EMAIL_FILE_PATH = BASE_DIR / 'sent_emails'  # Crear carpeta automáticamente
    DEFAULT_FROM_EMAIL = 'noreply@localhost'
else:
    # Producción: SMTP real (configurar con variables de entorno)
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
    EMAIL_PORT = env.int('EMAIL_PORT', default=587)
    EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
    EMAIL_USE_SSL = env.bool('EMAIL_USE_SSL', default=False)
    EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
    EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
    DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='Sistema Nutrición <noreply@sistemanutricion.com>')

# Email del sistema (para notificaciones automáticas de turnos)
# Este email se usa cuando el nutricionista no tiene configurado un email personalizado
SYSTEM_EMAIL_HOST = env('SYSTEM_EMAIL_HOST', default='smtp.gmail.com')
SYSTEM_EMAIL_PORT = env.int('SYSTEM_EMAIL_PORT', default=587)
SYSTEM_EMAIL_USE_TLS = env.bool('SYSTEM_EMAIL_USE_TLS', default=True)
SYSTEM_EMAIL_USE_SSL = env.bool('SYSTEM_EMAIL_USE_SSL', default=False)
SYSTEM_EMAIL_HOST_USER = env('SYSTEM_EMAIL_HOST_USER', default='')
SYSTEM_EMAIL_HOST_PASSWORD = env('SYSTEM_EMAIL_HOST_PASSWORD', default='')
SYSTEM_DEFAULT_FROM_EMAIL = env('SYSTEM_DEFAULT_FROM_EMAIL', default='Sistema Nutrición <sistema@nutricion.com>')
