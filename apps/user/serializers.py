# apps/user/serializers.py

from djoser.serializers import UserCreateSerializer as BaseCreate, UserSerializer as BaseUser
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers
from datetime import date
import re

from .models import (
    Nutricionista, Especialidad,
    Pregunta, TipoPregunta,
    Paciente, AsignacionNutricionistaPaciente,
    Consulta, TipoConsulta,
)
from .utils import normalize_respuestas


# ---------------------------------------------------------------------
# Usuarios
# ---------------------------------------------------------------------

User = get_user_model()


# --- Serializer Simple para UserAccount ---
class SimpleUserAccountSerializer(serializers.ModelSerializer):
    """
    Serializer simple para mostrar información básica del usuario.
    Usado en relaciones con Turno, Consulta, etc.
    Puede recibir UserAccount, Nutricionista o Paciente.
    """
    # Campos calculados para mostrar nombre completo desde el perfil
    full_name = serializers.SerializerMethodField()
    dni = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'dni', 'email', 'full_name']
        read_only_fields = fields
    
    def get_full_name(self, obj):
        """Obtiene el nombre completo desde el perfil"""
        # Si es un perfil Nutricionista o Paciente directamente
        if hasattr(obj, 'nombre') and hasattr(obj, 'apellido'):
            return f"{obj.nombre} {obj.apellido}"
        # Si es UserAccount con perfil
        elif hasattr(obj, 'nutricionista'):
            return f"{obj.nutricionista.nombre} {obj.nutricionista.apellido}"
        elif hasattr(obj, 'paciente'):
            return f"{obj.paciente.nombre} {obj.paciente.apellido}"
        # Fallback
        return getattr(obj, 'email', 'Usuario')
    
    def get_dni(self, obj):
        """Obtiene el DNI del usuario o del perfil"""
        if hasattr(obj, 'user'):  # Es Nutricionista o Paciente
            return obj.user.dni
        return getattr(obj, 'dni', None)
    
    def get_email(self, obj):
        """Obtiene el email del usuario o del perfil"""
        if hasattr(obj, 'user'):  # Es Nutricionista o Paciente
            return obj.user.email
        return getattr(obj, 'email', None)


# --- Serializadores de Perfil ---
# (Los movemos aquí para que UserDetailSerializer pueda usarlos)

class NutricionistaSerializer(serializers.ModelSerializer):
    """
    Serializador para el perfil de Nutricionista (usado para anidar)
    """
    class Meta:
        model = Nutricionista
        fields = ('id', 'nombre', 'apellido', 'matricula', 'telefono', 'foto_perfil', 'especialidades')


class NutricionistaUpdateSerializer(serializers.ModelSerializer):
    """
    Serializador para que un nutricionista actualice su propio perfil.
    """
    class Meta:
        model = Nutricionista
        fields = ('nombre', 'apellido', 'matricula', 'telefono')

    def validate_matricula(self, value):
        # Opcional: asegurar que la matrícula no esté ya en uso por OTRO nutricionista
        if self.instance and value:
            if Nutricionista.objects.filter(matricula=value).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError("Esta matrícula ya está en uso por otro nutricionista.")
        return value


class PacienteSerializer(serializers.ModelSerializer):
    """
    Serializador para el perfil de Paciente (usado para anidar)
    """
    class Meta:
        model = Paciente
        fields = ('id', 'nombre', 'apellido', 'fecha_nacimiento', 'genero', 'telefono', 'foto_perfil')


class PacienteUpdateSerializer(serializers.ModelSerializer):
    """
    Serializador para que un paciente actualice su propio perfil.
    """
    class Meta:
        model = Paciente
        fields = ('nombre', 'apellido', 'fecha_nacimiento', 'genero', 'telefono')

    def validate_fecha_nacimiento(self, value):
        """Validar que la fecha de nacimiento sea en el pasado"""
        if value and value > date.today():
            raise serializers.ValidationError("La fecha de nacimiento no puede ser en el futuro.")
        return value


class UserCreateSerializer(BaseCreate):
    class Meta(BaseCreate.Meta):
        model = User
        fields = ("id", "dni", "email", "password")


class UserDetailSerializer(serializers.ModelSerializer): 
    """
    Serializador de detalle de Usuario para /auth/users/me/
    """
    role = serializers.SerializerMethodField()
    nutricionista_id = serializers.SerializerMethodField()
    
    nutricionista = NutricionistaSerializer(read_only=True)
    paciente = PacienteSerializer(read_only=True)
    google_account = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "dni", "email",
            "must_change_password", "is_staff", "role",
            "nutricionista", "paciente", "nutricionista_id", "google_account",
        )
        read_only_fields = ("dni", "email", "is_staff", "role", "nutricionista", "paciente", "nutricionista_id")

    def get_role(self, obj):
        if obj.is_staff:
            return "admin"
        if hasattr(obj, "nutricionista"):
            return "nutricionista"
        if hasattr(obj, "paciente"):
            return "paciente"
        return "usuario"
    
    def get_nutricionista_id(self, obj):
        """
        Si el usuario es paciente, devuelve el ID del nutricionista asignado activo.
        Si no hay asignación o el usuario no es paciente, devuelve None.
        """
        if hasattr(obj, "paciente"):
            # Buscar asignación activa
            asignacion = AsignacionNutricionistaPaciente.objects.filter(
                paciente=obj.paciente,
                activo=True
            ).first()
            
            if asignacion:
                return asignacion.nutricionista.id
        
        return None

    def get_google_account(self, obj):
        social_account = obj.social_auth.filter(provider='google-oauth2').first()
        if social_account:
            return {
                'uid': social_account.uid,
                'extra_data': social_account.extra_data,
            }
        return None


class NutricionistaAltaSerializer(serializers.Serializer):
    # Datos de usuario
    dni = serializers.CharField(max_length=10)
    email = serializers.EmailField()
    nombre = serializers.CharField(max_length=150)
    apellido = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)

    # Perfil Nutricionista
    matricula = serializers.CharField(max_length=50, required=False, allow_blank=True)
    telefono = serializers.CharField(max_length=20, required=False, allow_blank=True)

    # M2M: lista de IDs
    especialidades_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, allow_empty=True
    )

    def validate(self, attrs):
        if User.objects.filter(dni=attrs["dni"]).exists():
            raise serializers.ValidationError({"dni": "Ya existe un usuario con este DNI."})
        if User.objects.filter(email=attrs["email"]).exists():
            raise serializers.ValidationError({"email": "Ya existe un usuario con este email."})

        if "especialidades_ids" not in attrs:
            attrs["especialidades_ids"] = []

        matricula = attrs.get("matricula") or ""
        if matricula and Nutricionista.objects.filter(matricula=matricula).exists():
            raise serializers.ValidationError({"matricula": "Ya existe un nutricionista con esa matrícula."})

        return attrs

    def create(self, validated):
        # 1) Usuario
        user = User.objects.create_user(
            dni=validated["dni"],
            email=validated["email"],
            password=validated["password"],
            is_staff=False,
        )
        if hasattr(user, "must_change_password"):
            user.must_change_password = True
            user.save(update_fields=["must_change_password"])

        # 2) Perfil Nutricionista
        nutri = Nutricionista.objects.create(
            user=user,
            nombre=validated.get("nombre", ""),
            apellido=validated.get("apellido", ""),
            matricula=validated.get("matricula") or None,
            telefono=validated.get("telefono") or None,
        )

        # 3) Especialidades M2M
        ids = validated.get("especialidades_ids", [])
        if ids:
            existentes = list(Especialidad.objects.filter(id__in=ids).values_list("id", flat=True))
            faltantes = sorted(set(ids) - set(existentes))
            if faltantes:
                raise serializers.ValidationError({"especialidades_ids": [f"No existen: {faltantes}"]})
            nutri.especialidades.add(*existentes)

        return {"user_id": user.id, "nutricionista_id": nutri.id}

    def to_representation(self, instance):
        return instance

    def validate_password(self, value):
        validate_password(value)
        return value


class EspecialidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Especialidad
        fields = ("id", "nombre")


# ---------------------------------------------------------------------
# ¡¡¡AQUÍ ESTÁ LA CORRECCIÓN!!! ---
# ---------------------------------------------------------------------
class NutricionistaListSerializer(serializers.ModelSerializer):
    dni = serializers.CharField(source="user.dni", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    
    # --- MODIFICADO ---
    # Leemos 'nombre' y 'apellido' directamente del modelo Nutricionista.
    # No necesitamos 'source' porque los campos se llaman igual.
    nombre = serializers.CharField(read_only=True)
    apellido = serializers.CharField(read_only=True)
    
    especialidades = serializers.SerializerMethodField()

    class Meta:
        model = Nutricionista
        # --- MODIFICADO ---
        # Reemplazamos 'first_name' y 'last_name' por 'nombre' y 'apellido'
        fields = (
            "id",
            "dni", "email", "nombre", "apellido",
            "matricula", "telefono", "foto_perfil",
            "especialidades",
        )

    def get_especialidades(self, obj):
        return [e.nombre for e in obj.especialidades.all()]


# ---------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------

def _calc_edad(fecha_nac):
    if not fecha_nac:
        return None
    hoy = date.today()
    return hoy.year - fecha_nac.year - ((hoy.month, hoy.day) < (fecha_nac.month, fecha_nac.day))


def _calc_metricas_from_respuestas(respuestas):
    metricas = {}
    if not respuestas:
        return metricas

    def norm(s): return (s or "").strip().lower()

    for r in respuestas:
        codigo = norm(r.get("codigo"))
        pregunta = norm(r.get("pregunta"))
        valor = r.get("valor")
        if codigo == "peso_kg" or "peso" in pregunta:
            try:
                metricas["peso_kg"] = float(valor)
            except Exception:
                pass
        if codigo == "altura_cm" or "altura" in pregunta or "talla" in pregunta:
            try:
                metricas["altura_cm"] = float(valor)
            except Exception:
                pass
    try:
        p = float(metricas.get("peso_kg"))
        h_cm = float(metricas.get("altura_cm"))
        if p > 0 and h_cm > 0:
            h = h_cm / 100.0
            metricas["imc"] = round(p / (h * h), 2)
    except Exception:
        pass
    return metricas


def _gen_password_facil(dni, fecha_nacimiento=None):
    if fecha_nacimiento:
        try:
            ddmm = fecha_nacimiento.strftime("%d%m")
            return f"{dni}{ddmm}"
        except Exception:
            pass
    return f"{dni}salud"


# ---------------------------------------------------------------------
# Preguntas (banco y personalizadas)
# ---------------------------------------------------------------------

class PreguntaSerializer(serializers.ModelSerializer):
    es_personalizada = serializers.SerializerMethodField()

    class Meta:
        model = Pregunta
        fields = ("id", "texto", "tipo", "codigo", "requerido", "opciones", "unidad", "orden", "es_personalizada")

    def get_es_personalizada(self, obj):
        return bool(getattr(obj, "owner_id", None))


# Helpers para opciones (a nivel de módulo)
def _slug(val: str) -> str:
    s = (val or "").strip().lower()
    s = re.sub(r"\s+", "_", s)
    s = re.sub(r"[^a-z0-9_\-]", "", s)
    return s or "opt"


def _norm_opciones(opciones):
    """
    Acepta:
      - ["Desayuno","Almuerzo"]  ó
      - [{"valor":"desayuno","etiqueta":"Desayuno"}, ...]
    Devuelve lista normalizada de dicts {valor, etiqueta}.
    """
    out = []
    for it in (opciones or []):
        if isinstance(it, dict):
            etiqueta = str(it.get("etiqueta") or it.get("label") or it.get("valor") or "").strip()
            valor = str(it.get("valor") or _slug(etiqueta))
        else:
            etiqueta = str(it).strip()
            valor = _slug(etiqueta)
        if etiqueta:
            out.append({"valor": valor, "etiqueta": etiqueta})
    return out


# apps/user/serializers.py

class PreguntaPersonalizadaCreateSerializer(serializers.ModelSerializer):
    """
    Crea preguntas propiedad del nutricionista (owner = request.user.nutricionista).
    Acepta alias desde el front y los mapea a los choices del modelo:
        text | integer | decimal | boolean | date | single | multi
    """
    # IMPORTANTE: evitar ChoiceField automático
    tipo = serializers.CharField()

    class Meta:
        model = Pregunta
        fields = ("id", "texto", "tipo", "codigo", "requerido", "unidad", "opciones", "orden")
        read_only_fields = ("id", "orden")

    _TIPO_MAP = {
        # multi
        "multi": "multi", "multi_choice": "multi", "opcion_multiple": "multi", "checkbox": "multi",
        # single
        "single": "single", "single_choice": "single", "opcion_unica": "single", "radio": "single", "select": "single",
        # boolean
        "boolean": "boolean", "si_no": "boolean", "yes_no": "boolean",
        # text
        "text": "text", "short_text": "text", "long_text": "text",
        "texto": "text", "texto_corto": "text", "texto_largo": "text",
        # integer
        "integer": "integer", "entero": "integer",
        # decimal
        "decimal": "decimal", "float": "decimal", "number": "decimal", "numeric": "decimal", "numero": "decimal",
        # date
        "date": "date", "fecha": "date",
    }

    def _canon_tipo(self, raw: str) -> str:
        v = (raw or "").strip().lower()
        return self._TIPO_MAP.get(v, "text")  # por defecto usamos text

    # Helpers locales (evitamos dependencias)
    def _slug(self, val: str) -> str:
        s = (val or "").strip().lower()
        s = re.sub(r"\s+", "_", s)
        s = re.sub(r"[^a-z0-9_\-]", "", s)
        return s or "opt"

    def _norm_opciones(self, opciones):
        out = []
        for it in (opciones or []):
            if isinstance(it, dict):
                etiqueta = str(it.get("etiqueta") or it.get("label") or it.get("valor") or "").strip()
                valor = str(it.get("valor") or self._slug(etiqueta))
            else:
                etiqueta = str(it or "").strip()
                valor = self._slug(etiqueta)
            if etiqueta:
                out.append({"valor": valor, "etiqueta": etiqueta})
        return out

    def validate(self, attrs):
        # tipo canónico
        tipo = self._canon_tipo(attrs.get("tipo"))
        attrs["tipo"] = tipo

        # opciones SOLO para single/multi
        if tipo in ("single", "multi"):
            attrs["opciones"] = self._norm_opciones(attrs.get("opciones"))
        else:
            attrs["opciones"] = []

        # limpiar strings opcionales (tu modelo usa "")
        attrs["codigo"] = (attrs.get("codigo") or "").strip()
        attrs["unidad"] = "" if (attrs.get("unidad") or "").strip() in ("kg, cm, veces/día...", "placeholder", "-") else (attrs.get("unidad") or "")

        # requeridas mínimas
        texto = (attrs.get("texto") or "").strip()
        if not texto:
            raise serializers.ValidationError({"texto": "Este campo es obligatorio."})
        attrs["texto"] = texto[:255]  # max_length modelo

        attrs["requerido"] = bool(attrs.get("requerido", False))
        return attrs

    def create(self, validated):
        request = self.context.get("request")
        owner = getattr(getattr(request, "user", None), "nutricionista", None)
        if owner is None:
            raise serializers.ValidationError({"detail": "Solo un nutricionista puede crear preguntas personalizadas."})

        return Pregunta.objects.create(
            owner=owner,
            texto=validated["texto"],
            tipo=validated["tipo"],
            codigo=validated["codigo"],
            requerido=validated["requerido"],
            unidad=validated["unidad"],
            opciones=validated["opciones"],
        )


# ---------------------------------------------------------------------
# Pacientes (list/detail para vistas)
# ---------------------------------------------------------------------

class PacienteListSerializer(serializers.ModelSerializer):
    dni = serializers.CharField(source="user.dni", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    edad = serializers.SerializerMethodField()

    class Meta:
        model = Paciente
        # Eliminamos 'first_name' y 'last_name' que eran redundantes
        fields = (
            "id", "dni", "email",
            "nombre", "apellido",
            "telefono", "fecha_nacimiento", "genero", "edad",
        )

    def get_edad(self, obj):
        return _calc_edad(obj.fecha_nacimiento)


class PacienteDetailSerializer(serializers.ModelSerializer):
    dni = serializers.CharField(source="user.dni", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    edad = serializers.SerializerMethodField()

    class Meta:
        model = Paciente
        fields = (
            "id", "dni", "email",
            "nombre", "apellido",
            "telefono", "fecha_nacimiento", "genero", "edad",
        )

    def get_edad(self, obj):
        return _calc_edad(obj.fecha_nacimiento)


# ---------------------------------------------------------------------
# Consultas
# ---------------------------------------------------------------------

class ConsultaInicialSerializer(serializers.Serializer):
    # datos esenciales para autogenerar paciente
    dni = serializers.CharField(max_length=10)
    email = serializers.EmailField(required=False, allow_blank=True)
    nombre = serializers.CharField(max_length=150, required=False, allow_blank=True)
    apellido = serializers.CharField(max_length=150, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=6, required=False, allow_blank=True)

    telefono = serializers.CharField(max_length=20, required=False, allow_blank=True)
    fecha_nacimiento = serializers.DateField(required=False)
    genero = serializers.ChoiceField(choices=Paciente._meta.get_field("genero").choices, required=False)

    notas = serializers.CharField(required=False, allow_blank=True)
    # cada item: {pregunta, tipo, codigo, unidad, valor, observacion}
    respuestas = serializers.ListField(child=serializers.DictField(), required=False, allow_empty=True)
    plantilla_snapshot = serializers.DictField(required=False)
    plantilla_usada = serializers.IntegerField(required=False, allow_null=True)  # ID de PlantillaConsulta

    def _get_or_create_paciente(self, nutri, data):
        dni = data["dni"].strip()
        user = User.objects.filter(dni=dni).first()
        creado = False
        password_inicial = None

        if user is None:
            pwd = data.get("password")
            if not pwd:
                pwd = _gen_password_facil(dni, data.get("fecha_nacimiento", None))
            user = User.objects.create_user(
                dni=dni,
                email=data.get("email") or "",
                password=pwd,
                is_staff=False,
            )
            if hasattr(user, "must_change_password"):
                user.must_change_password = True
                user.save(update_fields=["must_change_password"])
            creado = True
            password_inicial = pwd
        else:
            changed = False
            new_email = data.get("email")
            if new_email not in (None, "") and getattr(user, 'email') != new_email:
                 setattr(user, 'email', new_email)
                 changed = True
            if changed:
                user.save()

        paciente = getattr(user, "paciente", None)
        if paciente is None:
            paciente = Paciente.objects.create(
                user=user,
                nombre=data.get("nombre") or "",
                apellido=data.get("apellido") or "",
                telefono=data.get("telefono") or "",
                fecha_nacimiento=data.get("fecha_nacimiento"),
                genero=data.get("genero", Paciente._meta.get_field("genero").default),
            )
        else:
            updated = False
            if data.get("nombre") and paciente.nombre != data["nombre"]:
                paciente.nombre = data["nombre"]; updated = True
            if data.get("apellido") and paciente.apellido != data["apellido"]:
                paciente.apellido = data["apellido"]; updated = True
            if updated:
                paciente.save(update_fields=["nombre", "apellido"])

        AsignacionNutricionistaPaciente.objects.get_or_create(
            nutricionista=nutri, paciente=paciente
        )
        return paciente, creado, password_inicial

    @transaction.atomic
    def create(self, validated):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        nutri = getattr(user, "nutricionista", None)
        if nutri is None:
            raise serializers.ValidationError({"detail": "Solo un nutricionista puede registrar consulta inicial."})

        paciente, creado, password_inicial = self._get_or_create_paciente(nutri, validated)

        # Normalizar observaciones antes de métricas
        respuestas_raw = validated.get("respuestas", []) or []
        respuestas = normalize_respuestas(respuestas_raw, user=user)

        metricas = _calc_metricas_from_respuestas(respuestas)

        # Manejar plantilla_usada
        plantilla_usada_id = validated.get("plantilla_usada")
        plantilla_obj = None
        if plantilla_usada_id:
            try:
                from .models import PlantillaConsulta
                plantilla_obj = PlantillaConsulta.objects.get(id=plantilla_usada_id)
            except PlantillaConsulta.DoesNotExist:
                pass

        consulta = Consulta.objects.create(
            paciente=paciente,
            nutricionista=nutri,
            tipo=TipoConsulta.INICIAL,
            notas=validated.get("notas") or "",
            respuestas=respuestas,
            metricas=metricas,
            plantilla_usada=plantilla_obj,
            plantilla_snapshot=validated.get("plantilla_snapshot"),
        )

        out = {
            "paciente_id": paciente.id,
            "consulta_id": consulta.id,
            "imc": consulta.metricas.get("imc"),
            "nuevo_paciente": creado,
        }
        if creado and password_inicial:
            out["password_inicial"] = password_inicial
        return out

    def to_representation(self, instance):
        return instance


class ConsultaSeguimientoSerializer(serializers.Serializer):
    paciente_id = serializers.IntegerField()
    notas = serializers.CharField(required=False, allow_blank=True)
    respuestas = serializers.ListField(child=serializers.DictField(), required=False, allow_empty=True)
    plantilla_snapshot = serializers.DictField(required=False)
    plantilla_usada = serializers.IntegerField(required=False, allow_null=True)  # ID de PlantillaConsulta

    @transaction.atomic
    def create(self, validated):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        nutri = getattr(user, "nutricionista", None)
        if nutri is None:
            raise serializers.ValidationError({"detail": "Solo un nutricionista puede registrar seguimientos."})

        try:
            paciente = Paciente.objects.get(id=validated["paciente_id"])
        except Paciente.DoesNotExist:
            raise serializers.ValidationError({"paciente_id": "Paciente no encontrado"})

        # asegurar vínculo nutri-paciente
        if not AsignacionNutricionistaPaciente.objects.filter(
            nutricionista=nutri, paciente=paciente
        ).exists():
            AsignacionNutricionistaPaciente.objects.get_or_create(
                nutricionista=nutri, paciente=paciente
            )

        # Normalizar observaciones antes de métricas
        respuestas_raw = validated.get("respuestas", []) or []
        respuestas = normalize_respuestas(respuestas_raw, user=user)

        metricas = _calc_metricas_from_respuestas(respuestas)

        # Manejar plantilla_usada
        plantilla_usada_id = validated.get("plantilla_usada")
        plantilla_obj = None
        if plantilla_usada_id:
            try:
                from .models import PlantillaConsulta
                plantilla_obj = PlantillaConsulta.objects.get(id=plantilla_usada_id)
            except PlantillaConsulta.DoesNotExist:
                pass

        consulta = Consulta.objects.create(
            paciente=paciente,
            nutricionista=nutri,
            tipo=TipoConsulta.SEGUIMIENTO,
            notas=validated.get("notas") or "",
            respuestas=respuestas,
            metricas=metricas,
            plantilla_usada=plantilla_obj,
            plantilla_snapshot=validated.get("plantilla_snapshot"),
        )

        return {
            "paciente_id": paciente.id,
            "consulta_id": consulta.id,
            "imc": consulta.metricas.get("imc"),
        }

    def to_representation(self, instance):
        return instance


class ConsultaListItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consulta
        fields = ("id", "fecha", "tipo", "metricas", "notas")


class ConsultaDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consulta
        fields = "__all__"


# ──────────────────────────────────────────────────────────────────────
# Sistema de Plantillas
# ──────────────────────────────────────────────────────────────────────

from .models import PlantillaConsulta, PlantillaPregunta


class PlantillaPreguntaSerializer(serializers.ModelSerializer):
    """
    Serializer para PlantillaPregunta (relación M2M enriquecida).
    Incluye información completa de la pregunta relacionada.
    """
    pregunta = PreguntaSerializer(read_only=True)
    pregunta_id = serializers.PrimaryKeyRelatedField(
        queryset=Pregunta.objects.filter(activo=True),
        source='pregunta',
        write_only=True
    )
    
    class Meta:
        model = PlantillaPregunta
        fields = (
            'id', 'pregunta', 'pregunta_id', 'orden', 
            'requerido_en_plantilla', 'visible', 'config', 'created_at'
        )
        read_only_fields = ('id', 'created_at')
    
    def validate_pregunta_id(self, pregunta):
        """Validar que la pregunta sea compatible con el nutricionista"""
        plantilla = self.context.get('plantilla')
        if not plantilla:
            return pregunta
        
        # Si la pregunta es personalizada, debe ser del mismo owner
        if pregunta.owner_id and plantilla.owner_id and pregunta.owner_id != plantilla.owner_id:
            raise serializers.ValidationError(
                f"No puedes usar la pregunta '{pregunta.texto}' (de otro nutricionista) en tu plantilla."
            )
        
        return pregunta


class PlantillaConsultaSerializer(serializers.ModelSerializer):
    """
    Serializer completo para PlantillaConsulta.
    Incluye las preguntas configuradas en la plantilla.
    """
    preguntas_config = PlantillaPreguntaSerializer(many=True, read_only=True)
    owner_info = serializers.SerializerMethodField()
    cantidad_preguntas = serializers.SerializerMethodField()
    
    class Meta:
        model = PlantillaConsulta
        fields = (
            'id', 'owner', 'owner_info', 'nombre', 'descripcion', 
            'tipo_consulta', 'es_predeterminada', 'activo', 'config',
            'preguntas_config', 'cantidad_preguntas',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_owner_info(self, obj):
        """Información del owner (nutricionista o sistema)"""
        if obj.owner_id is None:
            return {"tipo": "sistema", "nombre": "Sistema"}
        return {
            "tipo": "nutricionista",
            "id": obj.owner.id,
            "nombre": f"{obj.owner.nombre} {obj.owner.apellido}"
        }
    
    def get_cantidad_preguntas(self, obj):
        """Cantidad de preguntas en la plantilla"""
        return obj.preguntas_config.filter(visible=True).count()
    
    def validate(self, data):
        """Validar que solo haya una plantilla predeterminada por tipo y owner"""
        es_predeterminada = data.get('es_predeterminada', False)
        activo = data.get('activo', True)
        
        if es_predeterminada and activo:
            owner = data.get('owner')
            tipo_consulta = data.get('tipo_consulta')
            
            # Verificar si ya existe otra predeterminada
            conflicto = PlantillaConsulta.objects.filter(
                owner=owner,
                tipo_consulta=tipo_consulta,
                es_predeterminada=True,
                activo=True
            )
            
            # Si estamos editando, excluir la instancia actual
            if self.instance:
                conflicto = conflicto.exclude(pk=self.instance.pk)
            
            if conflicto.exists():
                raise serializers.ValidationError({
                    'es_predeterminada': 
                    f"Ya existe una plantilla predeterminada para consultas de tipo "
                    f"'{dict(TipoConsulta.choices)[tipo_consulta]}'. "
                    f"Desactiva la otra primero."
                })
        
        return data


class PlantillaConsultaListSerializer(serializers.ModelSerializer):
    """
    Serializer ligero para listar plantillas (sin incluir preguntas).
    """
    owner_info = serializers.SerializerMethodField()
    cantidad_preguntas = serializers.SerializerMethodField()
    
    class Meta:
        model = PlantillaConsulta
        fields = (
            'id', 'owner', 'owner_info', 'nombre', 'descripcion',
            'tipo_consulta', 'es_predeterminada', 'activo',
            'cantidad_preguntas', 'created_at'
        )
        read_only_fields = fields
    
    def get_owner_info(self, obj):
        if obj.owner_id is None:
            return {"tipo": "sistema", "nombre": "Sistema"}
        return {
            "tipo": "nutricionista",
            "id": obj.owner.id,
            "nombre": f"{obj.owner.nombre} {obj.owner.apellido}"
        }
    
    def get_cantidad_preguntas(self, obj):
        return obj.preguntas_config.filter(visible=True).count()


class PlantillaConsultaCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear/actualizar plantillas con sus preguntas.
    """
    preguntas = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text="Lista de {pregunta_id, orden, requerido_en_plantilla, visible, config}"
    )
    
    class Meta:
        model = PlantillaConsulta
        fields = (
            'id', 'nombre', 'descripcion', 'tipo_consulta',
            'es_predeterminada', 'activo', 'config', 'preguntas'
        )
        read_only_fields = ('id',)
    
    def create(self, validated_data):
        """Crear plantilla y sus preguntas"""
        preguntas_data = validated_data.pop('preguntas', [])
        
        # El owner se asigna desde el contexto (view)
        owner = self.context.get('owner')
        plantilla = PlantillaConsulta.objects.create(owner=owner, **validated_data)
        
        # Crear relaciones con preguntas
        for pregunta_data in preguntas_data:
            pregunta_id = pregunta_data.get('pregunta_id')
            if not pregunta_id:
                continue
            
            PlantillaPregunta.objects.create(
                plantilla=plantilla,
                pregunta_id=pregunta_id,
                orden=pregunta_data.get('orden', 0),
                requerido_en_plantilla=pregunta_data.get('requerido_en_plantilla', False),
                visible=pregunta_data.get('visible', True),
                config=pregunta_data.get('config', {})
            )
        
        return plantilla
    
    def update(self, instance, validated_data):
        """Actualizar plantilla y sus preguntas"""
        preguntas_data = validated_data.pop('preguntas', None)
        
        # Actualizar campos de la plantilla
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Si se proporcionan preguntas, reemplazar todas
        if preguntas_data is not None:
            # Eliminar preguntas existentes
            instance.preguntas_config.all().delete()
            
            # Crear nuevas relaciones
            for pregunta_data in preguntas_data:
                pregunta_id = pregunta_data.get('pregunta_id')
                if not pregunta_id:
                    continue
                
                PlantillaPregunta.objects.create(
                    plantilla=instance,
                    pregunta_id=pregunta_id,
                    orden=pregunta_data.get('orden', 0),
                    requerido_en_plantilla=pregunta_data.get('requerido_en_plantilla', False),
                    visible=pregunta_data.get('visible', True),
                    config=pregunta_data.get('config', {})
                )
        
        return instance