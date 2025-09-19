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
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='person')
    birth_date = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
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
        """Calcula la relación cintura-cadera"""
        if self.waist_circumference and self.hip_circumference:
            return round(self.waist_circumference / self.hip_circumference, 2)
        return None
    
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
