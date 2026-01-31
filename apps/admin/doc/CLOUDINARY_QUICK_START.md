# Guía Rápida de Integración - Cloudinary Image Upload

## 🚀 Inicio Rápido (5 minutos)

### 1. Configurar Cloudinary Upload Preset

1. Ve a [Cloudinary Console](https://console.cloudinary.com/)
2. Settings → Upload → Add upload preset
3. Nombre: `arye_products`
4. Signing Mode: **Unsigned**
5. Folder: `arye_system`
6. Guardar

### 2. Usar en tu formulario

```tsx
import { QuickImageUpload } from '@/components/QuickImageUpload';
import { useState } from 'react';

function MyForm() {
  const [imageUrl, setImageUrl] = useState('');

  return (
    <form>
      {/* Tus otros campos */}
      
      <QuickImageUpload
        entityType="products"
        label="Imagen del Producto"
        currentImage={imageUrl}
        onImageUploaded={setImageUrl}
      />
      
      {/* Resto del formulario */}
    </form>
  );
}
```

¡Listo! 🎉

---

## 📦 Componentes Disponibles

### 1. QuickImageUpload (Imagen única)

**Ideal para**: Foto de perfil, imagen principal, logo, etc.

```tsx
import { QuickImageUpload } from '@/components/QuickImageUpload';

<QuickImageUpload
  entityType="products"        // 'products' | 'packages' | 'deliveries'
  label="Imagen Principal"
  currentImage={imageUrl}
  onImageUploaded={setImageUrl}
  folder="optional-subfolder"  // Opcional
/>
```

### 2. MultiImageUpload (Múltiples imágenes)

**Ideal para**: Galería de productos, evidencias de entrega, etc.

```tsx
import { MultiImageUpload } from '@/components/QuickImageUpload';

<MultiImageUpload
  entityType="products"
  label="Galería de Imágenes"
  currentImages={imageUrls}
  onImagesUploaded={setImageUrls}
  maxImages={5}               // Opcional: limitar cantidad
/>
```

### 3. ImageUploader (Control total)

**Ideal para**: Casos de uso avanzados con callbacks personalizados.

```tsx
import { ImageUploader } from '@/components/ImageUploader';

<ImageUploader
  entityType="products"
  multiple={true}
  maxSizeMB={10}
  value={images}
  onChange={setImages}
  onUploadComplete={(results) => {
    console.log('Upload completo:', results);
  }}
  className="custom-class"
/>
```

---

## 💡 Ejemplos Prácticos

### Formulario de Producto con React Hook Form

```tsx
import { useForm } from 'react-hook-form';
import { QuickImageUpload, MultiImageUpload } from '@/components/QuickImageUpload';
import { useState } from 'react';

function ProductForm() {
  const { register, handleSubmit } = useForm();
  const [mainImage, setMainImage] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);

  const onSubmit = (data) => {
    const productData = {
      ...data,
      mainImage,
      gallery,
    };
    
    console.log('Producto:', productData);
    // Enviar al backend
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} placeholder="Nombre" />
      <input {...register('price')} type="number" placeholder="Precio" />
      
      <QuickImageUpload
        entityType="products"
        label="Imagen Principal"
        currentImage={mainImage}
        onImageUploaded={setMainImage}
      />
      
      <MultiImageUpload
        entityType="products"
        label="Galería"
        currentImages={gallery}
        onImagesUploaded={setGallery}
        maxImages={4}
      />
      
      <button type="submit">Crear Producto</button>
    </form>
  );
}
```

### Formulario de Entrega con Evidencia Fotográfica

```tsx
import { MultiImageUpload } from '@/components/QuickImageUpload';
import { useState } from 'react';

function DeliveryForm() {
  const [evidencePhotos, setEvidencePhotos] = useState<string[]>([]);

  const handleSubmit = () => {
    const delivery = {
      orderId: '12345',
      status: 'delivered',
      evidencePhotos, // URLs de Cloudinary
    };
    
    // Enviar al backend
  };

  return (
    <div>
      <MultiImageUpload
        entityType="deliveries"
        folder="evidencia"
        label="Evidencia de Entrega"
        currentImages={evidencePhotos}
        onImagesUploaded={setEvidencePhotos}
      />
      
      <button onClick={handleSubmit}>Completar Entrega</button>
    </div>
  );
}
```

### Actualizar Imagen Existente

```tsx
import { QuickImageUpload } from '@/components/QuickImageUpload';
import { useState, useEffect } from 'react';

function EditPackage({ packageId }) {
  const [imageUrl, setImageUrl] = useState('');

  // Cargar imagen actual
  useEffect(() => {
    fetch(`/api/packages/${packageId}`)
      .then(res => res.json())
      .then(data => setImageUrl(data.imageUrl));
  }, [packageId]);

  const handleUpdate = () => {
    fetch(`/api/packages/${packageId}`, {
      method: 'PUT',
      body: JSON.stringify({ imageUrl }),
    });
  };

  return (
    <div>
      <QuickImageUpload
        entityType="packages"
        label="Imagen del Paquete"
        currentImage={imageUrl}
        onImageUploaded={setImageUrl}
      />
      
      <button onClick={handleUpdate}>Actualizar</button>
    </div>
  );
}
```

---

## 🎨 Personalización

### Cambiar tamaño máximo de archivo

```tsx
<ImageUploader
  entityType="products"
  maxSizeMB={5}  // 5MB en lugar de 10MB por defecto
  {...otherProps}
/>
```

### Organizar por subcarpetas

```tsx
// Productos → arye_system/products/electronics
<QuickImageUpload
  entityType="products"
  folder="electronics"
  {...props}
/>

// Entregas → arye_system/deliveries/2024/enero
<MultiImageUpload
  entityType="deliveries"
  folder="2024/enero"
  {...props}
/>
```

### Callbacks personalizados

```tsx
<ImageUploader
  entityType="products"
  onUploadComplete={(result) => {
    console.log('Subida completa!');
    console.log('URL:', result.secureUrl);
    console.log('Public ID:', result.publicId);
    console.log('Dimensiones:', result.width, 'x', result.height);
    
    // Enviar al analytics
    trackImageUpload(result);
  }}
  {...props}
/>
```

---

## 🔧 Uso Avanzado con Hook

Si necesitas más control, usa el hook directamente:

```tsx
import { useCloudinary } from '@/hooks/useCloudinary';

function CustomUploader() {
  const { 
    uploading, 
    progress, 
    error, 
    uploadImage 
  } = useCloudinary({
    entityType: 'products',
    folder: 'custom',
    onSuccess: (result) => {
      console.log('Éxito:', result);
    },
    onError: (error) => {
      console.error('Error:', error);
    },
  });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const result = await uploadImage(file);
      console.log('Imagen subida:', result.secureUrl);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      {uploading && <p>Subiendo... {progress}%</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

---

## 📊 Estructura de Carpetas Recomendada

```
cloudinary://arye_system/
├── products/
│   ├── main-images/         # Imágenes principales
│   ├── gallery/             # Galerías
│   └── electronics/         # Por categoría
├── packages/
│   └── tracking/            # Fotos de seguimiento
└── deliveries/
    ├── evidencia/           # Evidencias de entrega
    └── 2024/
        ├── enero/
        └── febrero/
```

---

## ✅ Checklist de Integración

- [ ] Upload preset `arye_products` creado en Cloudinary
- [ ] Preset configurado como "Unsigned"
- [ ] Variables de entorno configuradas
- [ ] Componente integrado en formulario
- [ ] Estado para URLs de imágenes
- [ ] Envío de URLs al backend
- [ ] Prueba de subida exitosa
- [ ] Validación de errores funcionando

---

## 🐛 Solución de Problemas Comunes

### "Upload preset not found"
✅ **Solución**: Verifica que el preset `arye_products` exista y sea "Unsigned"

### Las imágenes no aparecen en el preview
✅ **Solución**: Verifica que estés pasando correctamente el `value` y `onChange`

### Error de CORS
✅ **Solución**: Cloudinary maneja CORS automáticamente, no requiere configuración

### El archivo es muy grande
✅ **Solución**: Ajusta el prop `maxSizeMB` o comprime la imagen antes

---

## 📝 Tips y Mejores Prácticas

1. **Organización**: Usa `folder` para organizar por categoría o fecha
2. **Validación**: Valida las URLs antes de enviar al backend
3. **UX**: Muestra el progreso y errores claramente
4. **Performance**: Usa las imágenes optimizadas de Cloudinary en la UI
5. **Backup**: Guarda las URLs en tu base de datos
6. **Eliminación**: Implementa endpoint en backend para eliminar imágenes

---

## 🔗 Enlaces Útiles

- [Documentación completa](./CLOUDINARY_SETUP.md)
- [Ejemplo de formulario](../src/pages/ProductFormExample.tsx)
- [Ejemplos de uso](../src/pages/ImageUploadExamples.tsx)
- [Cloudinary Docs](https://cloudinary.com/documentation)

---

**¿Necesitas ayuda?** Revisa los ejemplos en `src/pages/` o consulta la documentación completa.
