# apps/user/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import (
    UserAccount, 
    Nutricionista, Paciente, Especialidad, AsignacionNutricionistaPaciente
)
from .models import Pregunta, Consulta

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
    search_fields = ("texto","codigo")

@admin.register(Consulta)
class ConsultaAdmin(admin.ModelAdmin):
    list_display = ("id","paciente","nutricionista","tipo","fecha")
    list_filter = ("tipo","fecha")
    search_fields = ("paciente__user__dni",)

