from django.contrib import admin

from django.contrib import admin
# Asumo que importas todos tus modelos; me enfoco en Turno y MagicLinkToken
from .models import (
    Ubicacion, 
    ProfessionalSettings, 
    TipoConsultaConfig, 
    DisponibilidadHoraria, 
    BloqueoDisponibilidad, 
    ProfesionalObraSocial, 
    Turno, 
    Pago, 
    PagoLinea, 
    WaitlistEntry, 
    WaitlistOffer, 
    NotificationLog, 
    MagicLinkToken, 
    CalendarAccount, 
    CalendarEventLink
)

# ... (Tus otros Admins existentes) ...

# ModelAdmins para permitir autocomplete_fields en TurnoAdmin
@admin.register(Ubicacion)
class UbicacionAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'nutricionista', 'direccion', 'is_virtual')
    list_filter = ('is_virtual', 'nutricionista')
    search_fields = ('nombre', 'direccion', 'nutricionista__user__full_name')

@admin.register(TipoConsultaConfig)
class TipoConsultaConfigAdmin(admin.ModelAdmin):
    list_display = ('get_tipo_display', 'nutricionista', 'duracion_min', 'precio')
    list_filter = ('tipo', 'nutricionista')
    search_fields = ('tipo', 'nutricionista__user__full_name')

@admin.register(Turno)
class TurnoAdmin(admin.ModelAdmin):
    list_display = (
        'start_time', 
        'nutricionista', 
        'paciente', 
        'get_public_name', # Columna helper
        'state', 
        'source', 
        'ubicacion', 
        'tipo_consulta', 
        'soft_hold_expires_at'
    )
    list_filter = ('state', 'source', 'nutricionista', 'ubicacion', 'start_time')
    search_fields = (
        'nutricionista__user__full_name', 
        'paciente__user__full_name', 
        'intake_answers__nombre_completo', # Buscar por nombre público
        'intake_answers__email'            # Buscar por email público
    )
    autocomplete_fields = ('nutricionista', 'paciente', 'ubicacion', 'tipo_consulta')
    
    def get_public_name(self, obj):
        if obj.paciente:
            return "---"
        if obj.intake_answers and isinstance(obj.intake_answers, dict):
            return obj.intake_answers.get('nombre_completo', 'Público (Sin nombre)')
        return "Público"
    get_public_name.short_description = 'Paciente Público'

@admin.register(MagicLinkToken)
class MagicLinkTokenAdmin(admin.ModelAdmin):
    list_display = ('token', 'action', 'turno', 'paciente', 'expires_at', 'used_at', 'is_valid')
    list_filter = ('action', 'used_at', 'expires_at')

# Registrar otros modelos sin autocomplete necesario
admin.site.register(ProfessionalSettings)
admin.site.register(DisponibilidadHoraria)
admin.site.register(BloqueoDisponibilidad)
admin.site.register(ProfesionalObraSocial)
admin.site.register(Pago)
admin.site.register(PagoLinea)
admin.site.register(WaitlistEntry)
admin.site.register(WaitlistOffer)
admin.site.register(NotificationLog)
admin.site.register(CalendarAccount)
admin.site.register(CalendarEventLink)

# Register your models here.
