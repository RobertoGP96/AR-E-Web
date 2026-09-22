# Actualizaciones Finales del UserForm

## ✅ Cambios Implementados

### 1. **Campos Opcionales**

#### Email - Ahora Opcional
```typescript
// Antes: Email requerido
email: z.string().email('Email inválido')

// Ahora: Email opcional
email: z.string().email('Email inválido').optional().or(z.literal(''))
```

**En la UI:**
- Label cambió de "Email *" a "Email"
- Placeholder: "usuario@ejemplo.com (opcional)"

#### Dirección - Ahora Opcional
```typescript
// Antes: Dirección requerida con mínimo 2 caracteres
home_address: z.string().min(2, 'Dirección requerida')

// Ahora: Dirección opcional
home_address: z.string().optional()
```

**En la UI:**
- Label cambió de "Dirección *" a "Dirección"
- Placeholder: "Calle Principal #123, Ciudad, País (opcional)"

### 2. **Ganancia de Agente Condicional**

#### Solo visible cuando el rol es "agent"

**Implementación:**
```typescript
// Watch para observar cambios en el campo 'role'
const selectedRole = watch('role');

// En el formulario (modo crear/editar):
{selectedRole === 'agent' && (
  <div className="space-y-2">
    <Label htmlFor="agent_profit">
      Ganancia de agente (%)
    </Label>
    <Input 
      id="agent_profit"
      type="number" 
      {...register('agent_profit', { valueAsNumber: true })}
      min={0}
      max={100}
      step={0.01}
    />
  </div>
)}

// En la vista de detalles:
{user.role === 'agent' && (
  <div className="flex items-start gap-3">
    <Percent className="h-5 w-5 text-amber-600" />
    <Label>Ganancia de agente</Label>
    <p>{user.agent_profit}%</p>
  </div>
)}
```

**Comportamiento:**
- ✅ El campo de ganancia de agente **solo aparece** cuando se selecciona el rol "Agente"
- ✅ Se oculta automáticamente cuando se selecciona otro rol
- ✅ En modo vista, solo se muestra si el usuario tiene rol "agent"
- ✅ El campo es opcional (puede ser `undefined` o `0`)

### 3. **Manejo de Valores Opcionales en Submit**

```typescript
const submitHandler = (data: UserFormSchema) => {
  if (isEdit && user) {
    const updateData: UpdateUserData = {
      id: user.id,
      email: data.email || '',              // Valor por defecto ''
      home_address: data.home_address || '', // Valor por defecto ''
      agent_profit: data.agent_profit || 0,  // Valor por defecto 0
      // ... otros campos
    };
    onSubmit(updateData);
  } else if (isCreate) {
    const createUserData: CreateUserData = {
      email: data.email || '',              // Valor por defecto ''
      home_address: data.home_address || '', // Valor por defecto ''
      agent_profit: data.agent_profit || 0,  // Valor por defecto 0
      // ... otros campos
    };
    onSubmit(createUserData);
  }
};
```

## 📋 Resumen de Campos

| Campo | Estado | Validación | Notas |
|-------|--------|------------|-------|
| Email | 🟡 Opcional | Email válido si se proporciona | Puede estar vacío |
| Nombre | 🔴 Requerido | Mínimo 2 caracteres | - |
| Apellido | 🔴 Requerido | Mínimo 2 caracteres | - |
| Teléfono | 🔴 Requerido | Mínimo 7 caracteres | - |
| Dirección | 🟡 Opcional | Sin validación | Puede estar vacía |
| Contraseña | 🔴 Requerido (crear)<br>🟡 Opcional (editar) | Mínimo 6 caracteres | En edición, vacío = no cambiar |
| Rol | 🔴 Requerido | Debe ser un rol válido | - |
| Ganancia Agente | 🟡 Condicional | 0-100% | Solo visible si rol = "agent" |

## 🎯 Ejemplo de Uso

### Crear Usuario sin Email ni Dirección
```tsx
<UserForm
  mode="create"
  onSubmit={(data) => {
    // data puede tener:
    // email: ''
    // home_address: ''
    // agent_profit: 0 (o undefined si no es agente)
  }}
/>
```

### Usuario Agente
```tsx
// Al seleccionar rol "agent" en el formulario:
<Select value="agent">
  {/* El campo de ganancia de agente aparece automáticamente */}
</Select>

// En modo vista, si user.role === 'agent':
// Se muestra la ganancia de agente
```

### Usuario No-Agente
```tsx
// Al seleccionar cualquier otro rol:
<Select value="user">
  {/* El campo de ganancia de agente se oculta */}
</Select>

// En modo vista, si user.role !== 'agent':
// No se muestra la ganancia de agente
```

## 🔍 Validaciones Actualizadas

### Schema de Creación
```typescript
const createUserSchema = z.object({
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  name: z.string().min(2, 'Nombre requerido'),
  last_name: z.string().min(2, 'Apellido requerido'),
  home_address: z.string().optional(),
  phone_number: z.string().min(7, 'Teléfono requerido'),
  password: z.string().min(6, 'Contraseña requerida (mínimo 6 caracteres)'),
  role: z.string(),
  agent_profit: z.number().min(0).optional(),
});
```

### Schema de Edición
```typescript
const editUserSchema = z.object({
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  name: z.string().min(2, 'Nombre requerido'),
  last_name: z.string().min(2, 'Apellido requerido'),
  home_address: z.string().optional(),
  phone_number: z.string().min(7, 'Teléfono requerido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres').optional().or(z.literal('')),
  role: z.string(),
  agent_profit: z.number().min(0).optional(),
});
```

## 📱 Interfaz de Usuario

### Indicadores Visuales
- **Campos requeridos:** Marcados con asterisco (*) rojo
- **Campos opcionales:** Sin asterisco, con "(opcional)" en el placeholder
- **Campos condicionales:** Aparecen/desaparecen dinámicamente según el rol

### Ejemplo Visual del Formulario

```
┌─────────────────────────────────────────────┐
│ 📧 Información de contacto                  │
├─────────────────────────────────────────────┤
│ Email                                       │
│ [usuario@ejemplo.com (opcional)         ]  │
│                                             │
│ Nombre *              Apellido *            │
│ [Juan              ] [Pérez              ]  │
│                                             │
│ Teléfono *                                  │
│ [+1234567890                            ]  │
│                                             │
│ Dirección                                   │
│ [Calle Principal (opcional)             ]  │
├─────────────────────────────────────────────┤
│ 🔒 Seguridad                                │
├─────────────────────────────────────────────┤
│ Contraseña *                                │
│ [••••••••                               ]  │
├─────────────────────────────────────────────┤
│ 🛡️ Rol y permisos                          │
├─────────────────────────────────────────────┤
│ Rol *                                       │
│ [Agente ▼                               ]  │
│                                             │
│ Ganancia de agente (%)  ← Solo si es agente│
│ [15.5                                   ]  │
└─────────────────────────────────────────────┘
```

## ✨ Beneficios

1. **Flexibilidad:** Los usuarios no están obligados a proporcionar email o dirección
2. **UI Limpia:** Solo se muestran campos relevantes según el rol seleccionado
3. **Mejor UX:** Indicadores claros de qué campos son opcionales
4. **Validación Inteligente:** Email se valida solo si se proporciona
5. **Responsividad:** El formulario se adapta dinámicamente a la selección del usuario

## 🎨 Roles Disponibles

Según el `roleLabels`, los roles disponibles son:
- **user:** Usuario
- **agent:** Agente (muestra campo de ganancia)
- **admin:** Administrador
- **superadmin:** Super Administrador

Solo el rol **"agent"** muestra el campo de ganancia de agente.
