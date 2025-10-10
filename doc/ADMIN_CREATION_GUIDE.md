# Guía Completa: Crear Administrador/Superusuario Django

## 🎯 Métodos para Crear Superusuario

### 1. 💻 **Desarrollo Local (Interactivo)**

#### Windows PowerShell:
```powershell
cd "backend"
python manage.py createsuperuser
```

#### Linux/Mac/Git Bash:
```bash
cd backend
python manage.py createsuperuser
```

El comando te pedirá:
- Username
- Email
- Password
- Confirmar password

### 2. 🚀 **Usando Scripts Automatizados**

#### Windows PowerShell:
```powershell
# Usar valores por defecto (admin/admin@ejemplo.com/admin123)
.\create_admin.ps1

# Especificar valores personalizados
.\create_admin.ps1 -Username "miusuario" -Email "mi@email.com" -Password "mipassword"
```

#### Linux/Mac/Git Bash:
```bash
# Dar permisos de ejecución
chmod +x create_admin.sh

# Usar valores por defecto
./create_admin.sh

# Especificar valores personalizados
./create_admin.sh "miusuario" "mi@email.com" "mipassword"
```

### 3. 🔧 **Comando Personalizado Django**

```bash
cd backend
python manage.py create_admin

# Con parámetros específicos
python manage.py create_admin --username miusuario --email mi@email.com --password mipassword
```

### 4. 🌐 **Para Producción (Render)**

#### Configurar Variables de Entorno en Render:
```
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@tudominio.com
DJANGO_SUPERUSER_PASSWORD=tu_password_seguro
```

El superusuario se creará automáticamente durante el despliegue.

### 5. 📝 **Comando No Interactivo (Tradicional)**

```bash
cd backend

# Configurar variables de entorno primero
export DJANGO_SUPERUSER_USERNAME=admin
export DJANGO_SUPERUSER_EMAIL=admin@ejemplo.com
export DJANGO_SUPERUSER_PASSWORD=admin123

# Crear superusuario sin interacción
python manage.py createsuperuser --noinput
```

## 🔑 **Variables de Entorno para Render**

Agrega estas variables en Render Dashboard para crear automáticamente el superusuario:

```
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@tudominio.com
DJANGO_SUPERUSER_PASSWORD=TuPasswordSeguro123!
```

⚠️ **Importante**: Usa un password seguro en producción.

## 🌐 **Acceso al Panel Admin**

### Desarrollo Local:
```
http://localhost:8000/admin/
```

### Producción (Render):
```
https://tu-app-name.onrender.com/admin/
```

## 🛠️ **Comandos Adicionales de Gestión**

### Verificar si un usuario existe:
```bash
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); print('Usuario admin existe:', User.objects.filter(username='admin').exists())"
```

### Cambiar password de un usuario existente:
```bash
python manage.py changepassword admin
```

### Listar todos los superusuarios:
```bash
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); [print(f'{u.username} - {u.email}') for u in User.objects.filter(is_superuser=True)]"
```

### Eliminar un superusuario:
```bash
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').delete()"
```

## 🔧 **Solución de Problemas**

### Error: "Superuser creation skipped due to not running in a TTY"
**Solución**: Usar el comando personalizado `create_admin` o configurar variables de entorno.

### Error: "UNIQUE constraint failed: auth_user.username"
**Solución**: El usuario ya existe. Usar un username diferente o eliminar el existente.

### Error: "django.core.exceptions.ImproperlyConfigured"
**Solución**: Verificar que Django esté configurado correctamente y que estés en el directorio correcto.

### Error: "ModuleNotFoundError: No module named 'django'"
**Solución**: Activar el entorno virtual e instalar dependencias:
```bash
pip install -r requirements.txt
```

## 📊 **Verificar Funcionamiento**

Después de crear el superusuario, verifica que funcione:

1. **Inicia el servidor** (desarrollo local):
   ```bash
   python manage.py runserver
   ```

2. **Ve al admin**: `http://localhost:8000/admin/`

3. **Inicia sesión** con las credenciales creadas

4. **Deberías ver el panel de administración de Django**

## 🎨 **Personalizar el Admin**

El proyecto ya tiene configuración personalizada del admin en `api/admin.py`. Puedes:

- Gestionar usuarios
- Ver y modificar pedidos
- Administrar productos
- Configurar tiendas
- Revisar paquetes y entregas

## 🔐 **Seguridad en Producción**

### Recomendaciones:
1. **Password seguro**: Mínimo 12 caracteres, mayúsculas, minúsculas, números y símbolos
2. **Email real**: Para notificaciones y recuperación
3. **Username único**: No usar 'admin' en producción
4. **Variables de entorno**: Nunca hardcodear credenciales en el código
5. **HTTPS**: Siempre usar conexiones seguras en producción

### Ejemplo de credenciales seguras para producción:
```
DJANGO_SUPERUSER_USERNAME=superadmin_2024
DJANGO_SUPERUSER_EMAIL=admin@tudominio.com
DJANGO_SUPERUSER_PASSWORD=MiP@ssw0rd!Segur0#2024
```