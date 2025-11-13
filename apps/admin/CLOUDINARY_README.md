# 🎉 Sistema de Subida de Imágenes a Cloudinary - Completado

## ✅ Archivos Creados

### Servicios
- ✅ `src/services/cloudinaryService.ts` - Lógica de subida y utilidades de Cloudinary

### Hooks
- ✅ `src/hooks/useCloudinary.ts` - Hook para manejar uploads con estado

### Componentes
- ✅ `src/components/ImageUploader.tsx` - Componente principal con drag & drop
- ✅ `src/components/QuickImageUpload.tsx` - Componentes simplificados (Quick y Multi)
- ✅ `src/components/index.ts` - Exportaciones centralizadas

### Páginas de Ejemplo
- ✅ `src/pages/ImageUploadExamples.tsx` - Ejemplos para productos, paquetes y entregas
- ✅ `src/pages/ProductFormExample.tsx` - Formulario completo con React Hook Form

### Documentación
- ✅ `CLOUDINARY_SETUP.md` - Documentación completa y detallada
- ✅ `CLOUDINARY_QUICK_START.md` - Guía rápida de integración
- ✅ `README.md` - Este archivo

---

## 🚀 Próximos Pasos

### 1. Instalar Dependencias (SI AÚN NO LO HAS HECHO)

```bash
cd apps/admin
pnpm add @cloudinary/react @cloudinary/url-gen
```

### 2. Configurar Cloudinary Upload Preset

1. **Ve a [Cloudinary Console](https://console.cloudinary.com/)**
2. **Settings → Upload → Add upload preset**
3. **Configuración:**
   - Preset name: `arye_products`
   - Signing Mode: **Unsigned** ⚠️ IMPORTANTE
   - Folder: `arye_system`
4. **Guardar**

### 3. Verificar Variables de Entorno

Las variables ya están en tu `.env`, solo verifica:

```env
CLOUDINARY_CLOUD_NAME=ditwmsrsh
CLOUDINARY_UPLOAD_PRESET=arye_products
```

### 4. Usar en tus Formularios

#### Ejemplo Rápido - Imagen Única

```tsx
import { QuickImageUpload } from '@/components/QuickImageUpload';
import { useState } from 'react';

function MyForm() {
  const [imageUrl, setImageUrl] = useState('');

  return (
    <form>
      <QuickImageUpload
        entityType="products"
        label="Imagen del Producto"
        currentImage={imageUrl}
        onImageUploaded={setImageUrl}
      />
    </form>
  );
}
```

#### Ejemplo - Múltiples Imágenes

```tsx
import { MultiImageUpload } from '@/components/QuickImageUpload';
import { useState } from 'react';

function Gallery() {
  const [images, setImages] = useState<string[]>([]);

  return (
    <MultiImageUpload
      entityType="products"
      label="Galería"
      currentImages={images}
      onImagesUploaded={setImages}
      maxImages={5}
    />
  );
}
```

---

## 📁 Estructura del Proyecto

```
apps/admin/
├── src/
│   ├── services/
│   │   └── cloudinaryService.ts       ← Lógica de Cloudinary
│   ├── hooks/
│   │   └── useCloudinary.ts          ← Hook de subida
│   ├── components/
│   │   ├── ImageUploader.tsx         ← Componente principal
│   │   ├── QuickImageUpload.tsx      ← Componentes simplificados
│   │   └── index.ts                  ← Exportaciones
│   └── pages/
│       ├── ImageUploadExamples.tsx   ← Ejemplos completos
│       └── ProductFormExample.tsx    ← Formulario integrado
├── CLOUDINARY_SETUP.md               ← Docs completa
├── CLOUDINARY_QUICK_START.md         ← Guía rápida
└── .env                              ← Variables configuradas
```

---

## 🎯 Casos de Uso

### Para Productos
```tsx
<QuickImageUpload
  entityType="products"
  folder="main-images"
  label="Imagen Principal"
  currentImage={productImage}
  onImageUploaded={setProductImage}
/>
```

### Para Paquetes
```tsx
<QuickImageUpload
  entityType="packages"
  label="Foto del Paquete"
  currentImage={packageImage}
  onImageUploaded={setPackageImage}
/>
```

### Para Entregas (Evidencia)
```tsx
<MultiImageUpload
  entityType="deliveries"
  folder="evidencia"
  label="Evidencia de Entrega"
  currentImages={deliveryPhotos}
  onImagesUploaded={setDeliveryPhotos}
/>
```

---

## 🔧 Características Implementadas

- ✅ **Drag & Drop** - Arrastra y suelta imágenes
- ✅ **Click to Upload** - O haz clic para seleccionar
- ✅ **Preview en tiempo real** - Ve las imágenes antes de subir
- ✅ **Múltiples imágenes** - Sube una o varias a la vez
- ✅ **Validación** - Tipo de archivo y tamaño
- ✅ **Barra de progreso** - Feedback visual durante la subida
- ✅ **Optimización automática** - Cloudinary optimiza las imágenes
- ✅ **Organización por carpetas** - Por tipo de entidad
- ✅ **Manejo de errores** - Mensajes claros de error
- ✅ **Eliminar imágenes** - Botón para quitar del preview
- ✅ **Responsive** - Funciona en móvil y desktop
- ✅ **Integración con shadcn/ui** - Diseño consistente
- ✅ **TypeScript** - Type-safe

---

## 📚 Documentación Completa

### Para aprender más:
- 📖 **[CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md)** - Documentación técnica completa
- 🚀 **[CLOUDINARY_QUICK_START.md](./CLOUDINARY_QUICK_START.md)** - Guía rápida de integración
- 💡 **Ejemplos en código:**
  - `src/pages/ImageUploadExamples.tsx`
  - `src/pages/ProductFormExample.tsx`

---

## ⚠️ Importante: Antes de Usar

### ¡NO OLVIDES!
1. ✅ Crear el Upload Preset `arye_products` en Cloudinary
2. ✅ Configurarlo como **"Unsigned"**
3. ✅ Instalar las dependencias: `pnpm add @cloudinary/react @cloudinary/url-gen`

### Estructura de Carpetas en Cloudinary

Las imágenes se organizarán así:

```
cloudinary://ditwmsrsh/
└── arye_system/
    ├── products/          ← Productos
    ├── packages/          ← Paquetes
    └── deliveries/        ← Entregas
        └── evidencia/     ← Evidencias de entrega
```

---

## 🎨 Componentes Disponibles

| Componente | Uso | Imágenes |
|------------|-----|----------|
| `QuickImageUpload` | Imagen única | 1 |
| `MultiImageUpload` | Múltiples imágenes | N |
| `ImageUploader` | Control total | 1 o N |

---

## 💻 Comandos Útiles

```bash
# Ver ejemplos en desarrollo
cd apps/admin
pnpm dev
# Navega a la página de ejemplos

# Instalar dependencias
pnpm add @cloudinary/react @cloudinary/url-gen

# Build para producción
pnpm build
```

---

## 🐛 Troubleshooting

### Error: "Upload preset not found"
👉 Verifica que creaste el preset `arye_products` y está en modo "Unsigned"

### Las imágenes no se ven
👉 Verifica que pasas correctamente `value` y `onChange`

### Error de tamaño
👉 Ajusta `maxSizeMB` o comprime las imágenes

### Error de tipo de archivo
👉 Solo se permiten: JPG, PNG, GIF, WEBP

---

## 🎉 ¡Listo para Usar!

El sistema está completamente implementado y documentado. Solo necesitas:

1. Crear el Upload Preset en Cloudinary (5 minutos)
2. Instalar las dependencias (1 minuto)
3. Copiar un ejemplo de código (1 minuto)

**Total: 7 minutos para estar funcionando** ⚡

---

## 📞 ¿Necesitas Ayuda?

- 📖 Lee la [documentación completa](./CLOUDINARY_SETUP.md)
- 🚀 Sigue la [guía rápida](./CLOUDINARY_QUICK_START.md)
- 💡 Revisa los [ejemplos de código](./src/pages/ImageUploadExamples.tsx)
- 🔧 Mira el [formulario completo](./src/pages/ProductFormExample.tsx)

---

**Desarrollado con ❤️ para Arye System**
