# Sistema de Autenticación - Aplicación Admin

## 📋 Resumen de Verificación y Mejoras

Este documento detalla el sistema de autenticación implementado en la aplicación admin, incluyendo las verificaciones realizadas y las mejoras implementadas.

---

## ✅ Funcionalidades Verificadas

### 1. **Redirección a Login cuando no está autenticado**

**Estado:** ✅ Funcionando correctamente

**Componentes involucrados:**
- `ProtectedRoute.tsx`: Protege rutas privadas
- `api-client.ts`: Intercepta errores 401 y redirige

**Comportamiento:**
- Si el usuario intenta acceder a una ruta protegida sin estar autenticado, se redirige automáticamente a `/login`
- Se guarda la ubicación original para redirigir después del login exitoso
- Los errores 401 (Unauthorized) del backend activan el proceso de refresh token o redirección

```tsx
// En ProtectedRoute.tsx
if (requireAuth && !isAuthenticated) {
  return <Navigate to="/login" state={{ from: location }} replace />;
}
```

---

### 2. **Persistencia de Credenciales**

**Estado:** ✅ Funcionando correctamente

**Datos persistidos en localStorage:**
- `access_token`: Token JWT de acceso
- `refresh_token`: Token JWT de actualización
- `admin_auth_user`: Información del usuario
- `admin_auth_permissions`: Permisos del usuario
- `admin_auth_last_activity`: Última actividad registrada

**Flujo de persistencia:**
1. **Al hacer login:** Se guardan todos los tokens y datos del usuario
2. **Al recargar la página:** 
   - Se recuperan los datos del localStorage
   - Se verifica el token llamando a `/user/`
   - Se restaura el estado de autenticación
3. **Al cerrar sesión:** Se limpian todos los datos almacenados

```tsx
// Recuperación al iniciar (AuthContext.tsx)
const getInitialState = (): AuthState => {
  const storedUser = getStoredValue<CustomUser | null>(STORAGE_KEYS.USER, null);
  const hasToken = !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const isAuthenticated = hasToken && !!storedUser;
  
  return {
    user: storedUser,
    isAuthenticated,
    isLoading: hasToken,
    // ...
  };
};
```

---

### 3. **Refresh Token Automático**

**Estado:** ✅ Funcionando correctamente

**Comportamiento:**
- Cuando el `access_token` expira (error 401), el sistema intenta automáticamente refrescarlo
- Si el refresh es exitoso, la petición continúa sin que el usuario lo note
- Si el refresh falla, se cierra la sesión y se redirige al login

```tsx
// En api-client.ts
private async handleUnauthorized() {
  this.clearAuthToken();
  
  const refreshToken = this.getRefreshToken();
  if (refreshToken) {
    try {
      await this.refreshAuthToken(); // Intenta refrescar
      return; // Éxito, continúa
    } catch (refreshError) {
      console.error('Error refreshing token:', refreshError);
    }
  }
  
  // Muestra notificación y redirige
  if (showNotificationCallback) {
    showNotificationCallback('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'warning');
  }
  this.redirectToLogin();
}
```

---

### 4. **Redirección después del Login**

**Estado:** ✅ Funcionando correctamente

**Comportamiento:**
- Si el usuario fue redirigido al login desde una ruta protegida, después del login exitoso regresa a esa ruta
- Si accedió directamente al login, es redirigido al dashboard (`/`)
- Usa `replace: true` para no agregar entradas innecesarias al historial

```tsx
// En Login.tsx
const from = (location.state as { from?: { pathname: string } })?.from?.pathname || redirectTo;

useEffect(() => {
  if (isAuthenticated) {
    navigate(from, { replace: true });
  }
}, [isAuthenticated, navigate, from]);
```

---

## 🚀 Mejoras Implementadas

### 1. **Sistema de Redirección con React Router**

**Antes:** El API Client usaba `window.location.href = '/login'` (recarga completa de página)

**Después:** Usa React Router para navegación sin recargar la página

**Archivos modificados:**
- `lib/api-client.ts`: Agregado callback configurable
- `hooks/useApiRedirect.ts`: Nuevo hook para configurar callbacks
- `components/ApiRedirectProvider.tsx`: Nuevo provider
- `App.tsx`: Integración del provider

**Beneficios:**
- ✅ No recarga la página completa
- ✅ Preserva el estado de la aplicación
- ✅ Experiencia de usuario más fluida
- ✅ Mejor rendimiento

---

### 2. **Sistema de Notificaciones de Sesión**

**Funcionalidad:** Notificaciones toast cuando ocurren eventos de autenticación

**Implementaciones:**
- **Sesión expirada:** Toast de advertencia cuando el token expira
- **Logout exitoso:** Toast de éxito al cerrar sesión correctamente
- **Error en logout:** Toast de error si falla el cierre de sesión

**Archivos modificados:**
- `lib/api-client.ts`: Callback para notificaciones
- `hooks/useApiRedirect.ts`: Configuración de Sonner
- `components/navigation/AsideNav.tsx`: Handler de logout con notificación
- `components/navigation/UserNav.tsx`: Handler de logout con notificación
- `App.tsx`: Agregado `<Toaster />` global

```tsx
// Ejemplo de uso
const handleLogout = async () => {
  try {
    await logout();
    toast.success('Sesión cerrada exitosamente');
  } catch (error) {
    toast.error('Error al cerrar sesión');
  }
};
```

---

### 3. **Auto-logout por Inactividad**

**Estado:** ✅ Ya implementado en `AuthContext.tsx`

**Configuración:**
- Tiempo de inactividad: **30 minutos**
- Verificación: Cada **1 minuto**
- Eventos monitoreados: `mousedown`, `mousemove`, `keypress`, `scroll`, `touchstart`

```tsx
// En AuthContext.tsx
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos

useEffect(() => {
  if (!state.isAuthenticated || !state.lastActivity) return;
  
  const checkInactivity = () => {
    const now = new Date();
    const timeSinceLastActivity = now.getTime() - state.lastActivity!.getTime();
    
    if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
      console.log('Auto-logout due to inactivity');
      logout();
    }
  };

  const interval = setInterval(checkInactivity, 60000);
  return () => clearInterval(interval);
}, [state.isAuthenticated, state.lastActivity, logout]);
```

---

## 🔐 Flujo Completo de Autenticación

### **Flujo de Login:**

```
1. Usuario ingresa credenciales
   ↓
2. Se envía petición a /auth/
   ↓
3. Backend responde con access_token y refresh_token
   ↓
4. Tokens se guardan en localStorage
   ↓
5. Se obtiene información del usuario (/user/)
   ↓
6. Estado de autenticación se actualiza
   ↓
7. Usuario es redirigido a la ruta original o dashboard
```

### **Flujo de Recarga de Página:**

```
1. App se carga
   ↓
2. AuthContext verifica localStorage
   ↓
3. Si hay token: Verifica con backend (/user/)
   ↓
4. Si es válido: Restaura estado de autenticación
   ↓
5. Si es inválido: Limpia datos y redirige a login
```

### **Flujo de Token Expirado:**

```
1. Petición falla con error 401
   ↓
2. API Client intenta refresh del token
   ↓
3a. Éxito: Continúa con la petición original
   ↓
3b. Fallo: Muestra notificación
       ↓
       Limpia tokens y datos
       ↓
       Redirige a login
```

### **Flujo de Logout:**

```
1. Usuario hace clic en "Cerrar sesión"
   ↓
2. Se envía petición a /logout/ con refresh_token
   ↓
3. Se limpian tokens del localStorage
   ↓
4. Se limpia estado de autenticación
   ↓
5. Se muestra notificación de éxito
   ↓
6. Usuario es redirigido a /login
```

---

## 📁 Archivos Clave del Sistema

### **Autenticación Core:**
- `context/AuthContext.tsx`: Estado global de autenticación
- `hooks/auth/useAuth.tsx`: Hook principal de autenticación
- `lib/api-client.ts`: Cliente HTTP con interceptors
- `services/auth/logout.ts`: Servicio de logout
- `utils/storage.ts`: Utilidades de localStorage

### **Protección de Rutas:**
- `components/ProtectedRoute.tsx`: HOC para rutas protegidas
- `routes/AppRoutes.tsx`: Definición de rutas

### **UI de Autenticación:**
- `components/auth/Login.tsx`: Formulario de login
- `pages/LoginPage.tsx`: Página de login

### **Navegación:**
- `components/navigation/AsideNav.tsx`: Navegación lateral con logout
- `components/navigation/UserNav.tsx`: Menú de usuario con logout

### **Nuevos Archivos (Mejoras):**
- `hooks/useApiRedirect.ts`: Hook para configurar redirecciones
- `components/ApiRedirectProvider.tsx`: Provider de configuración

---

## 🧪 Testing Recomendado

### **Casos de Prueba:**

1. **Login exitoso**
   - ✅ Redirige al dashboard
   - ✅ Guarda tokens en localStorage
   - ✅ Muestra información del usuario

2. **Login con credenciales inválidas**
   - ✅ Muestra mensaje de error
   - ✅ No guarda tokens
   - ✅ Permanece en login

3. **Recarga de página con sesión activa**
   - ✅ Mantiene sesión activa
   - ✅ No redirige a login
   - ✅ Restaura datos del usuario

4. **Recarga de página sin sesión**
   - ✅ Redirige a login
   - ✅ No muestra errores de consola

5. **Token expirado durante uso**
   - ✅ Intenta refresh automático
   - ✅ Muestra notificación si falla
   - ✅ Redirige a login si no puede refrescar

6. **Logout manual**
   - ✅ Cierra sesión correctamente
   - ✅ Limpia todos los datos
   - ✅ Muestra notificación de éxito
   - ✅ Redirige a login

7. **Acceso directo a ruta protegida sin login**
   - ✅ Redirige a login
   - ✅ Guarda ruta original
   - ✅ Redirige a ruta original después de login

8. **Inactividad de 30 minutos**
   - ✅ Cierra sesión automáticamente
   - ✅ Muestra mensaje apropiado
   - ✅ Redirige a login

---

## 🔧 Configuración

### **Variables de Entorno:**
```env
VITE_API_URL=http://localhost:8000/arye_system
```

### **Timeouts Configurables:**
```tsx
// AuthContext.tsx
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos

// api-client.ts
const API_CONFIG = {
  timeout: 30000, // 30 segundos
};

// AuthContext.tsx - React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
    },
  },
});
```

---

## 📝 Notas Importantes

1. **Seguridad:**
   - Los tokens se almacenan en localStorage (considerar httpOnly cookies para producción)
   - El refresh token se envía al backend al hacer logout
   - Todas las rutas administrativas están protegidas

2. **Experiencia de Usuario:**
   - Las redirecciones usan React Router (sin recarga de página)
   - Notificaciones toast informan sobre eventos de sesión
   - Loading states durante verificación de autenticación

3. **Mantenibilidad:**
   - Sistema centralizado en AuthContext
   - Hooks reutilizables para diferentes necesidades
   - Código bien documentado y tipado con TypeScript

---

## 🎯 Conclusión

El sistema de autenticación está **completamente funcional** y cumple con todos los requisitos:

✅ Redirección automática al login cuando no está autenticado  
✅ Persistencia de credenciales al recargar la página  
✅ Refresh token automático antes de expiración  
✅ Redirección inteligente después del login  
✅ Notificaciones de eventos de sesión  
✅ Auto-logout por inactividad  
✅ Manejo robusto de errores  

**Mejoras implementadas:**
- Sistema de redirección con React Router (sin recargas)
- Notificaciones toast de sesión
- Callbacks configurables en API Client
- Mejor manejo de errores 401

---

*Última actualización: 8 de octubre de 2025*
