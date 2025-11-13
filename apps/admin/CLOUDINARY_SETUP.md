# Configuración de Cloudinary para Subida de Imágenes

## 📋 Descripción

Sistema completo de subida de imágenes a Cloudinary para productos, paquetes y entregas en el panel de administración.

## 🚀 Características

- ✅ Drag & Drop de imágenes
- ✅ Preview en tiempo real
- ✅ Subida simple o múltiple
- ✅ Validación de tipo y tamaño
- ✅ Barra de progreso
- ✅ Optimización automática
- ✅ Organización por carpetas
- ✅ Integración con shadcn/ui

## 📦 Instalación

### 1. Instalar dependencias

```bash
pnpm add @cloudinary/react @cloudinary/url-gen
```

### 2. Configurar variables de entorno

En el archivo `.env`:

```env
CLOUDINARY_CLOUD_NAME=ditwmsrsh
CLOUDINARY_API_KEY=925949113946354
CLOUDINARY_API_SECRET=jKDwXwFuXVaN02Fyshd2OF1S6l0
CLOUDINARY_UPLOAD_PRESET=arye_products
```

### 3. Configurar Cloudinary Dashboard

1. Ir a [Cloudinary Dashboard](https://console.cloudinary.com/)
2. Navegar a **Settings → Upload**
3. Crear un **Upload Preset** con el nombre: `arye_products`
4. Configurar el preset:
   - **Signing Mode**: Unsigned (para uploads desde frontend)
   - **Folder**: `arye_system` (carpeta base)
   - **Allowed formats**: jpg, png, gif, webp
   - **Max file size**: 10MB (ajustable)

## 🗂️ Estructura de Archivos

```
src/
├── services/
│   └── cloudinaryService.ts      # Lógica de upload y utilidades
├── hooks/
│   └── useCloudinary.ts          # Hook para manejar uploads
├── components/
│   └── ImageUploader.tsx         # Componente principal
└── pages/
    └── ImageUploadExamples.tsx   # Ejemplos de uso
```

## 💻 Uso del Componente

### Ejemplo básico - Productos (múltiples imágenes)

```tsx
import { ImageUploader } from '@/components/ImageUploader';
import { useState } from 'react';

const ProductForm = () => {
  const [productImages, setProductImages] = useState<string[]>([]);

  return (
    <ImageUploader
      entityType="products"
      multiple={true}
      maxSizeMB={10}
      value={productImages}
      onChange={setProductImages}
      onUploadComplete={(results) => {
        console.log('Imágenes subidas:', results);
      }}
    />
  );
};
```

### Ejemplo - Paquetes (imagen única)

```tsx
import { ImageUploader } from '@/components/ImageUploader';
import { useState } from 'react';

const PackageForm = () => {
  const [packageImage, setPackageImage] = useState<string>('');

  return (
    <ImageUploader
      entityType="packages"
      multiple={false}
      maxSizeMB={5}
      value={packageImage}
      onChange={setPackageImage}
    />
  );
};
```

### Ejemplo - Entregas con subcarpeta

```tsx
import { ImageUploader } from '@/components/ImageUploader';
import { useState } from 'react';

const DeliveryForm = () => {
  const [deliveryImages, setDeliveryImages] = useState<string[]>([]);

  return (
    <ImageUploader
      entityType="deliveries"
      folder="evidencia"  // Subcarpeta: arye_system/deliveries/evidencia
      multiple={true}
      maxSizeMB={8}
      value={deliveryImages}
      onChange={setDeliveryImages}
    />
  );
};
```

## 🎨 Props del Componente

| Prop | Tipo | Descripción | Por defecto |
|------|------|-------------|-------------|
| `entityType` | `'products' \| 'packages' \| 'deliveries'` | Tipo de entidad | **Requerido** |
| `folder` | `string` | Subcarpeta opcional | `undefined` |
| `multiple` | `boolean` | Permitir múltiples imágenes | `false` |
| `maxSizeMB` | `number` | Tamaño máximo en MB | `10` |
| `value` | `string \| string[]` | URLs actuales | `undefined` |
| `onChange` | `(urls: string \| string[]) => void` | Callback al cambiar | `undefined` |
| `onUploadComplete` | `(result) => void` | Callback al completar upload | `undefined` |
| `className` | `string` | Clases CSS adicionales | `undefined` |

## 🛠️ Hook useCloudinary

Para uso avanzado, puedes usar el hook directamente:

```tsx
import { useCloudinary } from '@/hooks/useCloudinary';

const MyComponent = () => {
  const { 
    uploading, 
    progress, 
    error, 
    uploadImage,
    uploadMultipleImages 
  } = useCloudinary({
    entityType: 'products',
    folder: 'custom-folder',
    maxSizeMB: 10,
    onSuccess: (result) => console.log('Success:', result),
    onError: (error) => console.error('Error:', error),
  });

  const handleUpload = async (file: File) => {
    const result = await uploadImage(file);
    if (result) {
      console.log('Imagen subida:', result.secureUrl);
    }
  };

  return (
    <div>
      {uploading && <p>Subiendo... {progress}%</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
};
```

## 📁 Organización de Carpetas en Cloudinary

```
cloudinary://
└── arye_system/
    ├── products/
    │   ├── producto-1.jpg
    │   └── producto-2.png
    ├── packages/
    │   └── paquete-1.jpg
    └── deliveries/
        ├── evidencia/
        │   ├── entrega-1.jpg
        │   └── entrega-2.jpg
        └── other/
```

## 🔧 Servicio cloudinaryService

### Funciones principales:

#### `uploadImageToCloudinary(file, entityType, folder?)`
Sube una imagen a Cloudinary.

```tsx
import { uploadImageToCloudinary } from '@/services/cloudinaryService';

const result = await uploadImageToCloudinary(file, 'products', 'nueva-coleccion');
console.log(result.secureUrl); // URL de la imagen subida
```

#### `getOptimizedImage(publicId, width?, height?)`
Obtiene una imagen optimizada de Cloudinary.

```tsx
import { getOptimizedImage } from '@/services/cloudinaryService';
import { AdvancedImage } from '@cloudinary/react';

const img = getOptimizedImage('sample-id', 500, 500);
return <AdvancedImage cldImg={img} />;
```

#### `validateImageFile(file, maxSizeMB?)`
Valida tipo y tamaño de archivo.

```tsx
import { validateImageFile } from '@/services/cloudinaryService';

try {
  validateImageFile(file, 10);
  console.log('Archivo válido');
} catch (error) {
  console.error(error.message);
}
```

## 🎯 Página de Ejemplos

Para ver todos los ejemplos funcionando, visita:

```
/image-upload-examples
```

Esta página muestra:
- Subida de imágenes de productos (múltiple)
- Subida de imagen de paquete (simple)
- Subida de evidencias de entrega (múltiple con subcarpeta)

## ⚠️ Notas Importantes

1. **Seguridad**: La eliminación de imágenes debe hacerse desde el backend por seguridad (requiere API Secret)

2. **Upload Preset**: Debe ser "Unsigned" para permitir uploads directos desde el frontend

3. **CORS**: Cloudinary maneja CORS automáticamente, no requiere configuración adicional

4. **Optimización**: Las imágenes se optimizan automáticamente (formato, calidad, tamaño)

5. **Tamaño**: Ajusta `maxSizeMB` según tus necesidades (recomendado: 10MB)

## 🐛 Troubleshooting

### Error: "Upload preset not found"
- Verifica que el preset `arye_products` exista en Cloudinary
- Verifica que esté configurado como "Unsigned"

### Error: "File too large"
- Verifica el tamaño del archivo
- Ajusta el prop `maxSizeMB` si es necesario

### Error: "Invalid file type"
- Solo se permiten: JPG, PNG, GIF, WEBP
- Verifica el tipo MIME del archivo

## 📚 Recursos

- [Cloudinary React SDK](https://cloudinary.com/documentation/react_integration)
- [Upload API](https://cloudinary.com/documentation/image_upload_api_reference)
- [Transformations](https://cloudinary.com/documentation/image_transformations)
- [Upload Presets](https://cloudinary.com/documentation/upload_presets)

## 🎉 ¡Listo!

Ahora puedes subir imágenes a Cloudinary desde tu aplicación de forma fácil y segura.
