from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import login
from django.core.mail import send_mail
from django.conf import settings
import logging

from .models import User, Patient, PatientInvitation, Appointment
from .serializers import (
    UserSerializer, 
    LoginSerializer, 
    RegisterSerializer,
    PatientSerializer,
    PatientCreateSerializer,
    PatientUpdateSerializer,
    ChangePasswordSerializer,
    PasswordResetSerializer,
    PatientInvitationCreateSerializer,
    PatientInvitationSerializer,
    AcceptInvitationSerializer,
    HistoriaClinicaSerializer,
    HabitosAlimenticiosSerializer,
    IndicadoresDietariosSerializer,
    DatosCalculadoraSerializer,
    FormularioCapturaSerializer,
    AppointmentSerializer,
    AppointmentCreateSerializer,
    AvailableDateSerializer,
    AvailableTimeSlotSerializer,
    NutritionistSerializer
)

logger = logging.getLogger(__name__)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generar tokens JWT
            refresh = RefreshToken.for_user(user)
            
            # Datos del usuario
            user_data = UserSerializer(user).data
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': user_data,
                'message': 'Login exitoso'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]  # Solo admin puede registrar usuarios

    def create(self, request, *args, **kwargs):
        # Verificar que solo admin puede registrar usuarios
        if not request.user.is_authenticated or not request.user.is_staff:
            return Response(
                {'error': 'Solo administradores pueden registrar usuarios'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user_data = UserSerializer(user).data
            return Response({
                'user': user_data,
                'message': 'Usuario registrado exitosamente'
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logout exitoso'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Token inválido'}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get(self, request, *args, **kwargs):
        user = self.get_object()
        user_data = UserSerializer(user, context={'request': request}).data
        
        # Agregar datos adicionales según el rol
        if user.role == 'paciente' and hasattr(user, 'person') and hasattr(user.person, 'patient'):
            user_data['patient_data'] = PatientSerializer(user.person.patient).data
            
        return Response({
            'user': user_data,
            'role': user.role
        })
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Filtrar is_active del request.data para evitar que se envíe desde frontend
        data = request.data.copy()
        if 'is_active' in data:
            data.pop('is_active')
        
        # Actualizar los campos del usuario
        serializer = self.get_serializer(instance, data=data, partial=partial, context={'request': request})
        
        if serializer.is_valid():
            # Actualizar campos del usuario
            user = serializer.save()
            
            # Si se proporciona teléfono, actualizar en Person
            phone = request.data.get('phone')
            if phone is not None and hasattr(user, 'person'):
                user.person.phone = phone
                user.person.save()
            
            # Respuesta con datos actualizados
            response_data = UserSerializer(user, context={'request': request}).data
            
            return Response({
                'message': 'Perfil actualizado correctamente',
                'user': response_data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            current_password = serializer.validated_data['current_password']
            
            # Verificar contraseña actual
            if not user.check_password(current_password):
                return Response({'error': 'Contraseña actual incorrecta'}, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            return Response({'message': 'Contraseña cambiada exitosamente'}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.get(email=email)
            
            # Generar token de reset (simplificado para MVP)
            reset_token = RefreshToken.for_user(user)
            
            # En MVP, solo loggear a consola
            logger.info(f"Password reset for {email}. Token: {reset_token}")
            print(f"=== PASSWORD RESET ===")
            print(f"Email: {email}")
            print(f"Reset Token: {reset_token}")
            print(f"========================")
            
            return Response({
                'message': 'Se ha enviado un email con instrucciones para restablecer tu contraseña'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Vistas para el CRUD de pacientes (solo para nutricionistas)
class PatientListView(generics.ListCreateAPIView):
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Solo nutricionistas pueden ver pacientes
        if self.request.user.role == 'nutricionista':
            # IMPORTANTE: Solo mostrar pacientes asignados a este nutricionista
            base_query = Patient.objects.filter(assigned_nutritionist=self.request.user)
            
            # Por defecto solo mostrar pacientes activos
            # Pero permitir ver todos con parámetro show_inactive=true
            show_inactive = self.request.query_params.get('show_inactive', 'false').lower() == 'true'
            if show_inactive:
                return base_query  # Todos los pacientes del nutricionista (activos e inactivos)
            else:
                return base_query.filter(person__user__is_active=True)  # Solo activos del nutricionista
        return Patient.objects.none()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PatientCreateSerializer
        return PatientSerializer

    def create(self, request, *args, **kwargs):
        if request.user.role != 'nutricionista':
            return Response(
                {'error': 'Solo nutricionistas pueden crear pacientes'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            patient = serializer.save()
            return Response({
                'message': 'Paciente creado exitosamente',
                'patient': PatientSerializer(patient).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Nueva vista para invitar pacientes
class PatientInviteView(generics.CreateAPIView):
    serializer_class = PatientInvitationCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        if request.user.role != 'nutricionista':
            return Response(
                {'error': 'Solo nutricionistas pueden invitar pacientes'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            invitation = serializer.save()
            
            # En MVP, mostrar en consola el enlace de invitación
            invitation_link = f"http://localhost:5175/auth/complete-registration?token={invitation.token}"
            print(f"\n=== INVITACIÓN DE PACIENTE CREADA ===")
            print(f"Paciente: {invitation.first_name} {invitation.last_name}")
            print(f"Email: {invitation.email}")
            print(f"DNI: {invitation.dni}")
            print(f"Link de invitación: {invitation_link}")
            print(f"Expira: {invitation.expires_at.strftime('%d/%m/%Y %H:%M')}")
            print(f"=====================================\n")
            
            return Response({
                'message': 'Invitación enviada exitosamente',
                'invitation': PatientInvitationSerializer(invitation).data,
                'invitation_link': invitation_link  # Solo para MVP/desarrollo
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Vista para listar invitaciones pendientes
class PatientInvitationListView(generics.ListAPIView):
    serializer_class = PatientInvitationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'nutricionista':
            return PatientInvitation.objects.filter(invited_by=self.request.user)
        return PatientInvitation.objects.none()


# Vista para que el paciente complete su registro
class CompleteRegistrationView(generics.CreateAPIView):
    serializer_class = AcceptInvitationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generar tokens JWT para el nuevo usuario
            refresh = RefreshToken.for_user(user)
            user_data = UserSerializer(user).data
            
            return Response({
                'message': 'Registro completado exitosamente',
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': user_data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Vista para obtener detalles de una invitación
class InvitationDetailView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, token):
        try:
            invitation = PatientInvitation.objects.get(token=token)
        except PatientInvitation.DoesNotExist:
            return Response(
                {'error': 'Token de invitación inválido'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if invitation.status != 'pending':
            return Response(
                {'error': 'Esta invitación ya fue procesada'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if invitation.is_expired:
            invitation.mark_as_expired()
            return Response(
                {'error': 'Esta invitación ha expirado'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'invitation': {
                'first_name': invitation.first_name,
                'last_name': invitation.last_name,
                'email': invitation.email,
                'dni': invitation.dni,
                'expires_at': invitation.expires_at,
                'invited_by': invitation.invited_by.get_full_name()
            }
        })


class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'nutricionista':
            # IMPORTANTE: Nutricionista solo puede ver SUS pacientes asignados (activos e inactivos)
            return Patient.objects.filter(assigned_nutritionist=self.request.user)
        elif self.request.user.role == 'paciente':
            # Paciente solo puede ver su propio perfil (y solo si está activo)
            return Patient.objects.filter(person__user=self.request.user, person__user__is_active=True)
        return Patient.objects.none()

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return PatientUpdateSerializer
        return PatientSerializer

    def update(self, request, *args, **kwargs):
        if request.user.role not in ['nutricionista', 'paciente']:
            return Response(
                {'error': 'No tienes permisos para actualizar'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            patient = serializer.save()
            return Response({
                'message': 'Paciente actualizado exitosamente',
                'patient': PatientSerializer(patient).data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'nutricionista':
            return Response(
                {'error': 'Solo nutricionistas pueden desactivar pacientes'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        instance = self.get_object()
        patient_name = f"{instance.person.user.first_name} {instance.person.user.last_name}"
        
        # NO eliminar, solo desactivar el usuario
        user = instance.person.user
        user.is_active = False
        user.save()
        
        return Response({
            'message': f'Paciente {patient_name} desactivado exitosamente'
        }, status=status.HTTP_200_OK)


# Vistas para el sistema de captura de historia clínica y hábitos alimenticios

class FormularioCapturaView(APIView):
    """
    Vista para capturar el formulario completo de historia clínica y hábitos alimenticios
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != 'nutricionista':
            return Response(
                {'error': 'Solo nutricionistas pueden capturar formularios'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = FormularioCapturaSerializer(data=request.data)
        if serializer.is_valid():
            try:
                result = serializer.save()
                
                # Generar JSON de respuesta según la estructura solicitada
                response_data = self._generate_response_json(result)
                
                return Response({
                    'message': 'Formulario capturado exitosamente',
                    'data': response_data,
                    'resumen': self._generate_resumen_textual(result)
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response(
                    {'error': f'Error al procesar el formulario: {str(e)}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _generate_response_json(self, result):
        """Generar el JSON de respuesta según la estructura solicitada"""
        paciente = result['paciente']
        historia = result['historia_clinica']
        habitos = result['habitos_alimenticios']
        indicadores = result['indicadores_dietarios']
        calculadora = result['datos_calculadora']
        
        return {
            "paciente_ref": {
                "id_paciente": paciente.id,
                "dni": paciente.person.user.dni,
                "nombre": paciente.person.user.first_name,
                "apellido": paciente.person.user.last_name,
                "sexo": "",  # No está en el modelo actual
                "edad": None  # Se puede calcular desde birth_date
            },
            "historia_clinica": {
                "antecedentes_familiares": historia.antecedentes_familiares,
                "enfermedades_actuales": historia.enfermedades_actuales,
                "modifico_dieta": historia.modifico_dieta,
                "medicacion": {
                    "usa": historia.medicacion_usa,
                    "detalle": historia.medicacion_detalle
                },
                "cirugias_recientes": {
                    "tiene": historia.cirugias_tiene,
                    "detalle": historia.cirugias_detalle
                }
            },
            "habitos_alimenticios": {
                "comidas_por_dia": habitos.comidas_por_dia,
                "tiempos": habitos.tiempos_comida,
                "salta_comidas": {
                    "si_no": habitos.salta_comidas,
                    "cuales": habitos.cuales_comidas_salta,
                    "por_que": habitos.por_que_salta
                },
                "con_quien_vive": habitos.con_quien_vive,
                "quien_cocina": habitos.quien_cocina,
                "hora_levantarse": habitos.hora_levantarse.strftime("%H:%M") if habitos.hora_levantarse else "",
                "ingestas_fuera": {
                    "si_no": habitos.ingestas_fuera,
                    "que": habitos.que_ingestas_fuera,
                    "frecuencia": habitos.frecuencia_ingestas_fuera
                },
                "intolerancias_alergias": {
                    "si_no": habitos.intolerancias_alergias,
                    "lista": habitos.lista_intolerancias
                },
                "preferidos": habitos.preferidos,
                "desagrados": habitos.desagrados,
                "suplementos": {
                    "si_no": habitos.suplementos_usa,
                    "cuales": habitos.cuales_suplementos
                },
                "interfiere_emocional": habitos.interfiere_emocional,
                "agrega_sal": habitos.agrega_sal,
                "medios_coccion": habitos.medios_coccion,
                "agua_vasos_dia": habitos.agua_vasos_dia,
                "bebidas_industriales_vasos_dia": habitos.bebidas_industriales_vasos_dia,
                "cafe": {
                    "si_no": habitos.cafe_usa,
                    "veces_semana": habitos.cafe_veces_semana
                },
                "alcohol": {
                    "si_no": habitos.alcohol_usa,
                    "frecuencia": habitos.alcohol_frecuencia
                },
                "mate_terere": {
                    "si_no": habitos.mate_terere_usa,
                    "frecuencia": habitos.mate_terere_frecuencia
                },
                "actividad_fisica": {
                    "si_no": habitos.actividad_fisica_usa,
                    "tipo": habitos.actividad_fisica_tipo,
                    "frecuencia": habitos.actividad_fisica_frecuencia,
                    "duracion_min": habitos.actividad_fisica_duracion_min
                }
            },
            "indicadores_dietarios": {
                "recordatorio_24h": indicadores.recordatorio_24h,
                "frecuencia_consumo": indicadores.frecuencia_consumo
            },
            "datos_para_calculadora": {
                "peso_kg": calculadora.peso_kg,
                "talla_cm": calculadora.talla_cm,
                "cintura_cm": calculadora.cintura_cm,
                "cadera_cm": calculadora.cadera_cm,
                "pliegues": {
                    "tricipital_mm": calculadora.pliegue_tricipital_mm,
                    "subescapular_mm": calculadora.pliegue_subescapular_mm,
                    "suprailíaco_mm": calculadora.pliegue_suprailíaco_mm
                },
                "get_inputs": {
                    "actividad_fisica_nivel": calculadora.actividad_fisica_nivel,
                    "peso_kg": calculadora.get_peso_kg,
                    "talla_cm": calculadora.get_talla_cm,
                    "edad": calculadora.get_edad,
                    "sexo": calculadora.get_sexo
                }
            }
        }

    def _generate_resumen_textual(self, result):
        """Generar un resumen textual de los datos capturados"""
        paciente = result['paciente']
        historia = result['historia_clinica']
        habitos = result['habitos_alimenticios']
        
        resumen = f"Formulario capturado para {paciente.person.user.get_full_name()} (DNI: {paciente.person.user.dni}). "
        
        # Resumen de historia clínica
        if historia.antecedentes_familiares:
            resumen += f"Antecedentes familiares: {', '.join(historia.antecedentes_familiares)}. "
        
        if historia.enfermedades_actuales:
            resumen += f"Enfermedades actuales: {', '.join(historia.enfermedades_actuales)}. "
        
        # Resumen de hábitos alimenticios
        if habitos.comidas_por_dia:
            resumen += f"Realiza {habitos.comidas_por_dia} comidas al día. "
        
        if habitos.salta_comidas == 'SI':
            resumen += f"Salta comidas: {habitos.cuales_comidas_salta}. "
        
        if habitos.actividad_fisica_usa == 'SI':
            resumen += f"Realiza actividad física: {habitos.actividad_fisica_tipo}. "
        
        resumen += "Datos guardados exitosamente para análisis nutricional."
        
        return resumen


class BuscarPacienteView(APIView):
    """
    Vista para buscar pacientes por DNI o ID
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'nutricionista':
            return Response(
                {'error': 'Solo nutricionistas pueden buscar pacientes'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        dni = request.query_params.get('dni')
        id_paciente = request.query_params.get('id_paciente')
        
        if not dni and not id_paciente:
            return Response(
                {'error': 'Debe proporcionar DNI o ID del paciente'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            if dni:
                user = User.objects.get(dni=dni, role='paciente')
                paciente = user.person.patient
            else:
                paciente = Patient.objects.get(id=id_paciente)
            
            # Verificar que el paciente esté asignado al nutricionista
            if paciente.assigned_nutritionist != request.user:
                return Response(
                    {'error': 'No tiene permisos para acceder a este paciente'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return Response({
                'paciente': {
                    'id': paciente.id,
                    'dni': paciente.person.user.dni,
                    'nombre': paciente.person.user.first_name,
                    'apellido': paciente.person.user.last_name,
                    'email': paciente.person.user.email,
                    'telefono': paciente.person.phone,
                    'fecha_nacimiento': paciente.person.birth_date
                }
            })
            
        except (User.DoesNotExist, Patient.DoesNotExist):
            return Response(
                {'error': 'Paciente no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class ObtenerFormularioExistenteView(APIView):
    """
    Vista para obtener un formulario existente de un paciente
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, paciente_id):
        if request.user.role != 'nutricionista':
            return Response(
                {'error': 'Solo nutricionistas pueden acceder a formularios'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            paciente = Patient.objects.get(id=paciente_id)
            
            # Verificar que el paciente esté asignado al nutricionista
            if paciente.assigned_nutritionist != request.user:
                return Response(
                    {'error': 'No tiene permisos para acceder a este paciente'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Obtener datos existentes
            historia = getattr(paciente, 'historia_clinica', None)
            habitos = getattr(paciente, 'habitos_alimenticios', None)
            indicadores = getattr(paciente, 'indicadores_dietarios', None)
            calculadora = getattr(paciente, 'datos_calculadora', None)
            
            response_data = {
                'paciente': {
                    'id': paciente.id,
                    'dni': paciente.person.user.dni,
                    'nombre': paciente.person.user.first_name,
                    'apellido': paciente.person.user.last_name
                },
                'historia_clinica': HistoriaClinicaSerializer(historia).data if historia else None,
                'habitos_alimenticios': HabitosAlimenticiosSerializer(habitos).data if habitos else None,
                'indicadores_dietarios': IndicadoresDietariosSerializer(indicadores).data if indicadores else None,
                'datos_calculadora': DatosCalculadoraSerializer(calculadora).data if calculadora else None
            }
            
            return Response(response_data)
            
        except Patient.DoesNotExist:
            return Response(
                {'error': 'Paciente no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )


# Vistas para el sistema de citas

class AppointmentListCreateView(generics.ListCreateAPIView):
    """Vista para listar y crear citas"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AppointmentCreateSerializer
        return AppointmentSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'nutricionista':
            # Los nutricionistas ven todas sus citas
            return Appointment.objects.filter(nutritionist=user).order_by('appointment_date', 'appointment_time')
        elif user.role == 'paciente':
            # Los pacientes ven solo sus citas
            try:
                patient = user.person.patient
                return Appointment.objects.filter(patient=patient).order_by('appointment_date', 'appointment_time')
            except AttributeError:
                return Appointment.objects.none()
        
        return Appointment.objects.none()
    
    def perform_create(self, serializer):
        user = self.request.user
        
        if user.role == 'paciente':
            # Si es paciente, asignar automáticamente su nutricionista
            try:
                patient = user.person.patient
                nutritionist = patient.assigned_nutritionist
                if not nutritionist:
                    raise serializers.ValidationError("No tienes un nutricionista asignado.")
                
                # Validar que no haya conflicto de horarios
                appointment_date = serializer.validated_data.get('appointment_date')
                appointment_time = serializer.validated_data.get('appointment_time')
                
                existing_appointment = Appointment.objects.filter(
                    nutritionist=nutritionist,
                    appointment_date=appointment_date,
                    appointment_time=appointment_time,
                    status__in=['scheduled', 'confirmed']
                )
                
                if existing_appointment.exists():
                    raise serializers.ValidationError(
                        f"Ya existe una cita programada para el {appointment_date} a las {appointment_time}."
                    )
                
                appointment = serializer.save(patient=patient, nutritionist=nutritionist)
                print(f"DEBUG: Turno creado - ID: {appointment.id}, Paciente: {patient.id}, Nutricionista: {nutritionist.id}")
                print(f"DEBUG: Fecha: {appointment.appointment_date}, Hora: {appointment.appointment_time}")
            except AttributeError:
                raise serializers.ValidationError("Perfil de paciente no encontrado.")
        else:
            # Si es nutricionista, también validar conflictos de horarios
            appointment_date = serializer.validated_data.get('appointment_date')
            appointment_time = serializer.validated_data.get('appointment_time')
            nutritionist_id = serializer.validated_data.get('nutritionist')
            
            # Validar que no haya conflicto de horarios para el nutricionista
            existing_appointment = Appointment.objects.filter(
                nutritionist=nutritionist_id,
                appointment_date=appointment_date,
                appointment_time=appointment_time,
                status__in=['scheduled', 'confirmed']
            )
            
            if existing_appointment.exists():
                existing = existing_appointment.first()
                patient_name = existing.patient.person.user.get_full_name()
                raise serializers.ValidationError(
                    f"Ya existe una cita programada para el {appointment_date} a las {appointment_time} con el paciente {patient_name}."
                )
            
            serializer.save()


class AppointmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para ver, actualizar y eliminar una cita específica"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AppointmentSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'nutricionista':
            return Appointment.objects.filter(nutritionist=user)
        elif user.role == 'paciente':
            try:
                patient = user.person.patient
                return Appointment.objects.filter(patient=patient)
            except AttributeError:
                return Appointment.objects.none()
        
        return Appointment.objects.none()


class AvailableAppointmentsView(APIView):
    """Vista para obtener horarios disponibles para agendar citas"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        nutritionist_id = request.query_params.get('nutritionist_id')
        date = request.query_params.get('date')
        
        # Determinar el nutricionista
        if user.role == 'paciente':
            try:
                patient = user.person.patient
                nutritionist = patient.assigned_nutritionist
                if not nutritionist:
                    return Response(
                        {'error': 'No tienes un nutricionista asignado'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except AttributeError:
                return Response(
                    {'error': 'Perfil de paciente no encontrado'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif user.role == 'nutricionista':
            nutritionist = user
        else:
            return Response(
                {'error': 'Rol de usuario no válido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if nutritionist_id and user.role == 'nutricionista':
            try:
                nutritionist = User.objects.get(id=nutritionist_id, role='nutricionista')
            except User.DoesNotExist:
                return Response(
                    {'error': 'Nutricionista no encontrado'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Horarios disponibles (configurables)
        available_times = [
            '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'
        ]
        
        if date:
            # Obtener horarios ocupados para una fecha específica
            from datetime import datetime
            try:
                appointment_date = datetime.strptime(date, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Formato de fecha inválido. Use YYYY-MM-DD'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            occupied_appointments = Appointment.objects.filter(
                nutritionist=nutritionist,
                appointment_date=appointment_date,
                status__in=['scheduled', 'confirmed']
            ).values_list('appointment_time', flat=True)
            
            # Convertir tiempos a formato HH:MM para comparación
            occupied_times = [time.strftime('%H:%M') if hasattr(time, 'strftime') else str(time)[:5] for time in occupied_appointments]
            
            time_slots = []
            for time_str in available_times:
                is_available = time_str not in occupied_times
                time_slots.append({
                    'time': time_str,
                    'is_available': is_available,
                    'appointment_id': None
                })
            
            return Response({
                'date': date,
                'nutritionist': {
                    'id': nutritionist.id,
                    'name': nutritionist.get_full_name(),
                    'dni': nutritionist.dni
                },
                'time_slots': time_slots
            })
        
        # Si no se especifica fecha, devolver horarios disponibles para los próximos 30 días
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        start_date = timezone.now().date()
        end_date = start_date + timedelta(days=30)
        
        available_dates = []
        
        for i in range(30):
            current_date = start_date + timedelta(days=i)
            
            # Saltar fines de semana
            if current_date.weekday() >= 5:  # 5 = sábado, 6 = domingo
                continue
            
            occupied_appointments = Appointment.objects.filter(
                nutritionist=nutritionist,
                appointment_date=current_date,
                status__in=['scheduled', 'confirmed']
            ).values_list('appointment_time', flat=True)
            
            # Convertir tiempos a formato HH:MM para comparación
            occupied_times = [time.strftime('%H:%M') if hasattr(time, 'strftime') else str(time)[:5] for time in occupied_appointments]
            
            time_slots = []
            for time_str in available_times:
                is_available = time_str not in occupied_times
                time_slots.append({
                    'time': time_str,
                    'is_available': is_available,
                    'appointment_id': None
                })
            
            available_dates.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'time_slots': time_slots
            })
        
        return Response({
            'nutritionist': {
                'id': nutritionist.id,
                'name': nutritionist.get_full_name(),
                'dni': nutritionist.dni
            },
            'available_dates': available_dates
        })


class PatientAppointmentsView(APIView):
    """Vista específica para que los pacientes vean sus citas"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        if user.role != 'paciente':
            return Response(
                {'error': 'Acceso denegado'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            patient = user.person.patient
            appointments = Appointment.objects.filter(patient=patient).order_by('appointment_date', 'appointment_time')
            
            # Log para depuración
            print(f"DEBUG: Usuario: {user.dni}, Patient ID: {patient.id if patient else 'None'}")
            print(f"DEBUG: Turnos encontrados: {appointments.count()}")
            
            serializer = AppointmentSerializer(appointments, many=True)
            return Response(serializer.data)
        except AttributeError as e:
            print(f"DEBUG: Error AttributeError: {e}")
            return Response(
                {'error': 'Perfil de paciente no encontrado'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class NutritionistAppointmentsView(APIView):
    """Vista específica para que los nutricionistas vean sus citas"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        if user.role != 'nutricionista':
            return Response(
                {'error': 'Acceso denegado'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        appointments = Appointment.objects.filter(nutritionist=user).order_by('appointment_date', 'appointment_time')
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)


# ===== VISTAS PARA ADMINISTRADOR - GESTIÓN DE NUTRICIONISTAS =====

class NutritionistListView(generics.ListCreateAPIView):
    """Listar y crear nutricionistas - Solo para administradores"""
    serializer_class = NutritionistSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Solo superusuarios pueden acceder
        if not self.request.user.is_superuser:
            return User.objects.none()
        return User.objects.filter(role='nutricionista').order_by('-date_joined')
    
    def create(self, request, *args, **kwargs):
        # Verificar que es superusuario
        if not request.user.is_superuser:
            return Response(
                {'error': 'Solo administradores pueden crear nutricionistas'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Obtener datos del request
            dni = request.data.get('dni')
            first_name = request.data.get('first_name')
            last_name = request.data.get('last_name')
            email = request.data.get('email')
            
            # Validar datos requeridos
            if not all([dni, first_name, last_name, email]):
                return Response(
                    {'error': 'Faltan campos requeridos: dni, first_name, last_name, email'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verificar que el DNI no exista
            if User.objects.filter(dni=dni).exists():
                return Response(
                    {'error': 'Ya existe un usuario con este DNI'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generar contraseña temporal
            import random
            import string
            temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
            
            # Crear el nutricionista directamente
            nutritionist = User.objects.create_user(
                dni=dni,
                username=dni,
                first_name=first_name,
                last_name=last_name,
                email=email,
                role='nutricionista',
                is_staff=True,
                is_active=True,
                password=temp_password
            )
            
            return Response({
                'message': 'Nutricionista creado exitosamente',
                'nutritionist': {
                    'id': nutritionist.id,
                    'dni': nutritionist.dni,
                    'first_name': nutritionist.first_name,
                    'last_name': nutritionist.last_name,
                    'email': nutritionist.email,
                    'is_active': nutritionist.is_active,
                    'date_joined': nutritionist.date_joined
                },
                'temp_password': temp_password
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Error al crear nutricionista: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class NutritionistDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Ver, editar y eliminar nutricionista - Solo para administradores"""
    serializer_class = NutritionistSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Solo superusuarios pueden acceder
        if not self.request.user.is_superuser:
            return User.objects.none()
        return User.objects.filter(role='nutricionista')
    
    def update(self, request, *args, **kwargs):
        # Verificar que es superusuario
        if not request.user.is_superuser:
            return Response(
                {'error': 'Solo administradores pueden editar nutricionistas'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        # Verificar que es superusuario
        if not request.user.is_superuser:
            return Response(
                {'error': 'Solo administradores pueden eliminar nutricionistas'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)