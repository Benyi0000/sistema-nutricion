from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
import uuid
from datetime import datetime, timedelta
from django.utils import timezone


class User(AbstractUser):
    ROLE_CHOICES = [
        ('nutricionista', 'Nutricionista'),
        ('paciente', 'Paciente'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='paciente')
    dni = models.CharField(
        max_length=8, 
        unique=True,
        validators=[RegexValidator(r'^\d{8}$', 'DNI debe tener 8 dígitos')]
    )
    profile_photo = models.ImageField(upload_to='profiles/', null=True, blank=True)
    
    USERNAME_FIELD = 'dni'
    REQUIRED_FIELDS = ['username', 'email']
    
    def __str__(self):
        return f"{self.dni} - {self.get_full_name() or self.username}"


class Person(models.Model):
    GENDER_CHOICES = [
        ('M', 'Masculino'),
        ('F', 'Femenino'),
        ('O', 'Otro'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='person')
    birth_date = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, null=True, blank=True)
    emergency_contact = models.CharField(max_length=100, blank=True)
    emergency_phone = models.CharField(max_length=15, blank=True)
    
    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username}"


class Patient(models.Model):
    person = models.OneToOneField(Person, on_delete=models.CASCADE, related_name='patient')
    assigned_nutritionist = models.ForeignKey(User, on_delete=models.CASCADE, related_name='patients', limit_choices_to={'role': 'nutricionista'}, null=True, blank=True)
    medical_history = models.TextField(blank=True)
    family_history = models.TextField(blank=True)
    current_medications = models.TextField(blank=True)
    allergies = models.TextField(blank=True)
    lifestyle_notes = models.TextField(blank=True)
    
    # Condiciones médicas comunes
    has_diabetes = models.BooleanField(default=False)
    has_hypertension = models.BooleanField(default=False)
    has_heart_disease = models.BooleanField(default=False)
    has_thyroid_issues = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Paciente: {self.person.user.get_full_name()}"


class Consultation(models.Model):
    CONSULTATION_TYPES = [
        ('inicial', 'Consulta Inicial'),
        ('seguimiento', 'Consulta de Seguimiento'),
    ]
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='consultations')
    nutritionist = models.ForeignKey(User, on_delete=models.CASCADE, related_name='consultations')
    consultation_type = models.CharField(max_length=20, choices=CONSULTATION_TYPES)
    date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.consultation_type} - {self.patient.person.user.get_full_name()} - {self.date.strftime('%d/%m/%Y')}"


class AnthropometricMeasurement(models.Model):
    consultation = models.OneToOneField(Consultation, on_delete=models.CASCADE, related_name='measurements')
    
    # Medidas básicas
    weight = models.FloatField(help_text="Peso en kg")
    height = models.FloatField(help_text="Altura en metros")
    
    # Composición corporal
    body_fat_percentage = models.FloatField(null=True, blank=True, help_text="Porcentaje de grasa corporal")
    muscle_mass_percentage = models.FloatField(null=True, blank=True, help_text="Porcentaje de masa muscular")
    
    # Circunferencias
    waist_circumference = models.FloatField(null=True, blank=True, help_text="Circunferencia de cintura en cm")
    hip_circumference = models.FloatField(null=True, blank=True, help_text="Circunferencia de cadera en cm")
    
    # Pliegues cutáneos
    triceps_skinfold = models.FloatField(null=True, blank=True, help_text="Pliegue tríceps en mm")
    subscapular_skinfold = models.FloatField(null=True, blank=True, help_text="Pliegue subescapular en mm")
    suprailiac_skinfold = models.FloatField(null=True, blank=True, help_text="Pliegue suprailiaco en mm")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    @property
    def bmi(self):
        """Calcula el IMC (BMI)"""
        if self.weight and self.height:
            return round(self.weight / (self.height ** 2), 2)
        return None
    
    @property
    def waist_hip_ratio(self):
        """Calcula la relación cintura-cadera (ICC)"""
        if self.waist_circumference and self.hip_circumference:
            return round(self.waist_circumference / self.hip_circumference, 2)
        return None
    
    def calculate_tmb(self, age, gender):
        """
        Calcula la Tasa Metabólica Basal (TMB) usando la ecuación de Harris-Benedict revisada
        gender: 'M' para masculino, 'F' para femenino
        age: edad en años
        """
        if not self.weight or not self.height or not age:
            return None
        
        height_cm = self.height * 100  # Convertir metros a cm
        
        if gender == 'M':
            # TMB Hombres = 88.362 + (13.397 × peso en kg) + (4.799 × altura en cm) - (5.677 × edad)
            tmb = 88.362 + (13.397 * self.weight) + (4.799 * height_cm) - (5.677 * age)
        elif gender == 'F':
            # TMB Mujeres = 447.593 + (9.247 × peso en kg) + (3.098 × altura en cm) - (4.330 × edad)
            tmb = 447.593 + (9.247 * self.weight) + (3.098 * height_cm) - (4.330 * age)
        else:
            return None
        
        return round(tmb, 2)
    
    def calculate_get(self, age, gender, activity_level='sedentary'):
        """
        Calcula el Gasto Energético Total (GET) = TMB × Factor de Actividad
        activity_level: 'sedentary', 'light', 'moderate', 'active', 'very_active'
        """
        tmb = self.calculate_tmb(age, gender)
        if not tmb:
            return None
        
        # Factores de actividad física
        activity_factors = {
            'sedentary': 1.2,      # Sedentario (poco o ningún ejercicio)
            'light': 1.375,        # Ligera (ejercicio 1-3 días/semana)
            'moderate': 1.55,      # Moderada (ejercicio 3-5 días/semana)
            'active': 1.725,       # Activa (ejercicio 6-7 días/semana)
            'very_active': 1.9,    # Muy activa (ejercicio intenso diario)
        }
        
        factor = activity_factors.get(activity_level, 1.2)
        get = tmb * factor
        
        return round(get, 2)
    
    def __str__(self):
        return f"Medidas - {self.consultation.patient.person.user.get_full_name()} - {self.consultation.date.strftime('%d/%m/%Y')}"


class NutritionPlan(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='nutrition_plans')
    nutritionist = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_plans')
    title = models.CharField(max_length=200)
    pdf_file = models.FileField(upload_to='nutrition_plans/')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Plan: {self.title} - {self.patient.person.user.get_full_name()}"


# Modelos para captura de historia clínica y hábitos alimenticios

class HistoriaClinica(models.Model):
    """Modelo para capturar la historia clínica del paciente"""
    patient = models.OneToOneField(Patient, on_delete=models.CASCADE, related_name='historia_clinica')
    
    # Antecedentes familiares (múltiples opciones)
    antecedentes_familiares = models.JSONField(default=list, help_text="Lista de antecedentes familiares")
    
    # Enfermedades actuales
    enfermedades_actuales = models.JSONField(default=list, help_text="Lista de enfermedades que padece actualmente")
    
    # Modificación de dieta por enfermedad
    modifico_dieta = models.CharField(max_length=2, choices=[('SI', 'Sí'), ('NO', 'No')], default='NO')
    
    # Medicación actual
    medicacion_usa = models.CharField(max_length=2, choices=[('SI', 'Sí'), ('NO', 'No')], default='NO')
    medicacion_detalle = models.TextField(blank=True, help_text="Detalle de la medicación actual")
    
    # Cirugías recientes
    cirugias_tiene = models.CharField(max_length=2, choices=[('SI', 'Sí'), ('NO', 'No')], default='NO')
    cirugias_detalle = models.TextField(blank=True, help_text="Detalle de cirugías recientes")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Historia Clínica - {self.patient.person.user.get_full_name()}"


class HabitosAlimenticios(models.Model):
    """Modelo para capturar los hábitos alimenticios del paciente"""
    patient = models.OneToOneField(Patient, on_delete=models.CASCADE, related_name='habitos_alimenticios')
    
    # Comidas por día
    comidas_por_dia = models.IntegerField(null=True, blank=True, help_text="Número de comidas al día")
    tiempos_comida = models.JSONField(default=list, help_text="Tiempos de comida marcados")
    
    # Salta comidas
    salta_comidas = models.CharField(max_length=2, choices=[('SI', 'Sí'), ('NO', 'No')], default='NO')
    cuales_comidas_salta = models.TextField(blank=True, help_text="¿Cuáles comidas salta?")
    por_que_salta = models.TextField(blank=True, help_text="¿Por qué salta comidas?")
    
    # Contexto social
    con_quien_vive = models.TextField(blank=True, help_text="¿Con quién vive?")
    quien_cocina = models.TextField(blank=True, help_text="¿Quién cocina?")
    hora_levantarse = models.TimeField(null=True, blank=True, help_text="¿A qué hora se levanta?")
    
    # Ingestas fuera de comidas principales
    ingestas_fuera = models.CharField(max_length=2, choices=[('SI', 'Sí'), ('NO', 'No')], default='NO')
    que_ingestas_fuera = models.TextField(blank=True, help_text="¿Qué consume fuera de las comidas principales?")
    frecuencia_ingestas_fuera = models.TextField(blank=True, help_text="Frecuencia de ingestas fuera de comidas")
    
    # Intolerancias y alergias
    intolerancias_alergias = models.CharField(max_length=2, choices=[('SI', 'Sí'), ('NO', 'No')], default='NO')
    lista_intolerancias = models.JSONField(default=list, help_text="Lista de intolerancias/alergias")
    
    # Preferencias alimentarias
    preferidos = models.TextField(blank=True, help_text="Alimentos preferidos")
    desagrados = models.TextField(blank=True, help_text="Alimentos que no le gustan")
    
    # Suplementos
    suplementos_usa = models.CharField(max_length=2, choices=[('SI', 'Sí'), ('NO', 'No')], default='NO')
    cuales_suplementos = models.TextField(blank=True, help_text="¿Cuáles suplementos usa?")
    
    # Aspectos emocionales y conductuales
    interfiere_emocional = models.CharField(max_length=2, choices=[('SI', 'Sí'), ('NO', 'No')], default='NO')
    agrega_sal = models.CharField(max_length=2, choices=[('SI', 'Sí'), ('NO', 'No')], default='NO')
    
    # Medios de cocción
    medios_coccion = models.JSONField(default=list, help_text="Medios de cocción principales")
    
    # Hidratación
    agua_vasos_dia = models.IntegerField(null=True, blank=True, help_text="Vasos de agua al día")
    bebidas_industriales_vasos_dia = models.IntegerField(null=True, blank=True, help_text="Vasos de bebidas industriales al día")
    
    # Consumo de estimulantes
    cafe_usa = models.CharField(max_length=2, choices=[('SI', 'Sí'), ('NO', 'No')], default='NO')
    cafe_veces_semana = models.IntegerField(null=True, blank=True, help_text="Veces por semana que consume café")
    
    alcohol_usa = models.CharField(max_length=2, choices=[('SI', 'Sí'), ('NO', 'No')], default='NO')
    alcohol_frecuencia = models.TextField(blank=True, help_text="Frecuencia de consumo de alcohol")
    
    mate_terere_usa = models.CharField(max_length=2, choices=[('SI', 'Sí'), ('NO', 'No')], default='NO')
    mate_terere_frecuencia = models.TextField(blank=True, help_text="Frecuencia de consumo de mate/tereré")
    
    # Actividad física
    actividad_fisica_usa = models.CharField(max_length=2, choices=[('SI', 'Sí'), ('NO', 'No')], default='NO')
    actividad_fisica_tipo = models.TextField(blank=True, help_text="Tipo de actividad física")
    actividad_fisica_frecuencia = models.TextField(blank=True, help_text="Frecuencia de actividad física")
    actividad_fisica_duracion_min = models.IntegerField(null=True, blank=True, help_text="Duración en minutos")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Hábitos Alimenticios - {self.patient.person.user.get_full_name()}"


class IndicadoresDietarios(models.Model):
    """Modelo para capturar indicadores dietarios del paciente"""
    patient = models.OneToOneField(Patient, on_delete=models.CASCADE, related_name='indicadores_dietarios')
    
    # Recordatorio 24h
    recordatorio_24h = models.JSONField(default=list, help_text="Recordatorio de 24 horas")
    
    # Frecuencia de consumo
    frecuencia_consumo = models.JSONField(default=dict, help_text="Frecuencia de consumo de alimentos")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Indicadores Dietarios - {self.patient.person.user.get_full_name()}"


class DatosCalculadora(models.Model):
    """Modelo para almacenar datos que se usarán en el módulo Calculadora"""
    patient = models.OneToOneField(Patient, on_delete=models.CASCADE, related_name='datos_calculadora')
    
    # Para IMC
    peso_kg = models.FloatField(null=True, blank=True, help_text="Peso en kilogramos")
    talla_cm = models.FloatField(null=True, blank=True, help_text="Talla en centímetros")
    talla_m = models.FloatField(null=True, blank=True, help_text="Talla en metros")
    
    # Para ICT/ICC
    cintura_cm = models.FloatField(null=True, blank=True, help_text="Circunferencia de cintura en cm")
    cadera_cm = models.FloatField(null=True, blank=True, help_text="Circunferencia de cadera en cm")
    
    # Pliegues cutáneos
    pliegue_tricipital_mm = models.FloatField(null=True, blank=True, help_text="Pliegue tríceps en mm")
    pliegue_subescapular_mm = models.FloatField(null=True, blank=True, help_text="Pliegue subescapular en mm")
    pliegue_suprailíaco_mm = models.FloatField(null=True, blank=True, help_text="Pliegue suprailíaco en mm")
    
    # Para GET (Gasto Energético Total)
    actividad_fisica_nivel = models.CharField(max_length=50, blank=True, help_text="Nivel de actividad física")
    get_peso_kg = models.FloatField(null=True, blank=True, help_text="Peso para cálculo GET")
    get_talla_cm = models.FloatField(null=True, blank=True, help_text="Talla para cálculo GET")
    get_edad = models.IntegerField(null=True, blank=True, help_text="Edad para cálculo GET")
    get_sexo = models.CharField(max_length=10, blank=True, help_text="Sexo para cálculo GET")
    
    # Otros datos
    porcentaje_grasa_input = models.FloatField(null=True, blank=True, help_text="Porcentaje de grasa (input manual)")
    metodo_porcentaje_grasa = models.CharField(max_length=100, blank=True, help_text="Método usado para medir % grasa")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Datos Calculadora - {self.patient.person.user.get_full_name()}"


class PatientInvitation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('accepted', 'Aceptada'),
        ('expired', 'Expirada'),
    ]
    
    # Información del paciente a invitar
    dni = models.CharField(max_length=8, unique=True, validators=[RegexValidator(r'^\d{8}$', 'DNI debe tener 8 dígitos')])
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    email = models.EmailField()
    
    # Información médica básica (opcional)
    birth_date = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=200, blank=True)
    has_diabetes = models.BooleanField(default=False)
    has_hypertension = models.BooleanField(default=False)
    medical_history = models.TextField(blank=True)
    allergies = models.TextField(blank=True)
    
    # Control de invitación
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invitations')
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Usuario creado después de aceptar la invitación
    created_user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='invitation')
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            # Expira en 7 días
            self.expires_at = timezone.now() + timedelta(days=7)
        super().save(*args, **kwargs)
    
    @property
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    def mark_as_expired(self):
        if self.status == 'pending':
            self.status = 'expired'
            self.save()
    
    def accept_invitation(self, password):
        """Acepta la invitación y crea el usuario completo"""
        if self.status != 'pending' or self.is_expired:
            raise ValueError("La invitación no es válida o ha expirado")
        
        # Crear usuario
        user = User.objects.create_user(
            dni=self.dni,
            username=self.dni,
            first_name=self.first_name,
            last_name=self.last_name,
            email=self.email,
            password=password,
            role='paciente'
        )
        
        # Crear person
        person = Person.objects.create(
            user=user,
            birth_date=self.birth_date,
            phone=self.phone,
            address=self.address
        )
        
        # Crear patient y asignarlo al nutricionista que lo invitó
        patient = Patient.objects.create(
            person=person,
            assigned_nutritionist=self.invited_by,
            has_diabetes=self.has_diabetes,
            has_hypertension=self.has_hypertension,
            medical_history=self.medical_history,
            allergies=self.allergies
        )
        
        # Marcar invitación como aceptada
        self.status = 'accepted'
        self.completed_at = timezone.now()
        self.created_user = user
        self.save()
        
        return user
    
    def __str__(self):
        return f"Invitación: {self.first_name} {self.last_name} ({self.email}) - {self.get_status_display()}"


class DocumentAttachment(models.Model):
    """Modelo para adjuntar documentos (análisis clínicos, recetas, imágenes) a pacientes o consultas"""
    DOCUMENT_TYPES = [
        ('analysis', 'Análisis Clínico'),
        ('recipe', 'Receta Médica'),
        ('image', 'Imagen'),
        ('report', 'Reporte'),
        ('other', 'Otro'),
    ]
    
    # Puede estar asociado a un paciente o a una consulta específica
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='documents', null=True, blank=True)
    consultation = models.ForeignKey('Consultation', on_delete=models.CASCADE, related_name='documents', null=True, blank=True)
    
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    title = models.CharField(max_length=200, help_text="Título del documento")
    description = models.TextField(blank=True, help_text="Descripción adicional")
    file = models.FileField(upload_to='documents/', help_text="Archivo adjunto")
    
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_documents')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        target = f"Paciente: {self.patient}" if self.patient else f"Consulta: {self.consultation}"
        return f"{self.get_document_type_display()} - {self.title} - {target}"


class Appointment(models.Model):
    """Modelo para gestionar las citas entre pacientes y nutricionistas"""
    STATUS_CHOICES = [
        ('scheduled', 'Programada'),
        ('confirmed', 'Confirmada'),
        ('completed', 'Completada'),
        ('cancelled', 'Cancelada'),
        ('no_show', 'No se presentó'),
    ]
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    nutritionist = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments', limit_choices_to={'role': 'nutricionista'})
    
    # Fecha y hora de la cita
    appointment_date = models.DateField(help_text="Fecha de la cita")
    appointment_time = models.TimeField(help_text="Hora de la cita")
    
    # Estado y notas
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    notes = models.TextField(blank=True, help_text="Notas adicionales sobre la cita")
    
    # Control de tiempo
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Campos para seguimiento
    duration_minutes = models.IntegerField(default=60, help_text="Duración en minutos")
    consultation_type = models.CharField(
        max_length=20, 
        choices=[
            ('inicial', 'Consulta Inicial'),
            ('seguimiento', 'Consulta de Seguimiento'),
            ('control', 'Control'),
        ],
        default='seguimiento'
    )
    
    class Meta:
        ordering = ['appointment_date', 'appointment_time']
        unique_together = ['nutritionist', 'appointment_date', 'appointment_time']
        indexes = [
            models.Index(fields=['appointment_date', 'appointment_time']),
            models.Index(fields=['nutritionist', 'appointment_date']),
            models.Index(fields=['patient', 'appointment_date']),
        ]
    
    @property
    def datetime(self):
        """Retorna la fecha y hora combinadas"""
        from django.utils import timezone
        naive_datetime = timezone.datetime.combine(self.appointment_date, self.appointment_time)
        return timezone.make_aware(naive_datetime)
    
    @property
    def is_past(self):
        """Verifica si la cita ya pasó"""
        from django.utils import timezone
        return self.datetime < timezone.now()
    
    @property
    def is_today(self):
        """Verifica si la cita es hoy"""
        from django.utils import timezone
        return self.appointment_date == timezone.now().date()
    
    @property
    def is_upcoming(self):
        """Verifica si la cita es futura"""
        return not self.is_past and self.status in ['scheduled', 'confirmed']
    
    def can_be_cancelled(self):
        """Verifica si la cita puede ser cancelada"""
        return self.status in ['scheduled', 'confirmed'] and not self.is_past
    
    def can_be_rescheduled(self):
        """Verifica si la cita puede ser reagendada"""
        return self.status in ['scheduled', 'confirmed'] and not self.is_past
    
    def __str__(self):
        return f"Cita: {self.patient.person.user.get_full_name()} con {self.nutritionist.get_full_name()} - {self.appointment_date.strftime('%d/%m/%Y')} {self.appointment_time.strftime('%H:%M')}"


class Payment(models.Model):
    """Modelo para gestionar los pagos de pacientes"""
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Efectivo'),
        ('transfer', 'Transferencia'),
        ('mercadopago', 'MercadoPago'),
        ('card', 'Tarjeta de Crédito/Débito'),
        ('other', 'Otro'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('approved', 'Aprobado'),
        ('rejected', 'Rechazado'),
        ('cancelled', 'Cancelado'),
        ('refunded', 'Reembolsado'),
    ]
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='payments')
    nutritionist = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_payments', limit_choices_to={'role': 'nutricionista'})
    
    # Información del pago
    amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Monto del pago")
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Relación con consulta o plan (opcional)
    consultation = models.ForeignKey(Consultation, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    nutrition_plan = models.ForeignKey(NutritionPlan, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    
    # Descripción y notas
    description = models.CharField(max_length=200, help_text="Descripción del pago")
    notes = models.TextField(blank=True, help_text="Notas adicionales")
    
    # Datos de MercadoPago (si aplica)
    mercadopago_payment_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    mercadopago_preference_id = models.CharField(max_length=100, blank=True, null=True)
    mercadopago_status = models.CharField(max_length=50, blank=True, null=True)
    mercadopago_status_detail = models.CharField(max_length=200, blank=True, null=True)
    
    # Control de fechas
    payment_date = models.DateTimeField(null=True, blank=True, help_text="Fecha en que se completó el pago")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['nutritionist', 'status']),
            models.Index(fields=['mercadopago_payment_id']),
        ]
    
    def __str__(self):
        return f"Pago #{self.id} - {self.patient.person.user.get_full_name()} - ${self.amount} - {self.get_status_display()}"


class PaymentProof(models.Model):
    """Modelo para almacenar comprobantes de pago"""
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='proof')
    
    # Datos del comprobante
    proof_number = models.CharField(max_length=50, unique=True, help_text="Número de comprobante")
    issue_date = models.DateField(auto_now_add=True)
    
    # Archivo del comprobante (PDF generado)
    pdf_file = models.FileField(upload_to='payment_proofs/', null=True, blank=True)
    
    # Información fiscal (opcional)
    tax_id = models.CharField(max_length=20, blank=True, help_text="CUIT/CUIL")
    fiscal_address = models.TextField(blank=True, help_text="Domicilio fiscal")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Comprobante #{self.proof_number} - Pago #{self.payment.id}"
    
    def generate_proof_number(self):
        """Genera un número de comprobante único"""
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        return f"COMP-{timestamp}-{self.payment.id}"
    
    def save(self, *args, **kwargs):
        if not self.proof_number:
            self.proof_number = self.generate_proof_number()
        super().save(*args, **kwargs)


class MealPhoto(models.Model):
    """Modelo para el registro de fotos de comidas de los pacientes"""
    MEAL_TYPE_CHOICES = [
        ('breakfast', 'Desayuno'),
        ('morning_snack', 'Colación Media Mañana'),
        ('lunch', 'Almuerzo'),
        ('afternoon_snack', 'Merienda'),
        ('dinner', 'Cena'),
        ('night_snack', 'Colación Nocturna'),
        ('other', 'Otro'),
    ]
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='meal_photos')
    
    # Información de la comida
    meal_type = models.CharField(max_length=20, choices=MEAL_TYPE_CHOICES, help_text="Tipo de comida")
    meal_date = models.DateField(help_text="Fecha de la comida")
    meal_time = models.TimeField(help_text="Hora de la comida")
    
    # Foto de la comida
    photo = models.ImageField(upload_to='meal_photos/', help_text="Foto de la comida")
    
    # Descripción y notas
    description = models.TextField(blank=True, help_text="Descripción de la comida")
    notes = models.TextField(blank=True, help_text="Notas adicionales (ej: porciones, preparación)")
    
    # Información nutricional estimada (opcional)
    estimated_calories = models.IntegerField(null=True, blank=True, help_text="Calorías estimadas")
    
    # Comentarios del nutricionista
    nutritionist_comment = models.TextField(blank=True, help_text="Comentario del nutricionista")
    reviewed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='reviewed_meals',
        limit_choices_to={'role': 'nutricionista'}
    )
    reviewed_at = models.DateTimeField(null=True, blank=True, help_text="Fecha de revisión")
    
    # Control de tiempo
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-meal_date', '-meal_time']
        indexes = [
            models.Index(fields=['patient', 'meal_date']),
            models.Index(fields=['patient', 'created_at']),
        ]
    
    @property
    def is_reviewed(self):
        """Verifica si la comida fue revisada por el nutricionista"""
        return self.reviewed_by is not None
    
    def __str__(self):
        return f"{self.get_meal_type_display()} - {self.patient.person.user.get_full_name()} - {self.meal_date.strftime('%d/%m/%Y')}"