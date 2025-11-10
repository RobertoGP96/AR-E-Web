# Sistema de Cálculo de Costos de Productos

## Descripción General

Este documento describe el sistema de cálculo de costos para productos en la aplicación de gestión de pedidos. El sistema calcula automáticamente el precio total que se cobrará a los clientes basándose en reglas específicas de impuestos y tarifas por tienda.

## Fórmula de Cálculo

El costo total se calcula de la siguiente manera:

```
Total = Precio Producto + Impuesto Base + Costo Envío + Tarifa Tienda + Impuestos Adicionales
```

Donde:
- **Precio Producto** = Precio Unitario (sin multiplicar por cantidad)
- **Impuesto Base** = Precio Producto × 7%
- **Costo Envío** = Valor del envío desde la tienda
- **Base para Tarifa** = Precio Producto + Impuesto Base + Costo Envío
- **Tarifa Tienda** = Base para Tarifa × Porcentaje de Tienda
- **Impuestos Adicionales** = Valor ingresado manualmente (si aplica)

**IMPORTANTE:** La cantidad del producto NO afecta el cálculo del precio. El precio se calcula por unidad individual.

### Orden de Aplicación

1. Se toma el **Precio Producto** (precio unitario, sin cantidad)
2. Se aplica el **Impuesto Base del 7%** sobre el Precio Producto
3. Se suma el **Costo de Envío**
4. Se calcula la **Tarifa de Tienda** aplicando el porcentaje correspondiente sobre la suma de (Precio Producto + Impuesto Base + Costo Envío)
5. Se suman los **Impuestos Adicionales** (si aplica)

## Tarifas por Tienda

El sistema aplica diferentes tarifas según la tienda de origen:

| Tienda | Tarifa |
|--------|--------|
| Shein | 0% |
| Amazon | 3% |
| Temu | 3% |
| AliExpress | 5% |
| Otras tiendas | 5% |

**Importante:** La tarifa de tienda se aplica sobre la base: (Precio Producto + Impuesto Base + Costo Envío)

## Ejemplo de Cálculo

### Ejemplo 1: Producto de Amazon
- **Producto:** Auriculares
- **Precio unitario:** $50.00
- **Costo de envío:** $10.00
- **Tienda:** Amazon (3%)
- **Impuestos adicionales:** $0

**Cálculo paso a paso:**
1. Precio Producto = **$50.00** (sin multiplicar por cantidad)
2. Impuesto base (7%) = $50.00 × 0.07 = **$3.50**
3. Costo Envío = **$10.00**
4. Base para Tarifa = $50.00 + $3.50 + $10.00 = **$63.50**
5. Tarifa Amazon (3%) = $63.50 × 0.03 = **$1.91**
6. Impuestos adicionales = **$0.00**
7. **Total = $50.00 + $3.50 + $10.00 + $1.91 + $0.00 = $65.41**

**Nota:** Si el cliente pide 2 unidades, debe pagar $65.41 × 2 = $130.82

### Ejemplo 2: Producto de AliExpress
- **Producto:** Reloj inteligente
- **Precio unitario:** $80.00
- **Costo de envío:** $15.00
- **Tienda:** AliExpress (5%)
- **Impuestos adicionales:** $5.00

**Cálculo paso a paso:**
1. Precio Producto = **$80.00** (sin multiplicar por cantidad)
2. Impuesto base (7%) = $80.00 × 0.07 = **$5.60**
3. Costo Envío = **$15.00**
4. Base para Tarifa = $80.00 + $5.60 + $15.00 = **$100.60**
5. Tarifa AliExpress (5%) = $100.60 × 0.05 = **$5.03**
6. Impuestos adicionales = **$5.00**
7. **Total = $80.00 + $5.60 + $15.00 + $5.03 + $5.00 = $110.63**

**Nota:** Si el cliente pide 1 unidad, paga $110.63

### Ejemplo 3: Producto de Shein (Tarifa 0%)
- **Producto:** Vestido
- **Precio unitario:** $25.00
- **Costo de envío:** $8.00
- **Tienda:** Shein (0%)
- **Impuestos adicionales:** $0

**Cálculo paso a paso:**
1. Precio Producto = **$25.00** (sin multiplicar por cantidad)
2. Impuesto base (7%) = $25.00 × 0.07 = **$1.75**
3. Costo Envío = **$8.00**
4. Base para Tarifa = $25.00 + $1.75 + $8.00 = **$34.75**
5. Tarifa Shein (0%) = $34.75 × 0.00 = **$0.00**
6. Impuestos adicionales = **$0.00**
7. **Total = $25.00 + $1.75 + $8.00 + $0.00 + $0.00 = $34.75**

**Nota:** Si el cliente pide 3 unidades, paga $34.75 × 3 = $104.25

## Implementación Técnica

### Función de Cálculo

```typescript
const calculateTotalCost = (
    unitPrice: number,
    shippingCost: number,
    shopName: string,
    additionalTaxes: number = 0
): { 
    subtotal: number;
    costoEnvio: number;
    baseImpuesto: number;
    baseParaTarifa: number;
    tarifaTienda: number;
    impuestosAdicionales: number;
    total: number 
} => {
    // Precio del producto (sin cantidad)
    const subtotal = unitPrice
    
    // Costo de envío
    const costoEnvio = shippingCost
    
    // Impuesto base: 7% sobre el precio del producto
    const baseImpuesto = subtotal * 0.07
    
    // Base para calcular la tarifa de tienda
    const baseParaTarifa = subtotal + baseImpuesto + costoEnvio
    
    // Tarifa por tienda (se aplica sobre la base calculada)
    const shopTaxRate = getShopTaxRate(shopName)
    const tarifaTienda = baseParaTarifa * (shopTaxRate / 100)
    
    // Impuestos adicionales
    const impuestosAdicionales = additionalTaxes
    
    // Total final
    const total = subtotal + baseImpuesto + costoEnvio + tarifaTienda + impuestosAdicionales
    
    return {
        subtotal,
        costoEnvio,
        baseImpuesto,
        baseParaTarifa,
        tarifaTienda,
        impuestosAdicionales,
        total
    }
}
```

### Detección Automática de Tienda

El sistema detecta automáticamente la tienda basándose en el URL del producto y aplica la tarifa correspondiente.

## Visualización del Desglose

El formulario de productos incluye un botón con ícono de factura (📄) que muestra un popover con el desglose detallado de todos los costos:

### Desglose Mostrado:
1. **Información del Producto**
   - Nombre del producto
   - Tienda de origen

2. **Cálculo Base**
   - Precio unitario
   - Subtotal del producto (igual al precio unitario)
   - Costo de envío

3. **Impuestos y Tarifas**
   - Impuesto base (7%)
   - Tarifa de tienda (% variable según tienda)
   - Base de cálculo para tarifa de tienda
   - Impuestos adicionales (si aplica)

4. **Total a Cobrar al Cliente**
   - Monto final calculado

5. **Fórmula Aplicada**
   - Explicación de la fórmula utilizada

## Campos del Modelo Product

Los siguientes campos almacenan los valores del cálculo:

- `shop_cost`: Precio unitario del producto
- `amount_requested`: Cantidad solicitada
- `shop_delivery_cost`: Costo de envío desde la tienda
- `shop_taxes`: Impuesto base del 7% (en valor absoluto)
- `added_taxes`: Tarifa de la tienda (en valor absoluto)
- `own_taxes`: Impuestos adicionales del usuario
- `total_cost`: **Total calculado que se cobra al cliente**

## Campos del Formulario

El formulario requiere los siguientes datos del usuario:

1. **Cantidad solicitada** (obligatorio)
   - Número de unidades del producto (para inventario, no afecta el precio unitario)

2. **Precio unitario** (obligatorio)
   - Precio de cada unidad en dólares

3. **Costo de envío** (obligatorio)
   - Costo del envío desde la tienda en dólares

4. **Impuestos adicionales** (opcional)
   - Cualquier impuesto extra a agregar al total

Los demás valores (impuesto base y tarifa de tienda) se calculan automáticamente.

**Importante:** El precio calculado es por unidad individual. Si el cliente pide múltiples unidades, el total a pagar será el precio unitario calculado multiplicado por la cantidad solicitada.

## Notas Importantes

1. El campo `total_cost` representa el monto exacto que se debe cobrar al cliente **por unidad** del producto.
2. Si el cliente pide múltiples unidades, debe pagar: `total_cost × cantidad_solicitada`
3. Los costos de envío se calculan y cobran por separado al momento de la recogida.
4. La detección automática de la tienda mejora la precisión del cálculo.
5. Si una tienda está registrada en la base de datos, se usa su `tax_rate` configurado.
6. Los impuestos adicionales permiten agregar costos extras según sea necesario.
7. **La cantidad del producto NO afecta el cálculo del precio unitario.**

## Fecha de Implementación

6 de noviembre de 2025
