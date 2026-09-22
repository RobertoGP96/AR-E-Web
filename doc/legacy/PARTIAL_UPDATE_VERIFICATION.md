# Verificación de Actualizaciones Parciales de Usuarios

## Estado Actual del Sistema

✅ **El serializer `UserSerializer` ya soporta actualizaciones parciales correctamente:**

### 1. Método `update()` Implementado

```python
def update(self, instance, validated_data):
    """
    Actualización de usuario con soporte para actualizaciones parciales.
    Solo actualiza los campos que se envían en la petición.
    """
    # Extraer la contraseña si está presente
    password = validated_data.pop('password', None)
    
    # Actualizar todos los demás campos
    for attr, value in validated_data.items():
        setattr(instance, attr, value)
    
    # Si se proporcionó una contraseña, encriptarla
    if password:
        instance.set_password(password)
    
    instance.save()
    return instance
```

### 2. Validaciones que Soportan Actualizaciones Parciales

- **Email**: Puede ser vacío o `None` en actualizaciones
- **Password**: Es opcional en actualizaciones (requerido solo en creación)
- **Phone Number**: Valida unicidad excluyendo el usuario actual
- **Agent Profit**: Solo se valida si está presente en los datos

### 3. Uso del Frontend

El componente `UserForm` ya está configurado para hacer actualizaciones parciales:

```typescript
// En update-user.ts
export const updateUser = async (id: number, userData: Partial<UpdateUserData>): Promise<CustomUser> => {
  return await apiClient.patch<CustomUser>(`/api_data/user/${id}/`, userData);
};
```

El método `PATCH` permite enviar solo los campos que necesitas actualizar.

## Ejemplos de Uso

### Ejemplo 1: Actualizar solo el nombre

```bash
curl -X PATCH http://localhost:8000/api_data/user/1/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "NuevoNombre"}'
```

**Resultado**: Solo el campo `name` será actualizado, todos los demás campos permanecen sin cambios.

### Ejemplo 2: Actualizar teléfono y dirección

```bash
curl -X PATCH http://localhost:8000/api_data/user/1/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "phone_number": "123456789",
    "home_address": "Nueva Dirección 123"
  }'
```

**Resultado**: Solo `phone_number` y `home_address` serán actualizados.

### Ejemplo 3: Cambiar rol a agente y asignar ganancia

```bash
curl -X PATCH http://localhost:8000/api_data/user/1/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "role": "agent",
    "agent_profit": 15.5
  }'
```

**Resultado**: Solo `role` y `agent_profit` serán actualizados.

### Ejemplo 4: Actualizar contraseña sin cambiar otros campos

```bash
curl -X PATCH http://localhost:8000/api_data/user/1/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"password": "nuevapassword123"}'
```

**Resultado**: Solo la contraseña será actualizada y encriptada correctamente.

### Ejemplo 5: Activar/Desactivar usuario

```bash
curl -X PATCH http://localhost:8000/api_data/user/1/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"is_active": false}'
```

**Resultado**: Solo el estado `is_active` será actualizado.

### Ejemplo 6: Verificar usuario

```bash
curl -X PATCH http://localhost:8000/api_data/user/1/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"is_verified": true}'
```

**Resultado**: Solo el estado `is_verified` será actualizado.

## Servicios Especializados en el Frontend

El archivo `update-user.ts` proporciona funciones específicas para actualizaciones parciales:

```typescript
// Actualizar información básica
export const updateUserBasicInfo = async (id: number, basicInfo: {
  name?: string;
  last_name?: string;
  phone_number?: string;
  home_address?: string;
})

// Actualizar solo el rol
export const updateUserRole = async (id: number, role: string)

// Actualizar estado activo
export const updateUserActiveStatus = async (id: number, is_active: boolean)

// Actualizar estado de verificación
export const updateUserVerificationStatus = async (id: number, is_verified: boolean)

// Actualizar ganancia del agente
export const updateAgentProfit = async (id: number, agent_profit: number)
```

## Ventajas de las Actualizaciones Parciales

1. **Eficiencia**: Solo se envían los campos que cambian
2. **Seguridad**: Menor riesgo de sobrescribir campos accidentalmente
3. **Flexibilidad**: Permite actualizaciones granulares desde diferentes partes de la UI
4. **Performance**: Menos datos transferidos en la red
5. **Simplicidad**: No necesitas enviar todo el objeto para cambiar un campo

## Validaciones que se Mantienen

- ✅ Email único (si se proporciona)
- ✅ Teléfono único
- ✅ Contraseña encriptada (si se proporciona)
- ✅ Agent profit >= 0 (si se proporciona)
- ✅ Formato de teléfono válido

## Casos de Uso en la Aplicación Admin

1. **Cambiar rol de usuario**: Solo enviar `{role: "agent"}`
2. **Activar/Desactivar**: Solo enviar `{is_active: true/false}`
3. **Verificar email**: Solo enviar `{is_verified: true}`
4. **Actualizar perfil**: Enviar solo los campos editados
5. **Cambiar contraseña**: Solo enviar `{password: "nueva"}`
6. **Asignar ganancia a agente**: Solo enviar `{agent_profit: 10}`

## Conclusión

✅ **El sistema ya está completamente configurado para actualizaciones parciales**

No necesitas enviar todos los campos del usuario cuando solo quieres cambiar uno. El serializer `UserSerializer` con su método `update()` personalizado maneja correctamente las actualizaciones parciales, validando solo los campos que se envían y preservando el resto de los datos sin modificaciones.

El frontend está configurado para aprovechar esta funcionalidad usando el método `PATCH` de HTTP y el servicio `apiClient.patch()`.
