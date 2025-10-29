from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    RegisterView,
    LogoutView,
    UserProfileView,
    ChangePasswordView,
    PasswordResetView,
    PatientListView,
    PatientDetailView,
    PatientInviteView,
    PatientInvitationListView,
    CompleteRegistrationView,
    InvitationDetailView,
    FormularioCapturaView,
    BuscarPacienteView,
    ObtenerFormularioExistenteView,
    AppointmentListCreateView,
    AppointmentDetailView,
    AvailableAppointmentsView,
    PatientAppointmentsView,
    NutritionistAppointmentsView,
    NutritionistListView,
    NutritionistDetailView,
    # Nuevas vistas
    DocumentAttachmentListCreateView,
    DocumentAttachmentDetailView,
    ConsultationListCreateView,
    ConsultationDetailView,
    PaymentListCreateView,
    PaymentDetailView,
    MercadoPagoWebhookView,
    PatientReportPDFView,
    PatientEvolutionExcelView,
    MonthlyReportPDFView,
    SendAppointmentReminderView,
    # Vistas de registro de comidas
    MealPhotoListCreateView,
    MealPhotoDetailView,
    MealPhotoReviewView,
    PatientMealStatsView,
    # Vistas de historial de consultas
    NutritionistConsultationHistoryView,
    PatientConsultationHistoryView,
)

app_name = 'users'

urlpatterns = [
    # Autenticación
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', UserProfileView.as_view(), name='user_profile'),
    path('auth/profile/', UserProfileView.as_view(), name='user_profile_update'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('auth/forgot-password/', PasswordResetView.as_view(), name='password_reset'),
    
    # Pacientes (CRUD)
    path('patients/', PatientListView.as_view(), name='patient_list'),
    path('patients/<int:pk>/', PatientDetailView.as_view(), name='patient_detail'),
    
    # Invitaciones de pacientes
    path('patients/invite/', PatientInviteView.as_view(), name='patient_invite'),
    path('invitations/', PatientInvitationListView.as_view(), name='invitation_list'),
    path('invitations/<uuid:token>/', InvitationDetailView.as_view(), name='invitation_detail'),
    
    # Completar registro
    path('auth/complete-registration/', CompleteRegistrationView.as_view(), name='complete_registration'),
    
    # Sistema de captura de historia clínica y hábitos alimenticios
    path('formulario/captura/', FormularioCapturaView.as_view(), name='formulario_captura'),
    path('formulario/buscar-paciente/', BuscarPacienteView.as_view(), name='buscar_paciente'),
    path('formulario/paciente/<int:paciente_id>/', ObtenerFormularioExistenteView.as_view(), name='formulario_existente'),
    
    # Sistema de citas
    path('appointments/', AppointmentListCreateView.as_view(), name='appointment_list_create'),
    path('appointments/<int:pk>/', AppointmentDetailView.as_view(), name='appointment_detail'),
    path('appointments/available/', AvailableAppointmentsView.as_view(), name='available_appointments'),
    path('appointments/patient/', PatientAppointmentsView.as_view(), name='patient_appointments'),
    path('appointments/nutritionist/', NutritionistAppointmentsView.as_view(), name='nutritionist_appointments'),
    
    # Gestión de nutricionistas (Solo para administradores)
    path('nutritionists/', NutritionistListView.as_view(), name='nutritionist_list'),
    path('nutritionists/<int:pk>/', NutritionistDetailView.as_view(), name='nutritionist_detail'),
    
    # Documentos adjuntos
    path('documents/', DocumentAttachmentListCreateView.as_view(), name='document_list_create'),
    path('documents/<int:pk>/', DocumentAttachmentDetailView.as_view(), name='document_detail'),
    
    # Consultas
    path('consultations/', ConsultationListCreateView.as_view(), name='consultation_list_create'),
    path('consultations/<int:pk>/', ConsultationDetailView.as_view(), name='consultation_detail'),
    
    # Pagos
    path('payments/', PaymentListCreateView.as_view(), name='payment_list_create'),
    path('payments/<int:pk>/', PaymentDetailView.as_view(), name='payment_detail'),
    path('payments/webhook/', MercadoPagoWebhookView.as_view(), name='mercadopago_webhook'),
    
    # Reportes
    path('reports/patient/<int:patient_id>/pdf/', PatientReportPDFView.as_view(), name='patient_report_pdf'),
    path('reports/patient/<int:patient_id>/excel/', PatientEvolutionExcelView.as_view(), name='patient_evolution_excel'),
    path('reports/monthly/pdf/', MonthlyReportPDFView.as_view(), name='monthly_report_pdf'),
    
    # Notificaciones
    path('appointments/<int:appointment_id>/send-reminder/', SendAppointmentReminderView.as_view(), name='send_appointment_reminder'),
    
    # Registro de Comidas (Meal Photos)
    path('meal-photos/', MealPhotoListCreateView.as_view(), name='meal_photo_list_create'),
    path('meal-photos/<int:pk>/', MealPhotoDetailView.as_view(), name='meal_photo_detail'),
    path('meal-photos/<int:pk>/review/', MealPhotoReviewView.as_view(), name='meal_photo_review'),
    path('meal-photos/stats/<int:patient_id>/', PatientMealStatsView.as_view(), name='patient_meal_stats'),
    
    # Historial de Consultas
    path('consultations/history/', NutritionistConsultationHistoryView.as_view(), name='nutritionist_consultation_history'),
    path('consultations/history/patient/<int:patient_id>/', PatientConsultationHistoryView.as_view(), name='patient_consultation_history'),
]