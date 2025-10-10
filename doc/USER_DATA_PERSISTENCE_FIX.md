# Corrección de Persistencia de Datos del Usuario

## Problema Identificado

Los datos del usuario que se muestran en el aside (sidebar) se perdían al recargar la página. Esto ocurría porque:

1. El `AuthContext` intentaba verificar la autenticación llamando a `getCurrentUser()` en cada recarga
2. Si esta llamada fallaba (por cualquier razón como latencia de red, token expirado temporalmente, etc.), se limpiaban todos los datos del usuario
3. El código trataba incorrectamente la respuesta de `apiClient.getCurrentUser()` como si devolviera un objeto con `data`, cuando en realidad devuelve directamente el objeto `CustomUser`

## Solución Implementada

### 1. Corrección de Tipos de Respuesta

Se corrigieron los siguientes métodos en `AuthContext.tsx` para manejar correctamente las respuestas de `apiClient`:

- **`checkExistingAuth()`**: Ahora maneja correctamente que `getCurrentUser()` devuelve directamente `CustomUser`, no `{ data: CustomUser }`
- **`refreshAuth()`**: Corregido el manejo de la respuesta
- **`updateUser()`**: Corregido el manejo de la respuesta
- **`register()`**: Añadido cast apropiado para la respuesta

### 2. Mejora del Estado Inicial

Se modificó `getInitialState()` para que solo muestre el estado de carga (`isLoading`) cuando hay tanto un token como datos de usuario guardados:

```typescript
isLoading: hasToken && !!storedUser, // Antes: isLoading: hasToken
```

### 3. Estrategia de Recuperación Resiliente

Se implementó una estrategia de tres niveles en `checkExistingAuth()`:

#### Nivel 1: Sin Token
- Si no hay token pero hay datos de usuario guardados, se limpia todo el almacenamiento
- Se marca como error y no se intenta nada más

#### Nivel 2: Token Sin Usuario Guardado
- Si hay token pero no hay usuario guardado, se muestra loading y se hace la petición al servidor
- Si falla, se limpia el token y se marca como error

#### Nivel 3: Token Y Usuario Guardado (Caso Óptimo)
- Se usa inmediatamente el usuario guardado en localStorage
- La UI se carga instantáneamente sin esperar al servidor
- En segundo plano, se verifica el token con el servidor
- Si la verificación en segundo plano falla, solo se loggea el error pero NO se hace logout
- Los errores 401 son manejados por el interceptor de axios que puede intentar refresh del token

## Beneficios

1. **Carga Instantánea**: Los usuarios ven sus datos inmediatamente al recargar, sin esperar la verificación del servidor
2. **Resiliente a Fallos de Red**: Los datos persisten incluso si hay problemas temporales de conectividad
3. **Mejor Experiencia de Usuario**: No se pierden los datos por problemas transitorios
4. **Verificación en Segundo Plano**: El sistema sigue verificando la autenticación sin bloquear la UI

## Archivos Modificados

- `apps/admin/src/context/AuthContext.tsx`
  - Función `getInitialState()`
  - Función `checkExistingAuth()`
  - Función `refreshAuth()`
  - Función `updateUser()`
  - Función `register()`

## Pruebas Recomendadas

Para verificar que la solución funciona correctamente:

1. **Prueba de Recarga Normal**:
   - Iniciar sesión
   - Verificar que los datos del usuario aparecen en el aside
   - Recargar la página (F5)
   - Verificar que los datos siguen apareciendo sin parpadeo

2. **Prueba Sin Conexión**:
   - Iniciar sesión
   - Abrir DevTools y simular modo offline
   - Recargar la página
   - Verificar que los datos del usuario siguen apareciendo
   - Restaurar conexión
   - Verificar que se actualizan los datos en segundo plano

3. **Prueba de Token Expirado**:
   - Iniciar sesión
   - Esperar a que el token expire (o manipular localStorage)
   - Recargar la página
   - Verificar que el sistema intenta refresh del token
   - Verificar que se redirige a login solo si el refresh falla

## Notas Técnicas

- El sistema utiliza `localStorage` con las claves definidas en `STORAGE_KEYS`
- La verificación en segundo plano no interrumpe la experiencia del usuario
- Los interceptors de axios manejan automáticamente los errores 401 e intentan refresh del token
- El auto-logout por inactividad sigue funcionando normalmente (30 minutos)

## Próximos Pasos Opcionales

1. Implementar sistema de permisos real (actualmente está como array vacío)
2. Añadir telemetría para monitorear fallos de verificación en segundo plano
3. Implementar retry con backoff exponencial para las verificaciones fallidas
4. Añadir indicador visual sutil cuando se está verificando en segundo plano
