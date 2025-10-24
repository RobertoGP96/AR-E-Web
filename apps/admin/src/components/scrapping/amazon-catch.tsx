/**
 * Componente Amazon Catch - Obtener información de productos de Amazon
 *
 * Permite al usuario ingresar una URL de Amazon y obtener información detallada
 * del producto o carrito a través del servicio de scraping.
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ExternalLink, ShoppingCart, Package, Star, DollarSign, Image as ImageIcon } from 'lucide-react';
import { scrapeAmazon, isProductData, isCartData, isValidAmazonUrl, type AmazonScrapeResult, type AmazonProductData, type AmazonCartData, type AmazonCartProduct } from '@/services/scrapping/scrap-amazon';
import { toast } from 'sonner';

/**
 * Obtiene el mensaje de error de un resultado de scraping
 */
function getErrorMessage(result: AmazonScrapeResult): string {
  if (result.success) return '';
  return (result as { error: string }).error;
}

export function AmazonCatch() {
  const [url, setUrl] = useState('');
  const [lastResult, setLastResult] = useState<AmazonScrapeResult | null>(null);

  const scrapeMutation = useMutation({
    mutationFn: scrapeAmazon,
    onSuccess: (data: AmazonScrapeResult) => {
      setLastResult(data);
      if (data.success) {
        toast.success('Información obtenida exitosamente');
      } else {
        toast.error(getErrorMessage(data));
      }
    },
    onError: (error) => {
      console.error('Error en scraping:', error);
      toast.error('Error al obtener información del producto');
      setLastResult({
        success: false,
        error: 'Error de conexión o servidor no disponible'
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toast.error('Por favor ingresa una URL');
      return;
    }

    if (!isValidAmazonUrl(url)) {
      toast.error('La URL debe ser de un dominio de Amazon válido');
      return;
    }

    scrapeMutation.mutate(url);
  };

  const handleClear = () => {
    setUrl('');
    setLastResult(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Amazon Product Scraper
          </CardTitle>
          <CardDescription>
            Ingresa la URL de un producto o carrito de Amazon para obtener su información detallada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amazon-url">URL de Amazon</Label>
              <div className="flex gap-2">
                <Input
                  id="amazon-url"
                  type="url"
                  placeholder="https://amazon.com/dp/B08N5WRWNW"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1"
                  disabled={scrapeMutation.isPending}
                />
                <Button
                  type="submit"
                  disabled={scrapeMutation.isPending || !url.trim()}
                >
                  {scrapeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Obteniendo...
                    </>
                  ) : (
                    'Obtener Info'
                  )}
                </Button>
                {(url || lastResult) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClear}
                    disabled={scrapeMutation.isPending}
                  >
                    Limpiar
                  </Button>
                )}
              </div>
            </div>

            {/* Estado de carga */}
            {scrapeMutation.isPending && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Procesando la URL de Amazon... Esto puede tomar unos segundos.
                </AlertDescription>
              </Alert>
            )}

            {/* Resultados */}
            {lastResult && !scrapeMutation.isPending && (
              <div className="space-y-4">
                {lastResult.success ? (
                  <div className="space-y-4">
                    {isProductData(lastResult.data) && (
                      <ProductInfoCard product={lastResult.data} />
                    )}
                    {isCartData(lastResult.data) && (
                      <CartInfoCard cart={lastResult.data} />
                    )}
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {getErrorMessage(lastResult)}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Componente para mostrar información de un producto individual
 */
function ProductInfoCard({ product }: { product: AmazonProductData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Información del Producto
        </CardTitle>
        <CardDescription>
          Detalles extraídos del producto de Amazon
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Título y precio principal */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold leading-tight">{product.title}</h3>
          <div className="flex items-center gap-4">
            {product.price && (
              <div className="flex items-center gap-1 text-2xl font-bold text-green-600">
                <DollarSign className="h-5 w-5" />
                {product.price} {product.currency}
              </div>
            )}
            {product.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{product.rating}</span>
                {product.reviews_count && (
                  <span className="text-sm text-muted-foreground">
                    ({product.reviews_count.toLocaleString()} reseñas)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {product.asin && (
            <div>
              <Label className="text-sm font-medium">ASIN</Label>
              <p className="font-mono text-sm">{product.asin}</p>
            </div>
          )}
          <div>
            <Label className="text-sm font-medium">Disponibilidad</Label>
            <Badge variant={product.availability === 'In Stock' ? 'default' : 'secondary'}>
              {product.availability}
            </Badge>
          </div>
          {product.category && (
            <div className="md:col-span-2">
              <Label className="text-sm font-medium">Categoría</Label>
              <p className="text-sm text-muted-foreground">{product.category}</p>
            </div>
          )}
        </div>

        {/* Descripción */}
        {product.description && (
          <>
            <Separator />
            <div>
              <Label className="text-sm font-medium">Descripción</Label>
              <p className="text-sm leading-relaxed mt-1">{product.description}</p>
            </div>
          </>
        )}

        {/* Especificaciones */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <>
            <Separator />
            <div>
              <Label className="text-sm font-medium">Especificaciones</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="font-medium">{key}:</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Imágenes */}
        {product.images && product.images.length > 0 && (
          <>
            <Separator />
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Imágenes ({product.images.length})
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {product.images.slice(0, 8).map((imageUrl: string, index: number) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden border">
                    <img
                      src={imageUrl}
                      alt={`Producto ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => window.open(imageUrl, '_blank')}
                    />
                  </div>
                ))}
                {product.images.length > 8 && (
                  <div className="aspect-square rounded-lg border border-dashed flex items-center justify-center text-sm text-muted-foreground">
                    +{product.images.length - 8} más
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Enlace al producto */}
        <Separator />
        <div className="flex justify-end">
          <Button variant="outline" asChild>
            <a href={product.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Ver en Amazon
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Componente para mostrar información de un carrito
 */
function CartInfoCard({ cart }: { cart: AmazonCartData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Información del Carrito
        </CardTitle>
        <CardDescription>
          Productos en el carrito de Amazon
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumen del carrito */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{cart.total_items}</div>
            <div className="text-sm text-muted-foreground">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{cart.product_count}</div>
            <div className="text-sm text-muted-foreground">Productos Únicos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{cart.total_price}</div>
            <div className="text-sm text-muted-foreground">Precio Total</div>
          </div>
        </div>

        <Separator />

        {/* Lista de productos */}
        <div>
          <Label className="text-sm font-medium">Productos en el carrito</Label>
          <div className="space-y-3 mt-3">
            {cart.products.map((product: AmazonCartProduct, index: number) => (
              <Card key={index} className="p-3">
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden border flex-shrink-0">
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm leading-tight line-clamp-2">
                      {product.title}
                    </h4>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-600">{product.price}</span>
                        <Badge variant="outline">x{product.quantity}</Badge>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={product.product_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                    {product.asin && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        ASIN: {product.asin}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Enlace al carrito */}
        <Separator />
        <div className="flex justify-end">
          <Button variant="outline" asChild>
            <a href={cart.cart_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Ver Carrito en Amazon
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
