from django.core.management.base import BaseCommand
from apps.users.models import User, Patient, Appointment

class Command(BaseCommand):
    help = 'Debug appointments functionality'

    def handle(self, *args, **options):
        self.stdout.write("=== DEBUG APPOINTMENTS ===")
        
        # Verificar usuarios
        self.stdout.write("\n1. VERIFICANDO USUARIOS:")
        for user in User.objects.filter(role='paciente'):
            try:
                person = user.person
                patient = person.patient
                appointments_count = Appointment.objects.filter(patient=patient).count()
                
                self.stdout.write(f"  Usuario: {user.dni} ({user.get_full_name()})")
                self.stdout.write(f"  - Person ID: {person.id}")
                self.stdout.write(f"  - Patient ID: {patient.id}")
                self.stdout.write(f"  - Turnos: {appointments_count}")
                
                # Mostrar turnos específicos
                appointments = Appointment.objects.filter(patient=patient)
                for apt in appointments:
                    self.stdout.write(f"    * Turno {apt.id}: {apt.appointment_date} {apt.appointment_time} - {apt.status}")
                    
            except Exception as e:
                self.stdout.write(f"  ERROR para usuario {user.dni}: {e}")
        
        # Verificar todos los turnos
        self.stdout.write("\n2. TODOS LOS TURNOS EN EL SISTEMA:")
        for apt in Appointment.objects.all():
            self.stdout.write(f"  Turno {apt.id}: Paciente {apt.patient.id} - {apt.appointment_date} {apt.appointment_time} - {apt.status}")
        
        # Verificar nutricionistas
        self.stdout.write("\n3. NUTRICIONISTAS:")
        for user in User.objects.filter(role='nutricionista'):
            appointments_count = Appointment.objects.filter(nutritionist=user).count()
            self.stdout.write(f"  {user.dni} ({user.get_full_name()}): {appointments_count} turnos")
        
        self.stdout.write("\n=== FIN DEBUG ===")
