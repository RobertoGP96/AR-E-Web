# Mejoras de Validación y Toasts en UserForm

## ✅ Funcionalidades Implementadas

### 1. **Botón con Íconos Dinámicos**

El botón de acción ahora muestra un ícono que cambia según el estado y modo:

#### Estados del Botón:

| Estado | Ícono | Texto |
|--------|-------|-------|
| **Crear (Normal)** | 👤➕ `UserPlus` | "Crear usuario" |
| **Editar (Normal)** | 💾 `Save` | "Actualizar usuario" |
| **Guardando** | ⏳ `Loader2` (animado) | "Guardando..." |

#### Implementación:

```typescript
const getButtonIcon = () => {
  if (loading) return <Loader2 className="h-4 w-4 animate-spin" />;
  if (isEdit) return <Save className="h-4 w-4" />;
  return <UserPlus className="h-4 w-4" />;
};

const getButtonText = () => {
  if (loading) return 'Guardando...';
  if (isEdit) return 'Actualizar usuario';
  return 'Crear usuario';
};
```

#### Botón Actualizado:

```tsx
<Button type="submit" disabled={loading} className="gap-2">
  {getButtonIcon()}
  {getButtonText()}
</Button>
```

### 2. **Validaciones con Toasts (Sonner)**

Se han añadido validaciones manuales con mensajes toast antes de enviar el formulario:

#### Validaciones Implementadas:

1. **Nombre**
   - Mínimo 2 caracteres
   - No puede estar vacío
   ```typescript
   if (!data.name || data.name.trim().length < 2) {
     toast.error('Error de validación', {
       description: 'El nombre debe tener al menos 2 caracteres',
     });
     return;
   }
   ```

2. **Apellido**
   - Mínimo 2 caracteres
   - No puede estar vacío
   ```typescript
   if (!data.last_name || data.last_name.trim().length < 2) {
     toast.error('Error de validación', {
       description: 'El apellido debe tener al menos 2 caracteres',
     });
     return;
   }
   ```

3. **Teléfono**
   - Mínimo 7 caracteres
   - No puede estar vacío
   ```typescript
   if (!data.phone_number || data.phone_number.trim().length < 7) {
     toast.error('Error de validación', {
       description: 'El teléfono debe tener al menos 7 caracteres',
     });
     return;
   }
   ```

4. **Contraseña (Solo en Crear)**
   - Mínimo 6 caracteres
   - Requerida al crear usuario
   ```typescript
   if (isCreate && (!data.password || data.password.length < 6)) {
     toast.error('Error de validación', {
       description: 'La contraseña debe tener al menos 6 caracteres',
     });
     return;
   }
   ```

5. **Email (Si se proporciona)**
   - Formato de email válido
   - Validación con regex
   ```typescript
   if (data.email && data.email.trim() !== '') {
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     if (!emailRegex.test(data.email)) {
       toast.error('Error de validación', {
         description: 'El email no es válido',
       });
       return;
     }
   }
   ```

### 3. **Mensajes de Éxito**

#### Usuario Creado:
```typescript
toast.success('Usuario creado exitosamente', {
  description: `${data.name} ${data.last_name} ha sido registrado como ${roleLabels[data.role]}`,
});
```

**Ejemplo de mensaje:**
> ✅ **Usuario creado exitosamente**
> 
> Juan Pérez ha sido registrado como Agente

#### Usuario Actualizado:
```typescript
toast.success('Usuario actualizado', {
  description: `Los datos de ${data.name} ${data.last_name} han sido actualizados correctamente`,
});
```

**Ejemplo de mensaje:**
> ✅ **Usuario actualizado**
> 
> Los datos de María García han sido actualizados correctamente

### 4. **Mensajes de Error**

#### Errores de Validación:
```typescript
toast.error('Error de validación', {
  description: 'Mensaje específico del error',
});
```

**Ejemplos:**
> ❌ **Error de validación**
> 
> El nombre debe tener al menos 2 caracteres

> ❌ **Error de validación**
> 
> El email no es válido

#### Errores desde Props:
```typescript
React.useEffect(() => {
  if (error && error.trim() !== '') {
    toast.error('Error al guardar usuario', {
      description: error,
    });
  }
}, [error]);
```

**Ejemplo:**
> ❌ **Error al guardar usuario**
> 
> El email ya está registrado en el sistema

#### Errores Inesperados:
```typescript
catch (err) {
  toast.error('Error al guardar', {
    description: err instanceof Error ? err.message : 'Ha ocurrido un error inesperado',
  });
}
```

## 🎨 Apariencia Visual de los Toasts

Los toasts de Sonner tienen una apariencia moderna y profesional:

### Toast de Éxito:
```
┌────────────────────────────────────────┐
│ ✅ Usuario creado exitosamente         │
│ Juan Pérez ha sido registrado como     │
│ Agente                                 │
└────────────────────────────────────────┘
```

### Toast de Error:
```
┌────────────────────────────────────────┐
│ ❌ Error de validación                 │
│ El nombre debe tener al menos 2        │
│ caracteres                             │
└────────────────────────────────────────┘
```

### Toast de Carga (Opcional):
```
┌────────────────────────────────────────┐
│ ⏳ Guardando usuario...                │
└────────────────────────────────────────┘
```

## 🔄 Flujo de Validación

```
Usuario hace click en "Crear usuario"
              ↓
┌─────────────────────────────────────┐
│ Validar nombre (min 2 caracteres)  │
│         ❌ → Toast de error         │
└─────────────────────────────────────┘
              ↓ ✅
┌─────────────────────────────────────┐
│ Validar apellido (min 2 caracteres)│
│         ❌ → Toast de error         │
└─────────────────────────────────────┘
              ↓ ✅
┌─────────────────────────────────────┐
│ Validar teléfono (min 7 caracteres)│
│         ❌ → Toast de error         │
└─────────────────────────────────────┘
              ↓ ✅
┌─────────────────────────────────────┐
│ Validar contraseña (min 6 chars)   │
│         ❌ → Toast de error         │
└─────────────────────────────────────┘
              ↓ ✅
┌─────────────────────────────────────┐
│ Validar email (si se proporciona)  │
│         ❌ → Toast de error         │
└─────────────────────────────────────┘
              ↓ ✅
┌─────────────────────────────────────┐
│ Enviar datos (onSubmit)            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ ✅ Toast de éxito                   │
│ Cerrar diálogo                      │
│ Resetear formulario                 │
└─────────────────────────────────────┘
```

## 📦 Dependencias Utilizadas

- **sonner:** ^1.x.x - Librería de toasts moderna y elegante
- **lucide-react:** ^0.x.x - Íconos (UserPlus, Save, Loader2)
- **react-hook-form:** Para manejo del formulario
- **zod:** Para esquemas de validación

## 🎯 Ventajas de la Implementación

1. **Feedback Inmediato:** El usuario ve exactamente qué campo tiene error
2. **Mensajes Claros:** Descripción específica de cada error
3. **UI No Intrusiva:** Los toasts no bloquean la interfaz
4. **Indicadores Visuales:** Íconos que identifican rápidamente el tipo de mensaje
5. **Experiencia Moderna:** Animaciones suaves y diseño profesional
6. **Doble Validación:** Zod + validación manual = máxima seguridad
7. **Confirmación de Acciones:** El usuario sabe cuándo una operación fue exitosa

## 🔧 Configuración del Toaster

El componente `Toaster` debe estar presente en el App.tsx:

```tsx
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <div>
      {/* Tu aplicación */}
      <Toaster />
    </div>
  );
}
```

✅ **Ya está configurado en:** `apps/admin/src/App.tsx`

## 📝 Ejemplo de Uso Completo

```tsx
import { UserForm } from '@/components/users/UserForm';

// En tu componente padre
const [isCreating, setIsCreating] = useState(false);
const [error, setError] = useState('');

const handleCreateUser = async (data: CreateUserData) => {
  setIsCreating(true);
  setError('');
  
  try {
    await createUserMutation.mutateAsync(data);
    // El toast de éxito se muestra automáticamente desde UserForm
  } catch (err) {
    // El toast de error se muestra automáticamente desde UserForm
    setError(err.message);
  } finally {
    setIsCreating(false);
  }
};

<UserForm
  mode="create"
  onSubmit={handleCreateUser}
  loading={isCreating}
  error={error}
  trigger={
    <Button>
      <UserPlus className="h-4 w-4 mr-2" />
      Nuevo Usuario
    </Button>
  }
/>
```

## 🎬 Comportamiento Visual

### Al hacer click en "Crear usuario":

1. **Validación Fallida:**
   - Botón permanece habilitado
   - Aparece toast rojo con el error específico
   - El diálogo permanece abierto
   - El usuario puede corregir y reintentar

2. **Validación Exitosa:**
   - Botón se deshabilita
   - Ícono cambia a `Loader2` con animación
   - Texto cambia a "Guardando..."
   - Se envían los datos
   - Aparece toast verde de éxito
   - El diálogo se cierra automáticamente
   - El formulario se resetea

3. **Error del Servidor:**
   - Aparece toast rojo con el mensaje del servidor
   - El diálogo permanece abierto
   - El usuario puede corregir y reintentar

## 🌟 Características Adicionales

- **Auto-dismiss:** Los toasts se ocultan automáticamente después de unos segundos
- **Dismissible:** El usuario puede cerrar manualmente los toasts
- **Stack:** Múltiples toasts se apilan verticalmente
- **Responsive:** Se adaptan a diferentes tamaños de pantalla
- **Accesible:** Compatible con lectores de pantalla
- **Dark Mode:** Se adaptan automáticamente al tema oscuro

## 🚀 Próximas Mejoras Sugeridas

1. Toast de carga mientras se envía el formulario
2. Validación en tiempo real con debounce
3. Sugerencias automáticas para corrección
4. Confirmación antes de cerrar con cambios sin guardar
5. Historial de acciones con undo/redo
6. Validación de contraseña fuerte con indicador visual
