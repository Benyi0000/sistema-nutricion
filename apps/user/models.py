# apps/user/models.py
from django.conf import settings
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.core.validators import RegexValidator, EmailValidator
from django.db import models
from django.utils import timezone


# -------- Utils --------
def normalize_dni(raw: str) -> str:
    if raw is None:
        return raw
    return "".join(ch for ch in str(raw) if ch.isdigit())


# -------- User / Manager --------
class UserAccountManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, dni, email, password, **extra_fields):
        if not dni:
            raise ValueError("El DNI es obligatorio.")
        if not email:
            raise ValueError("El email es obligatorio.")

        dni = normalize_dni(dni)
        email = self.normalize_email(email)

        user = self.model(dni=dni, email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()  # Para usuarios OAuth sin password
        user.save(using=self._db)
        
        # --- ELIMINADO ---
        # Se eliminó la creación de UserSecurity, ya que sus campos se movieron a UserAccount
        # UserSecurity.objects.get_or_create(user=user)
        
        return user

    def create_user(self, dni, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("must_change_password", True)
        return self._create_user(dni, email, password, **extra_fields)

    def create_superuser(self, dni, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("must_change_password", False)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser debe tener is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser debe tener is_superuser=True.")
        return self._create_user(dni, email, password, **extra_fields)


class UserAccount(AbstractBaseUser, PermissionsMixin):
    dni = models.CharField(
        max_length=10,
        unique=True,
        validators=[RegexValidator(r"^\d{7,10}$", message="DNI debe tener 7 a 10 dígitos.")],
        help_text="Solo dígitos, sin puntos ni espacios.",
    )
    email = models.EmailField(unique=True, validators=[EmailValidator()])

    # --- ELIMINADOS ---
    # Se eliminan los campos de nombre para que la info sensible
    # resida únicamente en los modelos de perfil (Paciente, Nutricionista)
    # first_name = models.CharField("nombre", max_length=150, blank=True)
    # last_name = models.CharField("apellido", max_length=150, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    must_change_password = models.BooleanField(default=True)
    
    # --- AÑADIDO ---
    # Campo movido desde el extinto modelo UserSecurity
    last_password_change = models.DateTimeField(null=True, blank=True)
    
    # Foto de perfil
    profile_picture = models.ImageField(
        upload_to='profile_pictures/',
        null=True,
        blank=True,
        help_text="Foto de perfil del usuario"
    )

    objects = UserAccountManager()

    USERNAME_FIELD = "dni"
    
    # --- MODIFICADO ---
    # Se quitan first_name y last_name de los campos requeridos
    REQUIRED_FIELDS = ["email"]

    class Meta:
        verbose_name = "cuenta de usuario"    # --- MODIFICADO ---
        verbose_name_plural = "cuentas de usuario" # --- MODIFICADO ---
        indexes = [
            models.Index(fields=["dni"]),
            models.Index(fields=["email"]),
        ]

    def __str__(self):
        return f"{self.dni} · {self.email}"

    # --- ELIMINADO ---
    # Esta propiedad ya no tiene sentido aquí
    # @property
    # def full_name(self):
    #     return f"{self.first_name} {self.last_name}".strip()

    def save(self, *args, **kwargs):
        self.dni = normalize_dni(self.dni)
        self.email = self.__class__.objects.normalize_email(self.email)
        super().save(*args, **kwargs)


# --- ELIMINADO ---
# Este modelo era redundante. Sus campos se movieron a UserAccount.
# class UserSecurity(models.Model):
#     user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="security")
#     must_change_password = models.BooleanField(default=True)
#     last_password_change = models.DateTimeField(null=True, blank=True)
#
#     class Meta:
#         verbose_name = "seguridad de usuario"
#         verbose_name_plural = "seguridad de usuarios"
#
#     def __str__(self):
#         return f"Security {self.user_id}"


# -------- Perfiles --------
class Especialidad(models.Model):
    nombre = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name = "especialidad"
        verbose_name_plural = "especialidades"

    def __str__(self):
        return self.nombre


class Nutricionista(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="nutricionista")
    
    # --- AÑADIDOS ---
    # Se añaden campos de nombre para que este perfil
    # sea la fuente de verdad de sus datos personales.
    nombre = models.CharField("nombre", max_length=150, blank=True)
    apellido = models.CharField("apellido", max_length=150, blank=True)
    
    matricula = models.CharField(max_length=50, unique=True, null=True, blank=True)
    especialidades = models.ManyToManyField(Especialidad, blank=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    foto_perfil = models.ImageField(upload_to="perfil/", null=True, blank=True)

    class Meta:
        verbose_name = "nutricionista"
        verbose_name_plural = "nutricionistas"

    # --- MODIFICADO ---
    # Ahora usa sus propios campos de nombre
    def __str__(self):
        return self.full_name or self.user.dni

    # --- AÑADIDO ---
    @property
    def full_name(self):
        return f"{self.nombre} {self.apellido}".strip()
    
    def clean(self):
        """Validar que el usuario no tenga perfil de Paciente"""
        super().clean()
        if hasattr(self.user, 'paciente'):
            from django.core.exceptions import ValidationError
            raise ValidationError(
                "Este usuario ya tiene un perfil de Paciente. "
                "Un usuario no puede ser Nutricionista y Paciente al mismo tiempo."
            )
    
    def save(self, *args, **kwargs):
        """Ejecutar validaciones antes de guardar"""
        self.full_clean()
        super().save(*args, **kwargs)


class Genero(models.TextChoices):
    MASCULINO = "M", "Masculino"
    FEMENINO = "F", "Femenino"
    OTRO = "O", "Otro"


class Paciente(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="paciente")
    nombre = models.CharField(max_length=100, blank=True)
    apellido = models.CharField(max_length=100, blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    genero = models.CharField(max_length=1, choices=Genero.choices)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    foto_perfil = models.ImageField(upload_to="perfil/", null=True, blank=True)

    class Meta:
        verbose_name = "paciente"
        verbose_name_plural = "pacientes"

    def __str__(self):
        return self.full_name or self.user.dni
    
    @property
    def full_name(self):
        """Retorna el nombre completo del paciente"""
        return f"{self.nombre} {self.apellido}".strip()
    
    def clean(self):
        """Validar que el usuario no tenga perfil de Nutricionista"""
        super().clean()
        if hasattr(self.user, 'nutricionista'):
            from django.core.exceptions import ValidationError
            raise ValidationError(
                "Este usuario ya tiene un perfil de Nutricionista. "
                "Un usuario no puede ser Paciente y Nutricionista al mismo tiempo."
            )
    
    def save(self, *args, **kwargs):
        """Ejecutar validaciones antes de guardar"""
        self.full_clean()
        super().save(*args, **kwargs)

    # --- AÑADIDO ---
    # (Buena práctica añadir esta propiedad también aquí)
    @property
    def full_name(self):
        return f"{self.nombre} {self.apellido}".strip()


class AsignacionNutricionistaPaciente(models.Model):
    nutricionista = models.ForeignKey(Nutricionista, on_delete=models.CASCADE, related_name="asignaciones")
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE, related_name="asignaciones")
    activo = models.BooleanField(default=True)
    fecha_desde = models.DateField(default=timezone.now)
    fecha_hasta = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = (("nutricionista", "paciente", "fecha_desde"),)
        verbose_name = "asignación nutricionista–paciente"
        verbose_name_plural = "asignaciones nutricionista–paciente"

    def __str__(self):
        estado = "activo" if self.activo else "inactivo"
        return f"{self.nutricionista} ↔ {self.paciente} ({estado})"
    

#Modelos Preguntas %% consulta

# --- Tipos de pregunta ---
class TipoPregunta(models.TextChoices):
    TEXTO = "text", "Texto"
    ENTERO = "integer", "Entero"
    DECIMAL = "decimal", "Decimal"
    BOOLEANO = "boolean", "Sí/No"
    FECHA = "date", "Fecha"
    OPCION_UNICA = "single", "Opción única"
    OPCION_MULTIPLE = "multi", "Opción múltiple"

class Pregunta(models.Model):
    # owner = None → pregunta global (del sistema). Si tiene owner → personalizada del nutricionista.
    owner = models.ForeignKey(
        'user.Nutricionista', null=True, blank=True,
        on_delete=models.CASCADE, related_name='preguntas'
    )
    texto = models.CharField(max_length=255)
    tipo = models.CharField(max_length=10, choices=TipoPregunta.choices)
    codigo = models.CharField(max_length=50, blank=True, default="")  # ej: peso_kg, altura_cm
    requerido = models.BooleanField(default=False)
    opciones = models.JSONField(default=list, blank=True)  # para single/multi
    unidad = models.CharField(max_length=20, blank=True, default="")
    activo = models.BooleanField(default=True)
    es_inicial = models.BooleanField(default=True)  # visible en consulta inicial
    orden = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["owner"]),
            models.Index(fields=["codigo"]),
            models.Index(fields=["activo", "es_inicial"]),
            models.Index(fields=["orden"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "codigo"],
                name="uq_pregunta_owner_codigo",
                condition=~models.Q(codigo="")
            )
        ]
        ordering = ["orden", "id"]

    def __str__(self):
        who = "global" if self.owner_id is None else f"nutri:{self.owner_id}"
        return f"[{who}] {self.texto}"

# --- Consultas (inicial / seguimiento) ---
class TipoConsulta(models.TextChoices):
    INICIAL = "INICIAL", "Inicial"
    SEGUIMIENTO = "SEGUIMIENTO", "Seguimiento"

class Consulta(models.Model):
    paciente = models.ForeignKey('user.Paciente', on_delete=models.CASCADE, related_name='consultas')
    nutricionista = models.ForeignKey('user.Nutricionista', on_delete=models.CASCADE, related_name='consultas')
    fecha = models.DateTimeField(default=timezone.now)
    tipo = models.CharField(max_length=15, choices=TipoConsulta.choices, default=TipoConsulta.INICIAL)
    notas = models.TextField(blank=True)

    # Snapshots:
    # respuestas: lista de objetos {pregunta, tipo, codigo, unidad, valor, observacion}
    respuestas = models.JSONField(default=list, blank=True)
    # metricas derivadas (imc, etc)
    metricas = models.JSONField(default=dict, blank=True)
    # plantilla usada (qué preguntas se mostraron y si fueron seleccionadas)
    plantilla_snapshot = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["fecha"]),
            models.Index(fields=["tipo"]),
        ]
        ordering = ["-fecha", "-id"]

    def __str__(self):
        return f"{self.tipo} - {self.paciente_id} - {self.fecha:%Y-%m-%d}"

    @property
    def imc(self):
        return (self.metricas or {}).get("imc")