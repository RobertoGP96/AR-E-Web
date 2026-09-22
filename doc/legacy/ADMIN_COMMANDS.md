# Comandos para crear administrador/superusuario

## Metodo 1: Comando tradicional interactivo
cd backend
python manage.py createsuperuser

## Metodo 2: Comando no interactivo con variables de entorno
cd backend
set DJANGO_SUPERUSER_USERNAME=admin
set DJANGO_SUPERUSER_EMAIL=admin@ejemplo.com
set DJANGO_SUPERUSER_PASSWORD=admin123
python manage.py createsuperuser --noinput

## Metodo 3: Comando personalizado
cd backend
python manage.py create_admin

## Metodo 4: Comando personalizado con parametros
cd backend
python manage.py create_admin --username miusuario --email mi@email.com --password mipassword

## Para Render (variables de entorno en dashboard):
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@tudominio.com
DJANGO_SUPERUSER_PASSWORD=tu_password_seguro

## URLs del admin:
# Local: http://localhost:8000/admin/
# Render: https://tu-app.onrender.com/admin/