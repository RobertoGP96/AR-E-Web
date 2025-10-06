# Servicio de Registro de Usuarios

## Resumen del Análisis

### Endpoint de Registro Disponible ✅

**URL:** `POST /api_data/user/`

**Backend (Django):**
- **Vista:** `UserViewSet` en `api/views.py`
- **Serializer:** `UserSerializer` en `api/serializers.py`
- **Modelo:** `CustomUser` en `api/models.py`
- **Permiso:** `IsAuthenticatedOrReadOnly | ReadOnlyorPost`

### Modelo CustomUser y Relaciones ✅

El modelo `CustomUser` utiliza correctamente el campo `id` como clave primaria en todas las relaciones:

```python
class CustomUser(AbstractBaseUser, PermissionsMixin):
    # El campo 'id' se crea automáticamente por Django como clave primaria
    # Campos del usuario...
```

**Relaciones que usan el ID del CustomUser:**
- `Order.client` → `ForeignKey(CustomUser, related_name="orders")`
- `Order.sales_manager` → `ForeignKey(CustomUser, related_name="managed_orders")`

### Servicio de Registro Actualizado ✅

**Archivo:** `apps/client/src/services/auth/register.ts`

#### Funciones disponibles:

1. **`register(userData: RegisterData)`**
   - Registra un nuevo usuario con rol 'client' por defecto
   - Envía email de verificación automáticamente
   - Endpoint: `POST /api_data/user/`

2. **`verifyEmail(verificationSecret: string)`**
   - Verifica el email del usuario usando el secreto enviado
   - Endpoint: `GET /verify_user/{verification_secret}`

3. **`checkEmailAvailability(email: string)`**
   - Verifica si un email ya está registrado
   - Consulta: `GET /api_data/user/?email={email}`

4. **`checkPhoneAvailability(phoneNumber: string)`**
   - Verifica si un número de teléfono ya está registrado
   - Consulta: `GET /api_data/user/?phone_number={phone}`

### Hook de React ✅

**Archivo:** `apps/client/src/hooks/auth/useRegister.ts`

#### Hooks disponibles:

1. **`useRegister()`** - Mutación para registro
2. **`useVerifyEmail()`** - Mutación para verificación de email
3. **`useCheckEmailAvailability(email, enabled)`** - Query para verificar email
4. **`useCheckPhoneAvailability(phone, enabled)`** - Query para verificar teléfono
5. **`useRegisterFlow()`** - Hook completo que combina todo

### Componente de Ejemplo ✅

**Archivo:** `apps/client/src/components/examples/RegisterExample.tsx`

Componente completo que demuestra:
- Formulario de registro con validaciones
- Verificación en tiempo real de email y teléfono
- Estados de carga y errores
- Verificación de email después del registro

## Flujo de Registro

1. **Registro:**
   ```typescript
   const { register, isRegistering } = useRegisterFlow();
   
   await register({
     email: 'usuario@ejemplo.com',
     password: 'contraseña123',
     name: 'Juan',
     last_name: 'Pérez',
     home_address: 'Calle 123, Ciudad',
     phone_number: '+5355555555'
   });
   ```

2. **Verificación de Email:**
   ```typescript
   const { verifyEmail } = useRegisterFlow();
   
   // El usuario recibe un email con el código
   await verifyEmail('codigo_de_verificacion_del_email');
   ```

3. **Login:**
   ```typescript
   // Una vez verificado, el usuario puede hacer login
   await login({
     phone_number: '+5355555555',
     password: 'contraseña123'
   });
   ```

## Configuración Necesaria

### Variables de Entorno

Asegúrate de que el archivo `.env` en el cliente tenga:

```env
VITE_API_URL=http://localhost:8000/arye_system
```

### Configuración de Email (Backend)

El backend debe tener configurado el envío de emails para la verificación. Revisa:
- `api/utils/email_sender.py`
- Configuración SMTP en `config/settings.py`

## Uso en Producción

1. **Validaciones adicionales:** Considera agregar validaciones más estrictas para números de teléfono según el país
2. **Rate limiting:** Implementa limitaciones para evitar spam de registros
3. **Captcha:** Considera agregar verificación captcha para registros públicos
4. **Logs:** Implementa logging adecuado para monitorear registros

## Estructura de Respuesta

### Registro Exitoso
```json
{
  "user_id": 123,
  "email": "usuario@ejemplo.com",
  "name": "Juan",
  "last_name": "Pérez",
  "home_address": "Calle 123, Ciudad",
  "phone_number": "+5355555555",
  "role": "client",
  "agent_profit": 0,
  "is_staff": false,
  "is_active": false,
  "is_verified": false,
  "sent_verification_email": true,
  "date_joined": "2025-10-05T10:30:00Z"
}
```

### Error de Registro
```json
{
  "success": false,
  "message": "Error al registrar usuario",
  "errors": [
    {
      "message": "Este número de teléfono ya está registrado",
      "code": "unique_constraint"
    }
  ]
}
```