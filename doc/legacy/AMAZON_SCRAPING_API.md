# Amazon Scraping API

Este documento describe el endpoint para hacer scraping de productos individuales y carritos de Amazon.

## Endpoint

```
POST /api/amazon/scrape/
```

## Autenticación

Este endpoint requiere autenticación JWT. Incluye el token en el header:

```
Authorization: Bearer <tu_token_jwt>
```

## Funcionalidades

- ✅ **Productos individuales**: Extrae datos completos de un producto
- ✅ **Carritos de compra**: Extrae todos los productos de un carrito
- ✅ **Detección automática**: Reconoce automáticamente si es producto o carrito

## Solicitud

### Cuerpo de la solicitud

```json
{
    "url": "https://amazon.com/dp/XXXXXXXX"
}
```

### Parámetros

- `url` (string, requerido): URL del producto o carrito de Amazon que se quiere scrapear

### URLs soportadas

**Productos:**
- `https://amazon.com/dp/B08N5WRWNW`
- `https://amazon.com/gp/product/B08N5WRWNW`
- `https://amazon.es/dp/B08N5WRWNW`

**Carritos:**
- `https://amazon.com/cart`
- `https://amazon.com/gp/cart`
- `https://amazon.com/gp/aw/c`

**Dominios soportados:**
- amazon.com
- amazon.es  
- amazon.co.uk
- amazon.de
- amazon.fr
- amazon.it

## Respuesta

### Respuesta exitosa

### Respuesta para producto individual

Cuando se scrapea un producto individual: (200 OK)

```json
{
    "success": true,
    "data": {
        "asin": "B08N5WRWNW",
        "title": "Echo Dot (4th Gen) | Smart speaker with Alexa",
        "price": 49.99,
        "currency": "USD",
        "description": "Meet the all-new Echo Dot - Our most popular smart speaker with a fabric design. It is our most compact smart speaker that fits perfectly into small spaces.",
        "images": [
            "https://images-na.ssl-images-amazon.com/images/I/61KbxeY77SL._AC_SL1000_.jpg",
            "https://images-na.ssl-images-amazon.com/images/I/71yJp4ByQZL._AC_SL1000_.jpg"
        ],
        "specifications": {
            "Brand": "Amazon",
            "Color": "Charcoal",
            "Connectivity Technology": "Wi-Fi",
            "Special Feature": "Voice Control"
        },
        "category": "Electronics > Smart Home > Smart Speakers",
        "rating": 4.7,
        "reviews_count": 245678,
        "availability": "In Stock",
        "url": "https://amazon.com/dp/B08N5WRWNW"
    }
}
```

### Respuesta para carrito de compra

Cuando se scrapea un carrito de Amazon:

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
                "title": "Echo Dot (4th Gen) | Smart speaker with Alexa | Charcoal",
                "price": "$49.99",
                "quantity": 2,
                "image_url": "https://m.media-amazon.com/images/I/614YRG76AXL._AC_SL1000_.jpg",
                "product_url": "https://amazon.com/dp/B08N5WRWNW"
            },
            {
                "asin": "B07PGL2N7J",
                "title": "Fire TV Stick 4K | Streaming device with Alexa Voice Remote",
                "price": "$56.99",
                "quantity": 1,
                "image_url": "https://m.media-amazon.com/images/I/51TjJOTfslL._AC_SL1000_.jpg",
                "product_url": "https://amazon.com/dp/B07PGL2N7J"
            }
        ]
    }
}
```

### Respuesta de error (400 Bad Request)

```json
{
    "success": false,
    "error": "La URL debe ser de un producto de Amazon válido"
}
```

### Respuesta de error de scraping (400 Bad Request)

```json
{
    "success": false,
    "error": "Página bloqueada por Amazon o producto no encontrado"
}
```

### Respuesta de error del servidor (500 Internal Server Error)

```json
{
    "success": false,
    "error": "Error inesperado: Descripción del error"
}
```

## Campos de la respuesta

### Campo `data`

- `asin` (string|null): Identificador único del producto en Amazon
- `title` (string): Título del producto
- `price` (float|null): Precio del producto
- `currency` (string): Moneda del precio (por defecto "USD")
- `description` (string): Descripción del producto
- `images` (array): Lista de URLs de imágenes del producto
- `specifications` (object): Especificaciones técnicas del producto
- `category` (string): Categoría del producto (breadcrumb)
- `rating` (float|null): Calificación promedio del producto
- `reviews_count` (integer|null): Número total de reseñas
- `availability` (string): Estado de disponibilidad del producto
- `url` (string): URL original del producto

## Ejemplos de uso

### cURL

```bash
curl -X POST \
  http://localhost:8000/api/amazon/scrape/ \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://amazon.com/dp/B08N5WRWNW"
  }'
```

### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:8000/api/amazon/scrape/', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN',
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        url: 'https://amazon.com/dp/B08N5WRWNW'
    })
});

const data = await response.json();
console.log(data);
```

### Python (requests)

```python
import requests

url = "http://localhost:8000/api/amazon/scrape/"
headers = {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json',
}
data = {
    "url": "https://amazon.com/dp/B08N5WRWNW"
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(result)
```

## Casos de uso

### Escenario 1: Scraping de producto individual

**Solicitud:**
```json
{
    "url": "https://amazon.com/dp/B08N5WRWNW"
}
```

**Respuesta:** Datos completos del producto individual con todos los campos disponibles (ver ejemplo arriba).

### Escenario 2: Scraping de carrito de compra

**Solicitud:**
```json
{
    "url": "https://amazon.com/cart"
}
```

**Respuesta:** Lista de todos los productos en el carrito con información de cantidad y precios (ver ejemplo arriba).

### Escenario 3: URL no válida

**Solicitud:**
```json
{
    "url": "https://google.com"
}
```

**Respuesta:**
```json
{
    "success": false,
    "error": "Invalid Amazon URL. Please provide a valid Amazon product or cart URL."
}
```

## Diferencias entre productos y carritos

### Productos individuales
- Respuesta más detallada con especificaciones, descripción, rating
- Un solo producto con información completa
- ASIN extraído de la URL o página

### Carritos de compra
- Lista de múltiples productos
- Información básica por producto (título, precio, cantidad, imagen)
- Totales del carrito (total_items, total_price, product_count)
- Cada producto incluye su URL individual para scraping detallado

## Notas importantes

1. **Detección automática**: El sistema detecta automáticamente si la URL es de un producto o un carrito
2. **Rate limiting**: Se implementan delays aleatorios entre requests para evitar bloqueos
3. **User-Agent rotation**: Se utilizan diferentes user agents para simular navegadores reales
4. **Robustez**: El scraper maneja errores de conexión y elementos faltantes gracefully
5. **Carritos vs Productos**: Los carritos devuelven múltiples productos, los productos individuales devuelven un solo item
6. **Escalabilidad**: Para carritos grandes, considera hacer requests separados para cada producto si necesitas detalles completos

## Códigos de error comunes

- `400`: URL inválida o no es de Amazon
- `400`: Producto no encontrado o página bloqueada
- `401`: Token JWT inválido o faltante
- `500`: Error interno del servidor o de conexión

## Notas de desarrollo

- El scraper maneja automáticamente redirects y diferentes formatos de URL de Amazon
- Se extraen múltiples tipos de imágenes (thumbnail, large, hiRes)
- Las especificaciones se extraen de diferentes secciones según el layout de la página
- El precio se busca en múltiples selectores CSS para máxima compatibilidad