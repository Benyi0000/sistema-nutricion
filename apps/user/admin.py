# apps/user/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import (
    UserAccount, 
    Nutricionista, Paciente, Especialidad, AsignacionNutricionistaPaciente
)
from .models import Pregunta, Consulta, PlantillaConsulta, PlantillaPregunta

@admin.register(UserAccount)
class UserAdmin(BaseUserAdmin):
    ordering = ("dni",)
    list_display = ("dni", "email", "is_staff", "is_active", "must_change_password")
    search_fields = ("dni", "email")
    readonly_fields = ("date_joined",)

    fieldsets = (
        (None, {"fields": ("dni", "email", "password")}),
        (_("Información personal"), {"fields": ("first_name", "last_name")}),
        (_("Permisos"), {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        (_("Fechas"), {"fields": ("date_joined",)}),
        (_("Seguridad"), {"fields": ("must_change_password",)}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("dni", "email", "first_name", "last_name", "password1", "password2", "is_staff", "is_superuser"),
        }),
    )

admin.site.register(Nutricionista)
admin.site.register(Paciente)
admin.site.register(AsignacionNutricionistaPaciente)
admin.site.register(Especialidad)


# apps/user/admin.py


@admin.register(Pregunta)
class PreguntaAdmin(admin.ModelAdmin):
    list_display = ("id","texto","tipo","codigo","owner","es_inicial","orden","activo")
    list_filter = ("tipo","es_inicial","activo")
    search_fields = ("texto","codigo")  # Needed for autocomplete in PlantillaPreguntaInline

@admin.register(Consulta)
class ConsultaAdmin(admin.ModelAdmin):
    list_display = ("id","paciente","nutricionista","tipo","fecha","plantilla_usada")
    list_filter = ("tipo","fecha")


# ──────────────────────────────────────────────────────────────────────
# Sistema de Plantillas
# ──────────────────────────────────────────────────────────────────────

class PlantillaPreguntaInline(admin.TabularInline):
    model = PlantillaPregunta
    extra = 1
    autocomplete_fields = ['pregunta']
    fields = ('pregunta', 'orden', 'requerido_en_plantilla', 'visible', 'config')
    ordering = ['orden']


@admin.register(PlantillaConsulta)
class PlantillaConsultaAdmin(admin.ModelAdmin):
    list_display = (
        "id", "nombre", "tipo_consulta", "owner", 
        "es_predeterminada", "activo", "created_at"
    )
    list_filter = ("tipo_consulta", "es_predeterminada", "activo", "owner")
    search_fields = ("nombre", "descripcion")
    inlines = [PlantillaPreguntaInline]
    readonly_fields = ("created_at", "updated_at")
    
    fieldsets = (
        ("Información básica", {
            "fields": ("owner", "nombre", "descripcion", "tipo_consulta")
        }),
        ("Configuración", {
            "fields": ("es_predeterminada", "activo", "config")
        }),
        ("Metadatos", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )
    
    actions = ['duplicar_plantillas']
    
    def duplicar_plantillas(self, request, queryset):
        """Acción admin para duplicar plantillas seleccionadas"""
        count = 0
        for plantilla in queryset:
            plantilla.duplicar(nuevo_nombre=f"{plantilla.nombre} (copia admin)")
            count += 1
        self.message_user(request, f"{count} plantilla(s) duplicada(s) exitosamente.")
    duplicar_plantillas.short_description = "Duplicar plantillas seleccionadas"


@admin.register(PlantillaPregunta)
class PlantillaPreguntaAdmin(admin.ModelAdmin):
    list_display = ("id", "plantilla", "pregunta", "orden", "requerido_en_plantilla", "visible")
    list_filter = ("plantilla__tipo_consulta", "requerido_en_plantilla", "visible")
    search_fields = ("plantilla__nombre", "pregunta__texto")
    autocomplete_fields = ['plantilla', 'pregunta']
    ordering = ['plantilla', 'orden']
    search_fields = ("paciente__user__dni",)

