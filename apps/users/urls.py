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
]