from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.users.models import Person, Patient
from datetime import date

User = get_user_model()

class Command(BaseCommand):
    help = 'Crea usuarios de prueba para el sistema'

    def handle(self, *args, **options):
        # Crear superusuario admin
        admin_user, created = User.objects.get_or_create(
            dni='00000000',
            defaults={
                'username': 'admin',
                'first_name': 'Administrador',
                'last_name': 'Sistema',
                'email': 'admin@nutrisalud.com',
                'role': 'nutricionista',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Superusuario creado: DNI {admin_user.dni}, password: admin123')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Superusuario ya existe: DNI {admin_user.dni}')
            )

        # Crear nutricionista
        nutri_user, created = User.objects.get_or_create(
            dni='12345678',
            defaults={
                'username': 'nutri123',
                'first_name': 'Dr. María',
                'last_name': 'Nutricionista',
                'email': 'nutri@nutrisalud.com',
                'role': 'nutricionista',
                'is_staff': True
            }
        )
        if created:
            nutri_user.set_password('nutri123')
            nutri_user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Nutricionista creado: DNI {nutri_user.dni}, password: nutri123')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Nutricionista ya existe: DNI {nutri_user.dni}')
            )

        # Crear pacientes
        pacientes_data = [
            {
                'dni': '20234567',
                'first_name': 'Carlos',
                'last_name': 'López',
                'email': 'carlos@email.com',
                'birth_date': date(1985, 5, 15)
            },
            {
                'dni': '20345678',
                'first_name': 'María',
                'last_name': 'Rodríguez',
                'email': 'maria@email.com',
                'birth_date': date(1990, 8, 22)
            },
            {
                'dni': '30456789',
                'first_name': 'Ana',
                'last_name': 'García',
                'email': 'ana@email.com',
                'birth_date': date(1992, 3, 10)
            }
        ]

        for paciente_data in pacientes_data:
            user, created = User.objects.get_or_create(
                dni=paciente_data['dni'],
                defaults={
                    'username': paciente_data['dni'],
                    'first_name': paciente_data['first_name'],
                    'last_name': paciente_data['last_name'],
                    'email': paciente_data['email'],
                    'role': 'paciente'
                }
            )
            
            if created:
                user.set_password('paciente123')
                user.save()
                
                # Crear Person
                person, _ = Person.objects.get_or_create(
                    user=user,
                    defaults={
                        'birth_date': paciente_data['birth_date'],
                        'phone': '123456789',
                        'address': 'Dirección de prueba'
                    }
                )
                
                # Crear Patient y asignarlo al nutricionista
                patient, _ = Patient.objects.get_or_create(
                    person=person,
                    defaults={
                        'assigned_nutritionist': nutri_user,
                        'medical_history': 'Historia médica de prueba',
                        'allergies': 'Sin alergias conocidas'
                    }
                )
                
                self.stdout.write(
                    self.style.SUCCESS(f'Paciente creado: {user.get_full_name()} - DNI {user.dni}, password: paciente123')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Paciente ya existe: DNI {user.dni}')
                )

        self.stdout.write(
            self.style.SUCCESS('\n=== CREDENCIALES DE ACCESO ===')
        )
        self.stdout.write('ADMIN: DNI 00000000, password: admin123')
        self.stdout.write('NUTRICIONISTA: DNI 12345678, password: nutri123')
        self.stdout.write('PACIENTES: password: paciente123')
        self.stdout.write('  - Carlos López: DNI 20234567')
        self.stdout.write('  - María Rodríguez: DNI 20345678')
        self.stdout.write('  - Ana García: DNI 30456789')

