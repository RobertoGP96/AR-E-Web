import React, { useState } from 'react';
import { ImageUploader } from '@/components/images/ImageUploader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, ShoppingCart, Truck } from 'lucide-react';
import type { CloudinaryUploadResult } from '@/services/cloudinaryService';

/**
 * Página de ejemplo que muestra cómo usar el ImageUploader
 * para diferentes tipos de entidades (productos, paquetes, entregas)
 */
export const ImageUploadExamples: React.FC = () => {
  const [productImages, setProductImages] = useState<string[]>([]);
  const [packageImage, setPackageImage] = useState<string>('');
  const [deliveryImages, setDeliveryImages] = useState<string[]>([]);

  const handleProductUpload = (urls: string | string[]) => {
    const urlArray = Array.isArray(urls) ? urls : [urls];
    setProductImages(urlArray);
    console.log('Imágenes de producto:', urlArray);
  };

  const handlePackageUpload = (url: string | string[]) => {
    const singleUrl = Array.isArray(url) ? url[0] : url;
    setPackageImage(singleUrl);
    console.log('Imagen de paquete:', singleUrl);
  };

  const handleDeliveryUpload = (urls: string | string[]) => {
    const urlArray = Array.isArray(urls) ? urls : [urls];
    setDeliveryImages(urlArray);
    console.log('Imágenes de entrega:', urlArray);
  };

  const handleUploadComplete = (result: CloudinaryUploadResult | CloudinaryUploadResult[]) => {
    if (Array.isArray(result)) {
      console.log('Múltiples imágenes subidas:', result);
    } else {
      console.log('Imagen subida:', result);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subida de Imágenes a Cloudinary</h1>
        <p className="text-muted-foreground">
          Ejemplos de uso del componente ImageUploader para diferentes tipos de entidades
        </p>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Productos
          </TabsTrigger>
          <TabsTrigger value="packages" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Paquetes
          </TabsTrigger>
          <TabsTrigger value="deliveries" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Entregas
          </TabsTrigger>
        </TabsList>

        {/* PRODUCTOS - Múltiples imágenes */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Imágenes de Productos
              </CardTitle>
              <CardDescription>
                Sube múltiples imágenes para tus productos. Las imágenes se organizarán en la
                carpeta <code className="text-xs bg-muted px-1 py-0.5 rounded">arye_system/products</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploader
                entityType="products"
                multiple={true}
                maxSizeMB={10}
                value={productImages}
                onChange={handleProductUpload}
                onUploadComplete={handleUploadComplete}
              />

              {productImages.length > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">URLs generadas:</p>
                  <div className="space-y-1">
                    {productImages.map((url, index) => (
                      <p key={index} className="text-xs font-mono truncate">
                        {url}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAQUETES - Imagen única */}
        <TabsContent value="packages">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Imagen de Paquete
              </CardTitle>
              <CardDescription>
                Sube una imagen para el paquete. Se guardará en{' '}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">arye_system/packages</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploader
                entityType="packages"
                multiple={false}
                maxSizeMB={5}
                value={packageImage}
                onChange={handlePackageUpload}
                onUploadComplete={handleUploadComplete}
              />

              {packageImage && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">URL generada:</p>
                  <p className="text-xs font-mono break-all">{packageImage}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ENTREGAS - Múltiples imágenes con carpeta personalizada */}
        <TabsContent value="deliveries">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Imágenes de Entregas
              </CardTitle>
              <CardDescription>
                Sube evidencias de entrega. Se organizarán en{' '}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  arye_system/deliveries/evidencia
                </code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploader
                entityType="deliveries"
                folder="evidencia"
                multiple={true}
                maxSizeMB={8}
                value={deliveryImages}
                onChange={handleDeliveryUpload}
                onUploadComplete={handleUploadComplete}
              />

              {deliveryImages.length > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">URLs generadas:</p>
                  <div className="space-y-1">
                    {deliveryImages.map((url, index) => (
                      <p key={index} className="text-xs font-mono truncate">
                        {url}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sección de información */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Información Importante</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Configuración requerida en Cloudinary:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Ir al Dashboard de Cloudinary</li>
              <li>Navegar a Settings → Upload</li>
              <li>
                Crear un Upload Preset llamado <code className="bg-muted px-1 py-0.5 rounded">arye_products</code>
              </li>
              <li>Configurar el preset como "Unsigned" para permitir uploads desde el frontend</li>
              <li>Configurar la carpeta de destino como <code className="bg-muted px-1 py-0.5 rounded">arye_system</code></li>
            </ol>
          </div>

          <div>
            <h3 className="font-medium mb-2">Características del componente:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Drag & Drop de imágenes</li>
              <li>Preview en tiempo real</li>
              <li>Soporte para múltiples imágenes</li>
              <li>Validación de tipo y tamaño de archivo</li>
              <li>Barra de progreso durante la subida</li>
              <li>Optimización automática de imágenes con Cloudinary</li>
              <li>Organización por carpetas según tipo de entidad</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-2">Propiedades del componente:</h3>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
{`<ImageUploader
  entityType="products" | "packages" | "deliveries"  // Tipo de entidad
  folder="carpeta-opcional"                          // Subcarpeta opcional
  multiple={true | false}                            // Permitir múltiples imágenes
  maxSizeMB={10}                                     // Tamaño máximo en MB
  value={string | string[]}                          // URLs actuales
  onChange={(urls) => {}}                            // Callback al cambiar imágenes
  onUploadComplete={(result) => {}}                  // Callback al completar upload
  className="clases-css"                             // Clases CSS adicionales
/>`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
