# 🔐 Documentación de Correcciones de Autenticación

**Fecha:** 8 de octubre de 2025  
**Versión:** 1.0

## 📋 Resumen

Se identificó y corrigió un problema crítico de incompatibilidad entre el frontend y backend en el sistema de autenticación. El frontend estaba enviando `email` como credencial de login, mientras que el backend solo aceptaba `phone_number`.

---

## ❌ Problema Identificado

### Frontend (React Admin App)
- **Credenciales enviadas:** `{ email: string, password: string }`
- **Validación:** Zod schema requiere email válido
- **Componente:** `apps/admin/src/components/auth/login.tsx`

### Backend (Django API)
- **Credenciales esperadas:** `{ phone_number: string, password: string }`
- **Modelo:** `USERNAME_FIELD = "phone_number"`
- **Serializer original:** `PhoneTokenObtainPairSerializer`

### Impacto
- ❌ **Todos los intentos de login fallaban**
- ❌ Error 400 o ValidationError
- ❌ Sistema completamente inaccesible vía email

---

## ✅ Soluciones Implementadas

### 1. Backend - Nuevo Serializer Flexible

**Archivo:** `backend/api/views.py`

Se creó `EmailOrPhoneTokenObtainPairSerializer` que acepta:
- ✅ Login con `email` + `password`
- ✅ Login con `phone_number` + `password`
- ✅ Validación inteligente de ambos métodos

```python
class EmailOrPhoneTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer personalizado para login con email o número de teléfono.
    Permite flexibilidad para usar cualquiera de los dos métodos.
    """
    
    def validate(self, attrs):
        email = attrs.get("email")
        phone_number = attrs.get("phone_number")
        password = attrs.get("password")
        
        # Busca usuario por email o phone_number
        # Valida contraseña y estado activo
        # Retorna tokens JWT + datos de usuario
```

**Características:**
- Busca usuario por email si se proporciona
- Busca usuario por teléfono como alternativa
- Valida contraseña y estado activo del usuario
- Retorna tokens JWT estándar: `access`, `refresh`, `user`

### 2. Backend - Vista Actualizada

**Archivo:** `backend/api/views.py`

```python
class MyTokenObtainPairView(TokenObtainPairView):
    """
    Obtención de token JWT para autenticación de usuarios.
    Permite autenticación usando email o número de teléfono.
    """
    serializer_class = EmailOrPhoneTokenObtainPairSerializer
```

**Endpoint:** `POST /arye_system/auth/`

**Request Body (opción 1 - email):**
```json
{
  "email": "usuario@correo.com",
  "password": "123456"
}
```

**Request Body (opción 2 - teléfono):**
```json
{
  "phone_number": "+5355555555",
  "password": "123456"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJI...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJI...",
  "user": {
    "user_id": 1,
    "email": "usuario@correo.com",
    "name": "Nombre",
    "last_name": "Apellido",
    "home_address": "Dirección",
    "phone_number": "+5355555555",
    "role": "admin",
    "agent_profit": 0,
    "is_staff": true
  }
}
```

### 3. Frontend - Mapeo de Respuesta

**Archivo:** `apps/admin/src/lib/api-client.ts`

Se actualizó el método `login()` para mapear correctamente los tokens:

**Problema anterior:**
- Backend retorna: `access`, `refresh`
- Frontend esperaba: `access_token`, `refresh_token`

**Solución:**
```typescript
public async login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await this.client.post<{
    access: string;
    refresh: string;
    user: CustomUser;
  }>('/auth/', credentials, {
    skipAuth: true,
  });

  const backendData = response.data;
  
  // Mapear respuesta del backend al formato esperado
  const authData: AuthResponse = {
    access_token: backendData.access,
    refresh_token: backendData.refresh,
    user: backendData.user,
    expires_in: 3600,
  };
  
  // Guardar tokens
  this.setAuthToken(authData.access_token);
  localStorage.setItem('refresh_token', authData.refresh_token);

  return authData;
}
```

---

## 🔒 Sistema de Protección de Rutas

Adicionalmente, se implementó un sistema completo de protección de rutas:

### Componente ProtectedRoute

**Archivo:** `apps/admin/src/components/ProtectedRoute.tsx`

- ✅ Verifica autenticación antes de renderizar
- ✅ Redirige a `/login` si no está autenticado
- ✅ Guarda la ruta original para redirección post-login
- ✅ Muestra loading spinner durante verificación
- ✅ Soporta permisos y roles específicos

### Rutas Protegidas

**Archivo:** `apps/admin/src/routes/AppRoutes.tsx`

Todas las rutas del sistema están protegidas:
- ✅ Dashboard
- ✅ Users
- ✅ Shops
- ✅ Products
- ✅ Purchases
- ✅ Packages
- ✅ Delivery
- ✅ Orders
- ✅ Settings
- ✅ Profile

**Ruta pública:**
- `/login` - accesible sin autenticación

### Flujo de Redirección

1. Usuario intenta acceder a `/users` sin estar autenticado
2. `ProtectedRoute` detecta falta de autenticación
3. Guarda `/users` en el estado de navegación
4. Redirige a `/login`
5. Usuario inicia sesión exitosamente
6. Sistema redirige automáticamente a `/users`

---

## 🧪 Validación del Login

### Frontend - Validación con Zod

**Schema de validación:**
```typescript
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña es demasiado larga'),
  rememberMe: z.boolean(),
});
```

### Backend - Validación del Serializer

- ✅ Verifica que se proporcione email o phone_number
- ✅ Valida formato de email si se proporciona
- ✅ Valida existencia del usuario
- ✅ Verifica contraseña correcta
- ✅ Confirma que el usuario esté activo
- ✅ Genera tokens JWT válidos

---

## 📊 Tipos TypeScript

### LoginCredentials
```typescript
interface LoginCredentials {
  email: string;
  password: string;
}
```

### AuthResponse
```typescript
interface AuthResponse {
  user: CustomUser;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}
```

### CustomUser
```typescript
interface CustomUser {
  user_id: number;
  email: string | null;
  name: string;
  last_name: string;
  home_address: string;
  phone_number: string;
  role: UserRole;
  agent_profit: number;
  is_staff: boolean;
  is_active: boolean;
  is_verified: boolean;
}
```

---

## 🔄 Flujo Completo de Autenticación

### 1. Usuario Ingresa Credenciales
```
Component: Login.tsx
↓
Validación Zod
↓
React Hook Form
```

### 2. Envío al Backend
```
useAuth hook
↓
apiClient.login(credentials)
↓
POST /arye_system/auth/
↓
EmailOrPhoneTokenObtainPairSerializer
```

### 3. Validación Backend
```
Buscar usuario (email o phone)
↓
Verificar contraseña
↓
Verificar usuario activo
↓
Generar tokens JWT
```

### 4. Respuesta y Almacenamiento
```
Backend Response: {access, refresh, user}
↓
apiClient mapea a: {access_token, refresh_token, user}
↓
Guardar en localStorage
↓
Actualizar AuthContext
```

### 5. Redirección
```
isAuthenticated = true
↓
Navigate a ruta original
↓
ProtectedRoute permite acceso
↓
Renderiza contenido protegido
```

---

## 🛠️ Archivos Modificados

### Backend
1. ✅ `backend/api/views.py`
   - Agregado `EmailOrPhoneTokenObtainPairSerializer`
   - Actualizado `MyTokenObtainPairView`
   - Documentación OpenAPI actualizada

### Frontend
1. ✅ `apps/admin/src/lib/api-client.ts`
   - Método `login()` con mapeo de tokens
   - Import de `CustomUser` type

2. ✅ `apps/admin/src/components/ProtectedRoute.tsx`
   - Redirección a `/login` con estado
   - Manejo de ruta original

3. ✅ `apps/admin/src/routes/AppRoutes.tsx`
   - Envuelve rutas con `ProtectedRoute`

4. ✅ `apps/admin/src/components/auth/login.tsx`
   - Uso de `useLocation` para redirección
   - Manejo de ruta desde estado

---

## ✅ Testing Recomendado

### Tests de Login
```typescript
// Test 1: Login con email
POST /arye_system/auth/
Body: { "email": "admin@test.com", "password": "123456" }
Expected: 200 + tokens + user data

// Test 2: Login con teléfono
POST /arye_system/auth/
Body: { "phone_number": "+5355555555", "password": "123456" }
Expected: 200 + tokens + user data

// Test 3: Credenciales inválidas
POST /arye_system/auth/
Body: { "email": "admin@test.com", "password": "wrong" }
Expected: 400 + error message

// Test 4: Usuario inactivo
POST /arye_system/auth/
Body: { "email": "inactive@test.com", "password": "123456" }
Expected: 400 + "Usuario inactivo"
```

### Tests de Protección de Rutas
```typescript
// Test 1: Acceso sin autenticación
Navigate to: /users
Expected: Redirect to /login

// Test 2: Login y redirección
1. Try to access: /products
2. Redirected to: /login
3. Login successfully
Expected: Redirect to /products

// Test 3: Acceso autenticado
1. Login successfully
2. Navigate to: /dashboard
Expected: Render Dashboard component
```

---

## 🚀 Mejoras Futuras

### Backend
- [ ] Implementar rate limiting para login
- [ ] Agregar logs de intentos de login
- [ ] Sistema de bloqueo tras múltiples intentos fallidos
- [ ] Soporte para autenticación de dos factores (2FA)

### Frontend
- [ ] Recordar usuario (no contraseña) en localStorage
- [ ] Indicador visual de fortaleza de contraseña
- [ ] Recuperación de contraseña
- [ ] Verificación de email
- [ ] Modo offline con cache de credenciales

---

## 📝 Notas Adicionales

### Seguridad
- ✅ Contraseñas nunca se almacenan en localStorage
- ✅ Tokens JWT con expiración
- ✅ Refresh token para renovación automática
- ✅ Validación de usuario activo
- ✅ HTTPS requerido en producción

### Compatibilidad
- ✅ Compatible con usuarios existentes (phone_number)
- ✅ Compatible con nuevos usuarios (email)
- ✅ No requiere migración de datos
- ✅ Retrocompatible con apps móviles que usen phone_number

### Configuración Requerida
```env
# Frontend (.env)
VITE_API_URL=http://localhost:8000/arye_system

# Backend (settings.py)
ENABLE_EMAIL_VERIFICATION=False  # Ajustar según necesidad
```

---

## 📞 Contacto y Soporte

Para reportar problemas o sugerencias relacionadas con la autenticación:
- Crear issue en el repositorio
- Documentar pasos para reproducir el error
- Incluir logs del navegador y backend

---

**Documento creado por:** GitHub Copilot  
**Última actualización:** 8 de octubre de 2025
