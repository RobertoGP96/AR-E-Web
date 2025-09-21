"""
Management command para crear superusuario
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

class Command(BaseCommand):
    help = 'Crear superusuario usando variables de entorno'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            help='Username del superusuario',
        )
        parser.add_argument(
            '--email',
            type=str,
            help='Email del superusuario',
        )
        parser.add_argument(
            '--password',
            type=str,
            help='Password del superusuario',
        )

    def handle(self, *args, **options):
        User = get_user_model()
        
        # Usar argumentos o variables de entorno
        username = options['username'] or os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
        email = options['email'] or os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@ejemplo.com')
        password = options['password'] or os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin123')
        
        # Verificar si el usuario ya existe
        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.WARNING(f'El superusuario "{username}" ya existe')
            )
            return
        
        # Crear superusuario
        try:
            user = User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            self.stdout.write(
                self.style.SUCCESS(f'Superusuario "{username}" creado exitosamente')
            )
            self.stdout.write(f'Email: {email}')
            self.stdout.write(f'Password: {password}')
            self.stdout.write(f'Admin URL: /admin/')
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creando superusuario: {e}')
            )