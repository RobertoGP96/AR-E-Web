# Guía de Integración de Carga de Imágenes

## Descripción General

Este sistema permite cargar imágenes desde el frontend a servicios externos (Cloudinary o Supabase) y solo guardar las URLs en el backend.

## Servicios Disponibles

### 1. Cloudinary (Recomendado para producción)

**Ventajas:**
- Transformaciones automáticas de imágenes
- CDN global incluido
- Optimización automática
- Soporte para múltiples formatos

**Configuración:**

1. Crear cuenta en [Cloudinary](https://cloudinary.com)
2. En el Dashboard, obtener:
   - Cloud Name
   - API Key
   - API Secret
3. Crear un Upload Preset:
   - Settings → Upload → Upload presets
   - Add upload preset
   - Mode: Unsigned
   - Folder: products (o el que prefieras)

4. Configurar variables de entorno en `.env`:
```env
VITE_CLOUDINARY_CLOUD_NAME=tu_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=tu_upload_preset
```

### 2. Supabase Storage (Económico)

**Ventajas:**
- Gratuito hasta 1GB
- Integración simple
- Sin necesidad de preset
- Perfecto para MVP

**Configuración:**

1. Crear proyecto en [Supabase](https://supabase.com)
2. Ir a Storage y crear un bucket llamado `images`
3. Configurar el bucket como público:
   - Policies → New Policy → For public access
   - Allow SELECT for all users
4. Obtener credenciales en Settings → API
5. Configurar variables de entorno en `.env`:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

## Instalación

### Frontend (React)

```bash
cd apps/client

# Para Cloudinary (ya incluido en el sistema)
# No requiere instalación adicional

# Para Supabase
pnpm add @supabase/supabase-js
```

### Backend (Django)

No requiere instalación adicional, solo guardarás URLs como strings.

## Uso en Componentes

### Ejemplo Básico

```tsx
import { ImageUpload } from '@/components/ui/image-upload';
import { useState } from 'react';

function ProductForm() {
  const [imageUrl, setImageUrl] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');

  const handleUploadSuccess = (url: string, publicId?: string) => {
    setImageUrl(url);
    setImagePublicId(publicId || '');
    // Aquí puedes actualizar tu formulario
  };

  const handleUploadError = (error: string) => {
    console.error('Error:', error);
    // Mostrar toast o mensaje de error
  };

  return (
    <form>
      <ImageUpload
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
        provider="cloudinary" // o "supabase"
        folder="products"
        currentImage={imageUrl}
      />
      
      {/* Otros campos del formulario */}
      <input type="hidden" value={imageUrl} name="image_url" />
    </form>
  );
}
```

### Ejemplo con React Hook Form

```tsx
import { useForm } from 'react-hook-form';
import { ImageUpload } from '@/components/ui/image-upload';

interface ProductFormData {
  name: string;
  price: number;
  image_url: string;
  image_public_id?: string;
}

function ProductFormWithRHF() {
  const { register, setValue, handleSubmit } = useForm<ProductFormData>();

  const onSubmit = (data: ProductFormData) => {
    // Enviar al backend
    console.log(data); // { name, price, image_url, image_public_id }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} placeholder="Nombre" />
      <input {...register('price')} type="number" placeholder="Precio" />
      
      <ImageUpload
        onUploadSuccess={(url, publicId) => {
          setValue('image_url', url);
          setValue('image_public_id', publicId);
        }}
        provider="cloudinary"
        folder="products"
      />

      <button type="submit">Guardar</button>
    </form>
  );
}
```

## Modificación del Backend

### 1. Actualizar Modelos

En `backend/api/models.py`, reemplaza los `ImageField` por `URLField`:

```python
class Product(models.Model):
    # Antes:
    # image = models.ImageField(upload_to='products/', blank=True, null=True)
    
    # Después:
    image_url = models.URLField(max_length=500, blank=True, null=True)
    image_public_id = models.CharField(max_length=255, blank=True, null=True)  # Para eliminación
```

### 2. Actualizar Serializers

```python
class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'image_url', 'image_public_id']
```

### 3. Crear Migraciones

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

## API de Funciones Disponibles

### `uploadImage(file, provider, folder)`
Sube una imagen al proveedor especificado.

**Parámetros:**
- `file`: File - Archivo de imagen
- `provider`: 'cloudinary' | 'supabase' - Proveedor a usar
- `folder`: string - Carpeta donde guardar

**Retorna:**
```typescript
{
  url: string;        // URL pública de la imagen
  publicId?: string;  // ID para eliminación
  error?: string;     // Mensaje de error si falla
}
```

### `deleteImage(publicId, provider)`
Elimina una imagen del proveedor.

**Parámetros:**
- `publicId`: string - ID de la imagen
- `provider`: 'cloudinary' | 'supabase'

**Retorna:** `boolean` - true si se eliminó correctamente

## Validaciones Incluidas

✅ Tipo de archivo (solo imágenes)
✅ Tamaño máximo (5MB)
✅ Preview antes de subir
✅ Drag & drop
✅ Estados de carga
✅ Manejo de errores

## Ejemplo de Flujo Completo

```tsx
import { useMutation } from '@tanstack/react-query';
import { ImageUpload } from '@/components/ui/image-upload';
import { useToast } from '@/hooks/use-toast';

function CreateProduct() {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState('');

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/products/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Producto creado exitosamente' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    createProductMutation.mutate({
      name: formData.get('name'),
      price: formData.get('price'),
      image_url: imageUrl, // URL de Cloudinary/Supabase
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" required />
      <input name="price" type="number" required />
      
      <ImageUpload
        onUploadSuccess={(url) => {
          setImageUrl(url);
          toast({ title: 'Imagen subida correctamente' });
        }}
        onUploadError={(error) => {
          toast({ title: 'Error', description: error, variant: 'destructive' });
        }}
        provider="cloudinary"
        folder="products"
      />

      <button type="submit">Crear Producto</button>
    </form>
  );
}
```

## Consideraciones de Seguridad

### Cloudinary
- ✅ Usa Upload Presets sin firma para el frontend
- ✅ Configurar restricciones en el preset (tamaño, formato)
- ⚠️ Para eliminación, implementar endpoint en backend

### Supabase
- ✅ Configurar RLS (Row Level Security) en el bucket
- ✅ Usar anon key solo para operaciones públicas
- ✅ Validar permisos en el backend

## Próximos Pasos

1. Copiar `.env.example` a `.env` y configurar credenciales
2. Instalar dependencias: `pnpm add @supabase/supabase-js` (si usas Supabase)
3. Actualizar modelos del backend
4. Crear migraciones
5. Integrar componente `ImageUpload` en tus formularios

## Troubleshooting

### Error: "Cloudinary no está configurado"
- Verifica que las variables de entorno estén correctamente en `.env`
- Asegúrate de que el upload preset sea unsigned

### Error: "Supabase no está configurado"
- Verifica URL y anon key en `.env`
- Confirma que el bucket sea público

### La imagen no se muestra
- Verifica que la URL sea accesible públicamente
- Revisa las políticas de CORS del bucket/cloudinary

## Recomendación

Para **producción**: Usa **Cloudinary** por sus transformaciones y CDN.
Para **desarrollo/MVP**: Usa **Supabase** por su simplicidad y costo.
