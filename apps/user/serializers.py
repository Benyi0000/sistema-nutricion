# apps/user/serializers.py

from djoser.serializers import UserCreateSerializer as BaseCreate, UserSerializer as BaseUser
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
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


class UserCreateSerializer(BaseCreate):
    class Meta(BaseCreate.Meta):
        model = User
        fields = ("id", "dni", "email", "first_name", "last_name", "password")


class UserDetailSerializer(BaseUser):
    role = serializers.SerializerMethodField()

    class Meta(BaseUser.Meta):
        model = User
        fields = (
            "id", "dni", "email", "first_name", "last_name",
            "must_change_password", "is_staff", "role",
        )

    def get_role(self, obj):
        if obj.is_staff:
            return "admin"
        if hasattr(obj, "nutricionista"):
            return "nutricionista"
        if hasattr(obj, "paciente"):
            return "paciente"
        return "usuario"


class NutricionistaAltaSerializer(serializers.Serializer):
    # Datos de usuario
    dni = serializers.CharField(max_length=10)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
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
            first_name=validated["first_name"],
            last_name=validated["last_name"],
            password=validated["password"],
            is_staff=False,
        )
        if hasattr(user, "must_change_password"):
            user.must_change_password = True
            user.save(update_fields=["must_change_password"])

        # 2) Perfil Nutricionista
        nutri = Nutricionista.objects.create(
            user=user,
            matricula=validated.get("matricula", "") or "",
            telefono=validated.get("telefono", "") or "",
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


class NutricionistaListSerializer(serializers.ModelSerializer):
    dni = serializers.CharField(source="user.dni")
    email = serializers.EmailField(source="user.email")
    first_name = serializers.CharField(source="user.first_name")
    last_name = serializers.CharField(source="user.last_name")
    especialidades = serializers.SerializerMethodField()

    class Meta:
        model = Nutricionista
        fields = (
            "id",
            "dni", "email", "first_name", "last_name",
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
    dni = serializers.CharField(source="user.dni")
    email = serializers.EmailField(source="user.email")
    nombre = serializers.CharField()
    apellido = serializers.CharField()
    first_name = serializers.CharField(source="nombre", read_only=True)
    last_name = serializers.CharField(source="apellido", read_only=True)
    edad = serializers.SerializerMethodField()

    class Meta:
        model = Paciente
        fields = (
            "id", "dni", "email",
            "nombre", "apellido",
            "first_name", "last_name",
            "telefono", "fecha_nacimiento", "genero", "edad",
        )

    def get_edad(self, obj):
        return _calc_edad(obj.fecha_nacimiento)


class PacienteDetailSerializer(serializers.ModelSerializer):
    dni = serializers.CharField(source="user.dni")
    email = serializers.EmailField(source="user.email")
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
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=6, required=False, allow_blank=True)

    telefono = serializers.CharField(max_length=20, required=False, allow_blank=True)
    fecha_nacimiento = serializers.DateField(required=False)
    genero = serializers.ChoiceField(choices=Paciente._meta.get_field("genero").choices, required=False)

    notas = serializers.CharField(required=False, allow_blank=True)
    # cada item: {pregunta, tipo, codigo, unidad, valor, observacion}
    respuestas = serializers.ListField(child=serializers.DictField(), required=False, allow_empty=True)
    plantilla_snapshot = serializers.DictField(required=False)

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
                first_name=data.get("first_name") or "",
                last_name=data.get("last_name") or "",
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
            for f in ("email", "first_name", "last_name"):
                val = data.get(f)
                if val not in (None, "") and getattr(user, f) != val:
                    setattr(user, f, val)
                    changed = True
            if changed:
                user.save()

        paciente = getattr(user, "paciente", None)
        if paciente is None:
            paciente = Paciente.objects.create(
                user=user,
                nombre=data.get("first_name") or "",
                apellido=data.get("last_name") or "",
                telefono=data.get("telefono") or "",
                fecha_nacimiento=data.get("fecha_nacimiento"),
                genero=data.get("genero", Paciente._meta.get_field("genero").default),
            )
        else:
            updated = False
            if data.get("first_name") and paciente.nombre != data["first_name"]:
                paciente.nombre = data["first_name"]; updated = True
            if data.get("last_name") and paciente.apellido != data["last_name"]:
                paciente.apellido = data["last_name"]; updated = True
            if updated:
                paciente.save(update_fields=["nombre", "apellido"])

        AsignacionNutricionistaPaciente.objects.get_or_create(
            nutricionista=nutri, paciente=paciente
        )
        return paciente, creado, password_inicial

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

        consulta = Consulta.objects.create(
            paciente=paciente,
            nutricionista=nutri,
            tipo=TipoConsulta.INICIAL,
            notas=validated.get("notas") or "",
            respuestas=respuestas,
            metricas=metricas,
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

        consulta = Consulta.objects.create(
            paciente=paciente,
            nutricionista=nutri,
            tipo=TipoConsulta.SEGUIMIENTO,
            notas=validated.get("notas") or "",
            respuestas=respuestas,
            metricas=metricas,
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
