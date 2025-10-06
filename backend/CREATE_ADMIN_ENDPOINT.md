# Endpoint para Creación de Usuarios Administrativos

## Descripción
Este endpoint permite crear usuarios con rol de administrador utilizando una clave secreta para validación. Es útil para la configuración inicial del sistema y la creación de administradores adicionales.

## Endpoint
```
POST /admin/create/
```

## Autenticación
- **No requiere autenticación JWT**
- **Requiere clave secreta** definida en las variables de entorno

## Parámetros de Entrada

### Campos Requeridos:
- `secret_key` (string): Clave secreta para crear administradores
- `name` (string): Nombre del administrador
- `last_name` (string): Apellido del administrador  
- `phone_number` (string): Número de teléfono (único)
- `home_address` (string): Dirección del administrador

### Campos Opcionales:
- `email` (string): Email del administrador (debe ser único si se proporciona)
- `password` (string): Contraseña del administrador (se genera automáticamente si no se proporciona)

## Ejemplo de Petición

```json
{
  "secret_key": "your-secret-key-here",
  "name": "Juan",
  "last_name": "Pérez",
  "email": "admin@empresa.com",
  "phone_number": "+5355123456",
  "home_address": "Calle 123, Ciudad",
  "password": "mi-contraseña-segura"
}
```

## Respuestas

### 201 Created - Usuario Creado Exitosamente
```json
{
  "success": true,
  "message": "Usuario administrador creado exitosamente",
  "admin_user": {
    "id": 1,
    "name": "Juan",
    "last_name": "Pérez", 
    "email": "admin@empresa.com",
    "phone_number": "+5355123456",
    "home_address": "Calle 123, Ciudad",
    "role": "admin",
    "is_staff": true,
    "is_active": true,
    "is_verified": true,
    "password": "contraseña-generada-automáticamente"
  }
}
```

### 400 Bad Request - Error de Validación
```json
{
  "success": false,
  "error": "Clave secreta incorrecta"
}
```

```json
{
  "success": false,
  "error": "Ya existe un usuario con ese número de teléfono"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "La funcionalidad de creación de administradores no está configurada"
}
```

## Configuración

### Variable de Entorno
Añadir en el archivo `.env` o variables de entorno del sistema:

```env
ADMIN_CREATION_SECRET_KEY=tu-clave-secreta-super-segura
```

### Características del Usuario Creado
- **Rol**: `admin`
- **is_staff**: `True` (acceso al panel de administración de Django)
- **is_superuser**: `True` (permisos completos)
- **is_active**: `True` (cuenta activa)
- **is_verified**: `True` (verificado automáticamente)

## Seguridad

⚠️ **Importante**: 
- Cambiar la clave secreta por defecto en producción
- La clave secreta se debe mantener confidencial
- El endpoint no requiere autenticación, por lo que la clave secreta es la única protección
- Se recomienda usar HTTPS en producción para proteger la transmisión de la clave

## Uso Recomendado

1. **Configuración inicial**: Crear el primer administrador del sistema
2. **Administradores adicionales**: Crear usuarios admin según necesidades
3. **Scripts de despliegue**: Automatizar la creación de administradores en diferentes entornos

## Ejemplo con cURL

```bash
curl -X POST http://localhost:8000/admin/create/ \
  -H "Content-Type: application/json" \
  -d '{
    "secret_key": "your-secret-key-here",
    "name": "Admin",
    "last_name": "Principal", 
    "email": "admin@empresa.com",
    "phone_number": "+5355123456",
    "home_address": "Oficina Central"
  }'
```

## Script de Prueba

Se incluye un script `test_create_admin.py` para probar el endpoint:

```bash
cd backend
python test_create_admin.py
```