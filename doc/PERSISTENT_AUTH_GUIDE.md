# Persistencia de Estado de Autenticación

## Problema Resuelto

**Problema**: Al recargar la página, se perdían los datos del usuario autenticado, lo que causaba que la aplicación volviera al estado inicial y solicitara nuevamente el login.

## Solución Implementada

### 1. Utilidades de Almacenamiento (`/src/utils/storage.ts`)

Se crearon utilidades para manejar la persistencia de datos en localStorage de manera segura:

- `getStoredValue<T>()`: Recupera y parsea valores del localStorage con manejo de errores
- `setStoredValue()`: Almacena valores serializándolos a JSON
- `removeStoredValue()`: Remueve valores específicos
- `clearAuthStorage()`: Limpia todos los datos de autenticación
- `isStorageAvailable()`: Verifica si localStorage está disponible

### 2. Estado Inicial Inteligente

El estado inicial del contexto de autenticación ahora:

```typescript
const getInitialState = (): AuthState => {
  const storedUser = getStoredValue<CustomUser | null>(STORAGE_KEYS.USER, null);
  const storedPermissions = getStoredValue<string[]>(STORAGE_KEYS.PERMISSIONS, []);
  const storedLastActivity = getStoredValue<string | null>(STORAGE_KEYS.LAST_ACTIVITY, null);
  
  // Solo considerar autenticado si hay token Y usuario almacenado
  const hasToken = !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const isAuthenticated = hasToken && !!storedUser;
  
  return {
    user: storedUser,
    isAuthenticated,
    isLoading: hasToken, // Solo mostrar loading si hay token para verificar
    error: null,
    permissions: storedPermissions,
    lastActivity: storedLastActivity ? new Date(storedLastActivity) : null,
  };
};
```

### 3. Persistencia Automática en el Reducer

El reducer ahora persiste automáticamente los cambios de estado:

- **AUTH_SUCCESS**: Persiste usuario, permisos y última actividad
- **UPDATE_USER**: Persiste cambios en el perfil del usuario
- **UPDATE_ACTIVITY**: Persiste la marca de tiempo de actividad
- **AUTH_ERROR/AUTH_LOGOUT**: Limpia todos los datos persistidos

### 4. Verificación de Autenticación Optimizada

La función `checkExistingAuth` fue mejorada para:

- No hacer llamadas innecesarias al servidor si ya tenemos datos válidos
- Solo verificar con el servidor cuando hay token pero no datos de usuario
- Manejar casos donde el token existe pero los datos persisitidos están corruptos

## Claves de Almacenamiento

```typescript
export const STORAGE_KEYS = {
  USER: 'auth_user',                    // Datos del usuario
  PERMISSIONS: 'auth_permissions',       // Permisos del usuario
  LAST_ACTIVITY: 'auth_last_activity',   // Última actividad
  ACCESS_TOKEN: 'access_token',          // Token de acceso
  REFRESH_TOKEN: 'refresh_token',        // Token de renovación
} as const;
```

## Beneficios

### ✅ **Experiencia de Usuario Mejorada**
- No se pierde la sesión al recargar la página
- Carga inmediata del estado de autenticación
- Reducción de llamadas innecesarias al servidor

### ✅ **Rendimiento Optimizado**
- Estado inicial basado en datos persistidos
- Verificación condicional de autenticación
- Menor tiempo de carga inicial

### ✅ **Robustez**
- Manejo seguro de errores de localStorage
- Fallbacks apropiados cuando localStorage no está disponible
- Limpieza automática de datos inválidos

### ✅ **Seguridad**
- Los datos sensibles siguen manejándose por tokens
- Limpieza automática en caso de errores de autenticación
- Validación de consistencia entre token y datos persisitidos

## Consideraciones de Seguridad

1. **Datos Sensibles**: Solo se persisten datos del perfil del usuario, no contraseñas ni tokens de forma adicional
2. **Validación**: Se verifica la consistencia entre token y datos persistidos
3. **Limpieza**: Auto-limpieza en casos de error o logout
4. **Encriptación**: Para datos más sensibles, considera usar bibliotecas de encriptación

## Uso en Otros Componentes

Los componentes pueden usar el contexto normalmente. El estado persistido se carga automáticamente:

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // El estado se restaura automáticamente al recargar
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <LoginForm />;
  
  return <UserDashboard user={user} />;
}
```

## Testing

Para testing, puedes mockar localStorage:

```typescript
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;
```

## Limitaciones

1. **Tamaño**: localStorage tiene límite de ~5-10MB según el navegador
2. **Sincronización**: Los datos persisitidos no se sincronizan entre pestañas automáticamente
3. **Privacidad**: Los datos pueden ser visibles en las herramientas de desarrollador

## Futuras Mejoras

1. **Encriptación**: Encriptar datos sensibles antes de persistir
2. **Sincronización entre Tabs**: Usar BroadcastChannel para sincronizar entre pestañas
3. **Limpieza Programada**: Implementar limpieza automática de datos antiguos
4. **Compresión**: Comprimir datos grandes antes de almacenar