# Hooks de la aplicación

## useLocalStorage

Hook personalizado para sincronizar estado de React con localStorage del navegador.

### Características

- **Sincronización automática**: Los cambios se guardan automáticamente en localStorage
- **Sincronización entre pestañas**: Los cambios se sincronizan entre pestañas del mismo dominio
- **Manejo de errores**: Funciona aunque localStorage no esté disponible
- **TypeScript**: Completamente tipado
- **SSR compatible**: Funciona con renderizado del lado del servidor

### Uso básico

```tsx
import { useLocalStorage } from '@/hooks/use-local-storage'

function MyComponent() {
  const [value, setValue, removeValue] = useLocalStorage('my-key', 'default-value')
  
  return (
    <div>
      <p>Valor actual: {value}</p>
      <button onClick={() => setValue('nuevo valor')}>
        Cambiar valor
      </button>
      <button onClick={removeValue}>
        Eliminar valor
      </button>
    </div>
  )
}
```

### useProductStorage

Hook específico para manejar productos en localStorage.

```tsx
import { useProductStorage } from '@/hooks/use-local-storage'

function ProductList() {
  const [products, setProducts] = useProductStorage()
  
  const addProduct = (newProduct) => {
    setProducts(prev => [...prev, { ...newProduct, id: Date.now().toString() }])
  }
  
  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  )
}
```

### Funcionalidades implementadas

- **Persistencia automática**: Los productos se guardan automáticamente en localStorage
- **Carga inicial**: Los productos se cargan al inicializar el componente
- **Sincronización entre pestañas**: Los cambios se reflejan en todas las pestañas abiertas
- **Manejo de errores**: Si localStorage no está disponible, la aplicación funciona normalmente pero sin persistencia
- **Advertencias visuales**: Se muestra un aviso si localStorage no está disponible

### Estructura de datos

Los productos se almacenan en localStorage con la clave `user-products` como un array de objetos con la siguiente estructura:

```typescript
type ProductWithId = CreateProduc & { id: string }

interface CreateProduc {
  name: string
  link: string
  shop: string
  description: string
  tags?: string[]
}
```

### Eventos personalizados

El hook utiliza eventos personalizados para sincronizar cambios entre pestañas:

- `localStorage-change`: Se dispara cuando se modifica un valor en localStorage
- `storage`: Evento nativo del navegador para cambios en localStorage desde otras pestañas