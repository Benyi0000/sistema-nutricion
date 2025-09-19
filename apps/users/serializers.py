from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, Person, Patient, PatientInvitation, HistoriaClinica, HabitosAlimenticios, IndicadoresDietarios, DatosCalculadora


class UserSerializer(serializers.ModelSerializer):
    profile_photo = serializers.ImageField(required=False, allow_null=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = User
        fields = ('id', 'dni', 'email', 'first_name', 'last_name', 'role', 'is_active', 'profile_photo', 'phone')
        read_only_fields = ('id', 'dni', 'role', 'is_active')  # is_active NO debe ser editable
        
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Agregar phone desde Person si existe
        if hasattr(instance, 'person'):
            data['phone'] = instance.person.phone
        # Convertir profile_photo a URL completa si existe
        if instance.profile_photo:
            request = self.context.get('request')
            if request:
                data['profile_photo'] = request.build_absolute_uri(instance.profile_photo.url)
            else:
                data['profile_photo'] = instance.profile_photo.url
        return data


class PersonSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Person
        fields = '__all__'


class PatientSerializer(serializers.ModelSerializer):
    person = PersonSerializer(read_only=True)
    assigned_nutritionist = UserSerializer(read_only=True)
    
    class Meta:
        model = Patient
        fields = '__all__'


class PatientCreateSerializer(serializers.Serializer):
    # User data
    dni = serializers.CharField(max_length=20)
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    email = serializers.EmailField()
    
    # Person data
    birth_date = serializers.DateField()
    phone = serializers.CharField(max_length=20)
    address = serializers.CharField(max_length=200)
    
    # Patient data
    has_diabetes = serializers.BooleanField(default=False)
    has_hypertension = serializers.BooleanField(default=False)
    medical_history = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    allergies = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    def validate_dni(self, value):
        if User.objects.filter(dni=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con este DNI.")
        return value
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con este email.")
        return value
    
    def create(self, validated_data):
        # Crear usuario
        user = User.objects.create(
            dni=validated_data['dni'],
            username=validated_data['dni'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            email=validated_data['email'],
            role='paciente'
        )
        user.set_password('paciente123')  # Password por defecto
        user.save()
        
        # Crear person
        person = Person.objects.create(
            user=user,
            birth_date=validated_data['birth_date'],
            phone=validated_data['phone'],
            address=validated_data['address']
        )
        
        # Crear patient y asignarlo al nutricionista que lo está creando
        patient = Patient.objects.create(
            person=person,
            assigned_nutritionist=self.context['request'].user,
            has_diabetes=validated_data.get('has_diabetes', False),
            has_hypertension=validated_data.get('has_hypertension', False),
            medical_history=validated_data.get('medical_history', ''),
            allergies=validated_data.get('allergies', '')
        )
        
        return patient


class PatientUpdateSerializer(serializers.Serializer):
    # User data (solo algunos campos editables)
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    email = serializers.EmailField()
    
    # Person data
    birth_date = serializers.DateField()
    phone = serializers.CharField(max_length=20)
    address = serializers.CharField(max_length=200)
    
    # Patient data
    has_diabetes = serializers.BooleanField(default=False)
    has_hypertension = serializers.BooleanField(default=False)
    medical_history = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    allergies = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    def validate_email(self, value):
        # Verificar que el email no esté siendo usado por otro usuario (excepto el actual)
        patient = self.instance
        if User.objects.filter(email=value).exclude(id=patient.person.user.id).exists():
            raise serializers.ValidationError("Ya existe un usuario con este email.")
        return value
    
    def update(self, instance, validated_data):
        # Actualizar usuario
        user = instance.person.user
        user.first_name = validated_data['first_name']
        user.last_name = validated_data['last_name']
        user.email = validated_data['email']
        user.save()
        
        # Actualizar person
        person = instance.person
        person.birth_date = validated_data['birth_date']
        person.phone = validated_data['phone']
        person.address = validated_data['address']
        person.save()
        
        # Actualizar patient
        instance.has_diabetes = validated_data.get('has_diabetes', False)
        instance.has_hypertension = validated_data.get('has_hypertension', False)
        instance.medical_history = validated_data.get('medical_history', '')
        instance.allergies = validated_data.get('allergies', '')
        instance.save()
        
        return instance


class LoginSerializer(serializers.Serializer):
    dni = serializers.CharField()
    password = serializers.CharField()

    def validate(self, attrs):
        dni = attrs.get('dni')
        password = attrs.get('password')
        
        if dni and password:
            user = authenticate(
                request=self.context.get('request'),
                dni=dni,
                password=password
            )

            if not user:
                msg = 'DNI o contraseña incorrectos.'
                raise serializers.ValidationError(msg, code='authorization')

            if not user.is_active:
                msg = 'Cuenta desactivada.'
                raise serializers.ValidationError(msg, code='authorization')

        else:
            msg = 'Debe incluir DNI y contraseña.'
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = user
        return attrs


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('dni', 'email', 'first_name', 'last_name', 'role', 'password', 'password_confirm')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden.")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password')
        
        user = User(**validated_data)
        user.username = validated_data['dni']  # Username = DNI
        user.set_password(password)
        user.save()

        # Crear perfil Person automáticamente
        Person.objects.create(user=user)
        
        # Si es paciente, crear perfil Patient
        if user.role == 'paciente':
            Patient.objects.create(person=user.person)

        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=False)
    current_password = serializers.CharField(required=False)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=False)
    confirm_password = serializers.CharField(required=False)

    def validate(self, attrs):
        # Permitir ambos formatos de nombres de campos
        new_pass = attrs['new_password']
        confirm_pass = attrs.get('new_password_confirm') or attrs.get('confirm_password')
        
        if confirm_pass and new_pass != confirm_pass:
            raise serializers.ValidationError("Las contraseñas nuevas no coinciden.")
        
        # Verificar que se proporcione la contraseña actual
        current_pass = attrs.get('old_password') or attrs.get('current_password')
        if not current_pass:
            raise serializers.ValidationError("Debe proporcionar la contraseña actual.")
            
        attrs['current_password'] = current_pass
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Contraseña actual incorrecta.")
        return value
    
    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Contraseña actual incorrecta.")
        return value


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No existe un usuario con este email.")
        return value


class PatientInvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientInvitation
        fields = [
            'id', 'dni', 'first_name', 'last_name', 'email',
            'birth_date', 'phone', 'address', 'has_diabetes', 'has_hypertension',
            'medical_history', 'allergies', 'status', 'created_at', 'expires_at'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'expires_at']
    
    def validate_dni(self, value):
        if User.objects.filter(dni=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con este DNI.")
        if PatientInvitation.objects.filter(dni=value, status='pending').exists():
            raise serializers.ValidationError("Ya existe una invitación pendiente para este DNI.")
        return value
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con este email.")
        if PatientInvitation.objects.filter(email=value, status='pending').exists():
            raise serializers.ValidationError("Ya existe una invitación pendiente para este email.")
        return value


class PatientInvitationCreateSerializer(serializers.Serializer):
    dni = serializers.CharField(max_length=8)
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    email = serializers.EmailField()
    birth_date = serializers.DateField(required=False)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    address = serializers.CharField(max_length=200, required=False, allow_blank=True)
    has_diabetes = serializers.BooleanField(default=False)
    has_hypertension = serializers.BooleanField(default=False)
    medical_history = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    allergies = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    def validate_dni(self, value):
        if User.objects.filter(dni=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con este DNI.")
        if PatientInvitation.objects.filter(dni=value, status='pending').exists():
            raise serializers.ValidationError("Ya existe una invitación pendiente para este DNI.")
        return value
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con este email.")
        if PatientInvitation.objects.filter(email=value, status='pending').exists():
            raise serializers.ValidationError("Ya existe una invitación pendiente para este email.")
        return value
    
    def create(self, validated_data):
        invitation = PatientInvitation.objects.create(
            invited_by=self.context['request'].user,
            **validated_data
        )
        return invitation


class AcceptInvitationSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden.")
        
        try:
            invitation = PatientInvitation.objects.get(token=attrs['token'])
        except PatientInvitation.DoesNotExist:
            raise serializers.ValidationError("Token de invitación inválido.")
        
        if invitation.status != 'pending':
            raise serializers.ValidationError("Esta invitación ya fue procesada.")
        
        if invitation.is_expired:
            invitation.mark_as_expired()
            raise serializers.ValidationError("Esta invitación ha expirado.")
        
        attrs['invitation'] = invitation
        return attrs
    
    def create(self, validated_data):
        invitation = validated_data['invitation']
        password = validated_data['password']
        
        user = invitation.accept_invitation(password)
        return user


# Serializers para el sistema de captura de historia clínica y hábitos alimenticios

class HistoriaClinicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoriaClinica
        fields = '__all__'
        read_only_fields = ('patient', 'created_at', 'updated_at')

    def create(self, validated_data):
        # El patient se asigna desde el contexto de la vista
        patient = self.context['patient']
        validated_data['patient'] = patient
        return super().create(validated_data)


class HabitosAlimenticiosSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitosAlimenticios
        fields = '__all__'
        read_only_fields = ('patient', 'created_at', 'updated_at')

    def create(self, validated_data):
        # El patient se asigna desde el contexto de la vista
        patient = self.context['patient']
        validated_data['patient'] = patient
        return super().create(validated_data)


class IndicadoresDietariosSerializer(serializers.ModelSerializer):
    class Meta:
        model = IndicadoresDietarios
        fields = '__all__'
        read_only_fields = ('patient', 'created_at', 'updated_at')

    def create(self, validated_data):
        # El patient se asigna desde el contexto de la vista
        patient = self.context['patient']
        validated_data['patient'] = patient
        return super().create(validated_data)


class DatosCalculadoraSerializer(serializers.ModelSerializer):
    class Meta:
        model = DatosCalculadora
        fields = '__all__'
        read_only_fields = ('patient', 'created_at', 'updated_at')

    def create(self, validated_data):
        # El patient se asigna desde el contexto de la vista
        patient = self.context['patient']
        validated_data['patient'] = patient
        return super().create(validated_data)


# Serializer para el formulario completo de captura
class FormularioCapturaSerializer(serializers.Serializer):
    # Datos del paciente (referencia)
    paciente_ref = serializers.DictField(required=True)
    
    # Historia clínica
    historia_clinica = serializers.DictField(required=True)
    
    # Hábitos alimenticios
    habitos_alimenticios = serializers.DictField(required=True)
    
    # Indicadores dietarios
    indicadores_dietarios = serializers.DictField(required=True)
    
    # Datos para calculadora
    datos_para_calculadora = serializers.DictField(required=True)

    def validate_paciente_ref(self, value):
        """Validar que se proporcione id_paciente o dni"""
        if not value.get('id_paciente') and not value.get('dni'):
            raise serializers.ValidationError("Debe proporcionar id_paciente o dni")
        return value

    def create(self, validated_data):
        # Obtener el paciente
        paciente_ref = validated_data['paciente_ref']
        paciente = None
        
        if paciente_ref.get('id_paciente'):
            try:
                paciente = Patient.objects.get(id=paciente_ref['id_paciente'])
            except Patient.DoesNotExist:
                raise serializers.ValidationError("Paciente no encontrado")
        elif paciente_ref.get('dni'):
            try:
                user = User.objects.get(dni=paciente_ref['dni'], role='paciente')
                paciente = user.person.patient
            except (User.DoesNotExist, AttributeError):
                raise serializers.ValidationError("Paciente no encontrado con ese DNI")

        # Crear o actualizar historia clínica
        historia_data = validated_data['historia_clinica']
        historia, created = HistoriaClinica.objects.get_or_create(
            patient=paciente,
            defaults=historia_data
        )
        if not created:
            for key, value in historia_data.items():
                setattr(historia, key, value)
            historia.save()

        # Crear o actualizar hábitos alimenticios
        habitos_data = validated_data['habitos_alimenticios']
        habitos, created = HabitosAlimenticios.objects.get_or_create(
            patient=paciente,
            defaults=habitos_data
        )
        if not created:
            for key, value in habitos_data.items():
                setattr(habitos, key, value)
            habitos.save()

        # Crear o actualizar indicadores dietarios
        indicadores_data = validated_data['indicadores_dietarios']
        indicadores, created = IndicadoresDietarios.objects.get_or_create(
            patient=paciente,
            defaults=indicadores_data
        )
        if not created:
            for key, value in indicadores_data.items():
                setattr(indicadores, key, value)
            indicadores.save()

        # Crear o actualizar datos calculadora
        calculadora_data = validated_data['datos_para_calculadora']
        calculadora, created = DatosCalculadora.objects.get_or_create(
            patient=paciente,
            defaults=calculadora_data
        )
        if not created:
            for key, value in calculadora_data.items():
                setattr(calculadora, key, value)
            calculadora.save()

        return {
            'paciente': paciente,
            'historia_clinica': historia,
            'habitos_alimenticios': habitos,
            'indicadores_dietarios': indicadores,
            'datos_calculadora': calculadora
        }