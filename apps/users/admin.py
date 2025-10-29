from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Person, Patient, Consultation, AnthropometricMeasurement, 
    NutritionPlan, PatientInvitation, Appointment, DocumentAttachment,
    Payment, PaymentProof, HistoriaClinica, HabitosAlimenticios, 
    IndicadoresDietarios, DatosCalculadora, MealPhoto
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = (
        (None, {'fields': ('dni', 'password')}),
        ('Información Personal', {'fields': ('first_name', 'last_name', 'email')}),
        ('Permisos', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Fechas Importantes', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('dni', 'first_name', 'last_name', 'email', 'role', 'password1', 'password2'),
        }),
    )
    list_display = ('dni', 'first_name', 'last_name', 'email', 'role', 'is_active')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('dni', 'first_name', 'last_name', 'email')
    ordering = ('dni',)


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone', 'birth_date')
    search_fields = ('user__dni', 'user__first_name', 'user__last_name')


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('person', 'has_diabetes', 'has_hypertension', 'created_at')
    list_filter = ('has_diabetes', 'has_hypertension', 'has_heart_disease', 'has_thyroid_issues')
    search_fields = ('person__user__dni', 'person__user__first_name', 'person__user__last_name')


@admin.register(Consultation)
class ConsultationAdmin(admin.ModelAdmin):
    list_display = ('patient', 'nutritionist', 'consultation_type', 'date')
    list_filter = ('consultation_type', 'date')
    search_fields = ('patient__person__user__dni', 'patient__person__user__first_name')


@admin.register(AnthropometricMeasurement)
class AnthropometricMeasurementAdmin(admin.ModelAdmin):
    list_display = ('consultation', 'weight', 'height', 'bmi', 'created_at')
    readonly_fields = ('bmi', 'waist_hip_ratio')


@admin.register(NutritionPlan)
class NutritionPlanAdmin(admin.ModelAdmin):
    list_display = ('patient', 'nutritionist', 'title', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('patient__person__user__dni', 'title')


@admin.register(PatientInvitation)
class PatientInvitationAdmin(admin.ModelAdmin):
    list_display = ('dni', 'first_name', 'last_name', 'email', 'invited_by', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('dni', 'first_name', 'last_name', 'email')
    readonly_fields = ('token', 'created_at', 'expires_at')


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'nutritionist', 'appointment_date', 'appointment_time', 'status', 'consultation_type')
    list_filter = ('status', 'consultation_type', 'appointment_date')
    search_fields = ('patient__person__user__dni', 'patient__person__user__first_name', 'nutritionist__first_name')
    date_hierarchy = 'appointment_date'


@admin.register(DocumentAttachment)
class DocumentAttachmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'document_type', 'patient', 'consultation', 'uploaded_by', 'uploaded_at')
    list_filter = ('document_type', 'uploaded_at')
    search_fields = ('title', 'patient__person__user__dni', 'description')
    readonly_fields = ('uploaded_at',)


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'nutritionist', 'amount', 'payment_method', 'status', 'payment_date', 'created_at')
    list_filter = ('status', 'payment_method', 'created_at')
    search_fields = ('patient__person__user__dni', 'description', 'mercadopago_payment_id')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'


@admin.register(PaymentProof)
class PaymentProofAdmin(admin.ModelAdmin):
    list_display = ('proof_number', 'payment', 'issue_date', 'created_at')
    search_fields = ('proof_number', 'payment__patient__person__user__dni')
    readonly_fields = ('created_at',)


@admin.register(HistoriaClinica)
class HistoriaClinicaAdmin(admin.ModelAdmin):
    list_display = ('patient', 'modifico_dieta', 'medicacion_usa', 'created_at')
    search_fields = ('patient__person__user__dni', 'patient__person__user__first_name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(HabitosAlimenticios)
class HabitosAlimenticiosAdmin(admin.ModelAdmin):
    list_display = ('patient', 'comidas_por_dia', 'salta_comidas', 'actividad_fisica_usa', 'created_at')
    search_fields = ('patient__person__user__dni', 'patient__person__user__first_name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(IndicadoresDietarios)
class IndicadoresDietariosAdmin(admin.ModelAdmin):
    list_display = ('patient', 'created_at', 'updated_at')
    search_fields = ('patient__person__user__dni', 'patient__person__user__first_name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(DatosCalculadora)
class DatosCalculadoraAdmin(admin.ModelAdmin):
    list_display = ('patient', 'peso_kg', 'talla_cm', 'cintura_cm', 'created_at')
    search_fields = ('patient__person__user__dni', 'patient__person__user__first_name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(MealPhoto)
class MealPhotoAdmin(admin.ModelAdmin):
    list_display = ('patient', 'meal_type', 'meal_date', 'meal_time', 'is_reviewed', 'reviewed_by', 'created_at')
    list_filter = ('meal_type', 'meal_date', 'reviewed_by')
    search_fields = ('patient__person__user__dni', 'patient__person__user__first_name', 'description')
    readonly_fields = ('created_at', 'updated_at', 'is_reviewed')
    date_hierarchy = 'meal_date'
    
    fieldsets = (
        ('Información del Paciente', {
            'fields': ('patient',)
        }),
        ('Información de la Comida', {
            'fields': ('meal_type', 'meal_date', 'meal_time', 'photo', 'description', 'notes', 'estimated_calories')
        }),
        ('Revisión del Nutricionista', {
            'fields': ('nutritionist_comment', 'reviewed_by', 'reviewed_at')
        }),
        ('Información del Sistema', {
            'fields': ('created_at', 'updated_at', 'is_reviewed'),
            'classes': ('collapse',)
        }),
    )
