# Amazon Product Scraper Component

Este componente permite obtener información detallada de productos y carritos de Amazon a través de una interfaz web intuitiva.

## Características

- ✅ **Scraping de productos individuales**: Extrae título, precio, descripción, imágenes, especificaciones, rating y más
- ✅ **Scraping de carritos**: Muestra todos los productos en un carrito con cantidades y precios
- ✅ **Validación de URLs**: Verifica automáticamente que las URLs sean de dominios de Amazon válidos
- ✅ **Interfaz responsiva**: Diseño moderno y adaptable usando shadcn/ui
- ✅ **Manejo de estados**: Loading, éxito y error con feedback visual
- ✅ **Integración completa**: Usa TanStack Query, autenticación JWT automática y notificaciones

## Uso

```tsx
import { AmazonCatch } from '@/components/scrapping/amazon-catch';

function ScrapingPage() {
  return (
    <div className="container mx-auto py-8">
      <AmazonCatch />
    </div>
  );
}
```

## URLs Soportadas

### Productos Individuales
- `https://amazon.com/dp/B08N5WRWNW`
- `https://amazon.com/gp/product/B08N5WRWNW`
- `https://amazon.es/dp/B08N5WRWNW`

### Carritos de Compra
- `https://amazon.com/cart`
- `https://amazon.com/gp/cart`
- `https://amazon.com/gp/aw/c`

### Dominios Soportados
- amazon.com, amazon.es, amazon.co.uk, amazon.de, amazon.fr, amazon.it, amazon.ca, amazon.com.au, amazon.com.br, amazon.in, amazon.jp, amazon.mx, amazon.nl

## Dependencias

- React 19+
- TanStack Query (React Query)
- shadcn/ui components
- Lucide React icons
- Sonner (notificaciones)
- Servicio de scraping de Amazon (API backend)

## API Integration

El componente usa automáticamente el servicio `scrapeAmazon` que se conecta al endpoint `/api/amazon/scrape/` del backend con autenticación JWT.

## Estados del Componente

1. **Inicial**: Formulario vacío listo para ingresar URL
2. **Cargando**: Spinner mientras se procesa la solicitud
3. **Éxito**: Muestra información detallada del producto/carrito
4. **Error**: Mensaje de error descriptivo

## Manejo de Errores

- URLs inválidas
- Productos no encontrados
- Errores de red
- Problemas de autenticación
- Rate limiting

## Personalización

El componente es altamente personalizable. Puedes:

- Modificar los estilos usando Tailwind CSS
- Cambiar los textos y mensajes
- Agregar funcionalidades adicionales
- Integrar con otros servicios

## Ejemplos de Respuesta

### Producto Individual
```json
{
  "success": true,
  "data": {
    "asin": "B08N5WRWNW",
    "title": "Echo Dot (4th Gen)",
    "price": 49.99,
    "currency": "USD",
    "description": "Smart speaker with Alexa",
    "images": ["url1.jpg", "url2.jpg"],
    "specifications": {"Brand": "Amazon", "Color": "Black"},
    "category": "Electronics > Smart Home",
    "rating": 4.7,
    "reviews_count": 245678,
    "availability": "In Stock",
    "url": "https://amazon.com/dp/B08N5WRWNW"
  }
}
```

### Carrito de Compra
```json
{
  "success": true,
  "data": {
    "type": "cart",
    "cart_url": "https://amazon.com/cart",
    "total_items": 3,
    "total_price": "$156.97",
    "product_count": 2,
    "products": [
      {
        "asin": "B08N5WRWNW",
        "title": "Echo Dot",
        "price": "$49.99",
        "quantity": 2,
        "image_url": "image.jpg",
        "product_url": "https://amazon.com/dp/B08N5WRWNW"
      }
    ]
  }
}
```