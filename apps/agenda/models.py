# apps/agenda/models.py
from uuid import uuid4
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone

# Postgres-specific
from django.contrib.postgres.fields import ArrayField, DateTimeRangeField
from django.contrib.postgres.constraints import ExclusionConstraint
from django.contrib.postgres.indexes import GistIndex
from django.contrib.postgres.fields.ranges import RangeOperators

# Importá tus modelos existentes
from apps.user.models import Nutricionista, Paciente, TipoConsulta, Consulta


# ────────────────────────────────────────────────────────────────────────────────
# 1) Catálogo de ubicaciones (multi-sede / virtual)
# ────────────────────────────────────────────────────────────────────────────────

class Ubicacion(models.Model):
    """
    Sede/consultorio o modalidad virtual de un nutricionista.
    """
    nutricionista = models.ForeignKey(Nutricionista, on_delete=models.CASCADE, related_name="ubicaciones")
    nombre = models.CharField(max_length=100)  # Ej: "Sede Centro", "Consultorio Norte", "Virtual"
    direccion = models.CharField(max_length=255, blank=True)
    is_virtual = models.BooleanField(default=False)
    timezone = models.CharField(max_length=64, default="America/Argentina/Cordoba")

    # Opcionales (para mapa)
    lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    place_id = models.CharField(max_length=128, blank=True)

    class Meta:
        unique_together = ("nutricionista", "nombre")

    def __str__(self):
        tag = "Virtual" if self.is_virtual else self.direccion or "—"
        return f"{self.nombre} ({tag}) - {self.nutricionista.full_name}"


# ────────────────────────────────────────────────────────────────────────────────
# 2) Configuración / políticas por profesional
# ────────────────────────────────────────────────────────────────────────────────

class BookingMode(models.TextChoices):
    PUBLICO = "PUBLICO", "Público"
    INTERNO = "INTERNO", "Agenda interna"

class PaymentMethod(models.TextChoices):
    MP = "mp", "Mercado Pago"
    EFECTIVO = "cash", "Efectivo"
    TRANSFERENCIA = "wire", "Transferencia"
    TARJETA = "card", "Tarjeta"
    OBRA_SOCIAL = "coverage", "Obra social"

class ProfessionalSettings(models.Model):
    """
    Flags y políticas que gobiernan el turnero por nutricionista.
    """
    nutricionista = models.OneToOneField(Nutricionista, on_delete=models.CASCADE, related_name="settings")

    # Modo de reserva
    booking_mode = models.CharField(max_length=16, choices=BookingMode.choices, default=BookingMode.PUBLICO)

    # Pagos
    payments_enabled = models.BooleanField(default=False)
    payment_methods = ArrayField(models.CharField(max_length=16, choices=PaymentMethod.choices), default=list)

    # Políticas de cancelación/reprogramación/no-show
    free_cancel_hours = models.PositiveIntegerField(default=24)        # cancelar sin costo
    min_reschedule_hours = models.PositiveIntegerField(default=12)     # ventana mínima para reprogramar
    no_show_fee_type = models.CharField(max_length=16, choices=[("none","None"),("flat","Flat"),("percent","Percent")], default="none")
    no_show_fee_value = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    # Depósito opcional
    deposit_enabled = models.BooleanField(default=False)
    deposit_type = models.CharField(max_length=16, choices=[("flat","Flat"),("percent","Percent")], default="flat")
    deposit_value = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    # Ventanas de anticipación para reservar
    anticipacion_minima = models.DurationField(default=timedelta(hours=2))
    anticipacion_maxima = models.DurationField(default=timedelta(days=60))

    # Buffers por defecto (antes/después del turno)
    buffer_before_min = models.PositiveIntegerField(default=0)
    buffer_after_min = models.PositiveIntegerField(default=0)

    # Preferencias varias
    teleconsulta_enabled = models.BooleanField(default=True)

    def __str__(self):
        return f"Settings {self.nutricionista.full_name}"


# ────────────────────────────────────────────────────────────────────────────────
# 3) Tipos de consulta por profesional (duración/precio/buffer)
# ────────────────────────────────────────────────────────────────────────────────

class TipoConsultaConfig(models.Model):
    """
    Override por profesional del catálogo de TipoConsulta (enum).
    Permite setear duración/precio/buffers distintos para inicial vs. seguimiento.
    """
    nutricionista = models.ForeignKey(Nutricionista, on_delete=models.CASCADE, related_name="tipos_consulta")
    tipo = models.CharField(max_length=32, choices=TipoConsulta.choices)
    duracion_min = models.PositiveIntegerField(default=30)
    precio = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    buffer_before_min = models.PositiveIntegerField(default=0)
    buffer_after_min = models.PositiveIntegerField(default=0)
    canal_por_defecto = models.CharField(max_length=16, choices=[("presencial","Presencial"),("video","Video")], default="presencial")

    class Meta:
        unique_together = ("nutricionista", "tipo")

    def __str__(self):
        return f"{self.nutricionista.full_name} - {self.get_tipo_display()}"


# ────────────────────────────────────────────────────────────────────────────────
# 4) Disponibilidad recurrente y bloqueos (anclados a ubicación)
# ────────────────────────────────────────────────────────────────────────────────

class DisponibilidadHoraria(models.Model):
    class DiaSemana(models.IntegerChoices):
        LUNES = 0, "Lunes"
        MARTES = 1, "Martes"
        MIERCOLES = 2, "Miércoles"
        JUEVES = 3, "Jueves"
        VIERNES = 4, "Viernes"
        SABADO = 5, "Sábado"
        DOMINGO = 6, "Domingo"

    nutricionista = models.ForeignKey(Nutricionista, on_delete=models.CASCADE, related_name="disponibilidad")
    ubicacion = models.ForeignKey(Ubicacion, on_delete=models.CASCADE, related_name="disponibilidad")
    dia_semana = models.IntegerField(choices=DiaSemana.choices)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    slot_minutes = models.PositiveIntegerField(default=30)

    class Meta:
        unique_together = ("nutricionista", "ubicacion", "dia_semana", "hora_inicio")
        ordering = ["dia_semana", "hora_inicio"]

    def __str__(self):
        return f"{self.nutricionista.full_name} {self.get_dia_semana_display()} {self.hora_inicio}-{self.hora_fin} @ {self.ubicacion.nombre}"


class BloqueoDisponibilidad(models.Model):
    nutricionista = models.ForeignKey(Nutricionista, on_delete=models.CASCADE, related_name="bloqueos")
    ubicacion = models.ForeignKey(Ubicacion, on_delete=models.CASCADE, related_name="bloqueos")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    motivo = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"Bloqueo {self.nutricionista.full_name}: {self.start_time} - {self.end_time} ({self.ubicacion.nombre})"


# ────────────────────────────────────────────────────────────────────────────────
# 5) Obra social (catálogo por profesional) + snapshot en turno
# ────────────────────────────────────────────────────────────────────────────────

class ProfesionalObraSocial(models.Model):
    nutricionista = models.ForeignKey(Nutricionista, on_delete=models.CASCADE, related_name="obras_sociales")
    nombre = models.CharField(max_length=120)     # Ej: "OSDE", "Swiss"
    plan = models.CharField(max_length=120, blank=True)
    notas = models.TextField(blank=True)

    class Meta:
        unique_together = ("nutricionista", "nombre", "plan")

    def __str__(self):
        return f"{self.nutricionista.full_name} - {self.nombre} {self.plan or ''}".strip()


# ────────────────────────────────────────────────────────────────────────────────
# 6) Turno + exclusión de solapamientos
# ────────────────────────────────────────────────────────────────────────────────

class TurnoState(models.TextChoices):
    TENTATIVO = "TENTATIVO", "Tentativo"    # hold (p.ej., oferta de waitlist)
    RESERVADO = "RESERVADO", "Reservado"
    CONFIRMADO = "CONFIRMADO", "Confirmado"
    ATENDIDO = "ATENDIDO", "Atendido"
    AUSENTE = "AUSENTE", "Ausente"
    CANCELADO = "CANCELADO", "Cancelado"

class PaymentState(models.TextChoices):
    NONE = "NONE", "Sin pago"
    PENDING = "PENDING", "Pendiente"
    PAID = "PAID", "Pagado"
    REFUNDED = "REFUNDED", "Reembolsado"
    FEE_CHARGED = "FEE_CHARGED", "No-show cobrado"

class Turno(models.Model):
    """
    Cita agendada. Usa un campo de rango para exclusión de solapes por (nutricionista, ubicación).
    Requiere extensión btree_gist para el ExclusionConstraint.
    """
    nutricionista = models.ForeignKey(Nutricionista, on_delete=models.PROTECT, related_name="turnos")
    paciente = models.ForeignKey(Paciente, on_delete=models.PROTECT, related_name="turnos", null=True, blank=True)

    ubicacion = models.ForeignKey(Ubicacion, on_delete=models.PROTECT, related_name="turnos")
    canal = models.CharField(max_length=16, choices=[("presencial","Presencial"),("video","Video")], default="presencial")
    source = models.CharField(max_length=16, choices=[("publico","Público"),("interno","Interno"),("waitlist","Waitlist")], default="publico")

    tipo_consulta = models.ForeignKey(TipoConsultaConfig, on_delete=models.PROTECT, related_name="turnos")

    # Tiempo
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    slot = DateTimeRangeField(help_text="Rango horario [start, end) para constraints")

    # Estados
    state = models.CharField(max_length=16, choices=TurnoState.choices, default=TurnoState.RESERVADO)
    payment_state = models.CharField(max_length=16, choices=PaymentState.choices, default=PaymentState.NONE)

    # Snapshots y metadatos
    precio_cobrado = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    coverage_snapshot = models.JSONField(null=True, blank=True)  # obra social declarada por paciente
    intake_answers = models.JSONField(null=True, blank=True)     # formulario corto
    notas_paciente = models.TextField(blank=True)
    meta = models.JSONField(default=dict, blank=True)            # link video, etc.

    # Soft-hold (para ofertas de waitlist)
    soft_hold_expires_at = models.DateTimeField(null=True, blank=True)

    # Enlace a consulta clínica (post-atención)
    consulta_clinica = models.OneToOneField(Consulta, on_delete=models.SET_NULL, null=True, blank=True, related_name="turno")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["start_time"]
        indexes = [
            models.Index(fields=["nutricionista", "start_time"]),
            models.Index(fields=["ubicacion", "start_time"]),
            models.Index(fields=["state"]),
        ]
        constraints = [
            # Evita solapamientos por nutricionista+ubicación (requiere btree_gist)
            ExclusionConstraint(
                name="no_overlap_por_prof_y_ubic",
                expressions=[
                    (models.F("nutricionista"), RangeOperators.EQUAL),
                    (models.F("ubicacion"), RangeOperators.EQUAL),
                    (models.F("slot"), RangeOperators.OVERLAPS),
                ],
                index_type="GIST",
            )
        ]

    def __str__(self):
        who = self.paciente.full_name if self.paciente_id else "—"
        return f"{self.nutricionista.full_name} con {who} @ {self.start_time}"

    def save(self, *args, **kwargs):
        # Mantener 'slot' consistente con start_time/end_time
        if self.start_time and self.end_time:
            # Rango semiabierto: [start, end) - debe ser un Range object
            from psycopg.types.range import Range
            self.slot = Range(self.start_time, self.end_time, bounds='[)')
        super().save(*args, **kwargs)


# ────────────────────────────────────────────────────────────────────────────────
# 7) Pagos (con líneas para depósito/balance/fee/refund) + auditoría webhook
# ────────────────────────────────────────────────────────────────────────────────

class PaymentProvider(models.TextChoices):
    MP = "mp", "Mercado Pago"

class PaymentLineType(models.TextChoices):
    DEPOSIT = "deposit", "Depósito"
    BALANCE = "balance", "Saldo"
    FEE = "fee", "No-show fee"
    REFUND = "refund", "Reembolso"

class Pago(models.Model):
    """
    Transacción de pago asociada a un turno. Puede componerse de múltiples líneas.
    """
    turno = models.OneToOneField(Turno, on_delete=models.CASCADE, related_name="pago")
    provider = models.CharField(max_length=16, choices=PaymentProvider.choices, default=PaymentProvider.MP)
    currency = models.CharField(max_length=8, default="ARS")
    status = models.CharField(max_length=16, choices=[("init","Init"),("pending","Pending"),("approved","Approved"),("rejected","Rejected"),("refunded","Refunded")], default="init")

    id_pago_externo = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    idempotency_key = models.CharField(max_length=120, blank=True, null=True, db_index=True)

    datos_callback = models.JSONField(null=True, blank=True)  # Auditoría de webhook (raw)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Pago turno {self.turno_id} [{self.status}]"


class PagoLinea(models.Model):
    pago = models.ForeignKey(Pago, on_delete=models.CASCADE, related_name="lineas")
    tipo = models.CharField(max_length=16, choices=PaymentLineType.choices)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)


# ────────────────────────────────────────────────────────────────────────────────
# 8) Waitlist (lista de espera) + ofertas con soft-hold
# ────────────────────────────────────────────────────────────────────────────────

class WaitlistEntry(models.Model):
    nutricionista = models.ForeignKey(Nutricionista, on_delete=models.CASCADE, related_name="waitlist")
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE, related_name="waitlist")
    ubicacion = models.ForeignKey(Ubicacion, on_delete=models.SET_NULL, null=True, blank=True, related_name="waitlist")
    preferred_days = ArrayField(models.IntegerField(), default=list)  # 0..6
    time_range = ArrayField(models.TimeField(), size=2, null=True, blank=True)  # [desde, hasta]
    notes = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("nutricionista", "paciente")

    def __str__(self):
        return f"Waitlist {self.paciente.full_name} → {self.nutricionista.full_name}"


class WaitlistOffer(models.Model):
    """
    Oferta de hueco liberado. Puede vincular a un Turno 'TENTATIVO' con soft-hold.
    """
    entry = models.ForeignKey(WaitlistEntry, on_delete=models.CASCADE, related_name="offers")
    turno = models.OneToOneField(Turno, on_delete=models.CASCADE, related_name="waitlist_offer", null=True, blank=True)
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    declined_at = models.DateTimeField(null=True, blank=True)
    canceled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["expires_at"])]

    @property
    def is_active(self):
        return self.accepted_at is None and self.declined_at is None and self.canceled_at is None and timezone.now() < self.expires_at


# ────────────────────────────────────────────────────────────────────────────────
# 9) Notificaciones + enlaces mágicos (sin login)
# ────────────────────────────────────────────────────────────────────────────────

class NotificationChannel(models.TextChoices):
    EMAIL = "email", "Email"
    WHATSAPP = "whatsapp", "WhatsApp"
    SMS = "sms", "SMS"

class NotificationLog(models.Model):
    """
    Bitácora de notificaciones transaccionales (qué, a quién, cuándo, canal).
    """
    turno = models.ForeignKey(Turno, on_delete=models.CASCADE, related_name="notifications", null=True, blank=True)
    paciente = models.ForeignKey(Paciente, on_delete=models.SET_NULL, null=True, blank=True)
    profesional = models.ForeignKey(Nutricionista, on_delete=models.SET_NULL, null=True, blank=True)

    channel = models.CharField(max_length=16, choices=NotificationChannel.choices)
    template = models.CharField(max_length=64)  # ej: booking_confirmation, reminder_24h, reminder_3h, offer_waitlist
    payload = models.JSONField(default=dict, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)  # Se establece cuando realmente se envía
    delivered = models.BooleanField(default=False)
    delivery_meta = models.JSONField(default=dict, blank=True)

    class Meta:
        indexes = [models.Index(fields=["channel", "template", "sent_at"])]


class MagicAction(models.TextChoices):
    CONFIRM = "confirm", "Confirmar turno"
    CANCEL = "cancel", "Cancelar turno"
    RESCHEDULE = "reschedule", "Reprogramar"
    TAKE_OFFER = "take_offer", "Tomar oferta waitlist"

class MagicLinkToken(models.Model):
    token = models.UUIDField(default=uuid4, editable=False, unique=True, db_index=True)
    action = models.CharField(max_length=16, choices=MagicAction.choices)
    turno = models.ForeignKey(Turno, on_delete=models.CASCADE, related_name="magic_tokens", null=True, blank=True)
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE, related_name="magic_tokens", null=True, blank=True)
    waitlist_offer = models.ForeignKey(WaitlistOffer, on_delete=models.CASCADE, related_name="magic_tokens", null=True, blank=True)

    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_valid(self):
        return self.used_at is None and timezone.now() < self.expires_at


# ────────────────────────────────────────────────────────────────────────────────
# 10) Sincronización de calendarios (Google OAuth + feed ICS)
# ────────────────────────────────────────────────────────────────────────────────

class CalendarProvider(models.TextChoices):
    GOOGLE = "google", "Google"
    ICS = "ics", "ICS (solo lectura)"
    CALDAV = "caldav", "CalDAV (futuro)"

class CalendarAccount(models.Model):
    """
    Config de sincronización por profesional. Para Google, guardarías los tokens
    en una tabla segura o en un store externo (no se incluyen aquí).
    """
    nutricionista = models.OneToOneField(Nutricionista, on_delete=models.CASCADE, related_name="calendar_account")
    provider = models.CharField(max_length=16, choices=CalendarProvider.choices, default=CalendarProvider.GOOGLE)

    # Google: ID del calendario destino seleccionado; ICS: token secreto del feed
    external_calendar_id = models.CharField(max_length=255, blank=True)
    ics_secret_token = models.CharField(max_length=64, blank=True)  # para /agenda/<token>.ics

    # Privacidad: mostrar título genérico en el proveedor externo
    privacy_generic_title = models.BooleanField(default=True)

    # Flags
    sync_enabled = models.BooleanField(default=False)
    read_busy_from_external = models.BooleanField(default=True)  # evitar doble booking leyendo busy slots

    updated_at = models.DateTimeField(auto_now=True)


class CalendarEventLink(models.Model):
    """
    Mapea Turno ↔ evento externo para updates/cancelaciones y resolución de conflictos.
    """
    turno = models.OneToOneField(Turno, on_delete=models.CASCADE, related_name="calendar_link")
    provider = models.CharField(max_length=16, choices=CalendarProvider.choices)
    external_calendar_id = models.CharField(max_length=255)
    external_event_id = models.CharField(max_length=255, db_index=True)
    external_etag = models.CharField(max_length=255, blank=True)  # para detectar cambios
    last_synced_at = models.DateTimeField(auto_now=True)
