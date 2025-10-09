# Reporte de Inconsistencias de Tipos

## 📋 Resumen Ejecutivo

Este documento detalla las inconsistencias encontradas entre los tipos TypeScript del **Admin**, **Client** y los modelos del **Backend (Django)**.

**Fecha de análisis:** 9 de octubre de 2025

---

## 🚨 Inconsistencias Críticas

### 1. **Estados (Enums) - CRÍTICO**

#### ❌ Admin vs Backend - **NO COINCIDEN**

**Admin** (`apps/admin/src/types/models/base.ts`):
```typescript
export type OrderStatus = "Ordered" | "Processing" | "Completed" | "Cancelled";
export type PayStatus = "Unpaid" | "Paid" | "Partial";
export type ProductStatus = "Ordered" | "Purchased" | "Received" | "Delivered";
export type ShoppingStatus = "Unpaid" | "Paid" | "Processing";
export type DeliveryStatus = "Sent" | "In Transit" | "Delivered";
export type PackageStatus = "Sent" | "Processed" | "Received";
```

**Backend** (`backend/api/enums.py`):
```python
OrderStatusEnum = "Encargado" | "Procesando" | "Completado" | "Cancelado"
PaymentStatusEnum = "No pagado" | "Pagado" | "Parcial"
DeliveryStatusEnum = "Pendiente" | "En transito" | "Entregado" | "Fallida"
```

**Client** (`apps/client/src/types/base.ts`) - ✅ **CORRECTO**:
```typescript
export type OrderStatus = "Encargado" | "Procesando" | "Completado" | "Cancelado";
export type PayStatus = "No pagado" | "Pagado" | "Parcial";
export type ProductStatus = "Encargado" | "Procesando" | "Completado" | "Cancelado";
export type DeliveryStatus = "Pendiente" | "En transito" | "Entregado" | "Fallida";
```

**⚠️ IMPACTO:** El Admin enviará valores en inglés que el backend no reconocerá, causando errores 400.

---

### 2. **Modelo Product - Campos Faltantes**

#### Admin - Campos Faltantes en `Product`:
```typescript
// ❌ FALTA en Admin
amount_purchased: number;  // Existe en backend y client
amount_delivered: number;  // Existe en backend y client

// ❌ FALTAN propiedades computadas en Admin
pending_purchase: number;
pending_delivery: number;
is_fully_purchased: boolean;
is_fully_delivered: boolean;
```

**Backend** (`backend/api/models.py`):
```python
class Product(models.Model):
    amount_requested = models.IntegerField()
    amount_purchased = models.IntegerField(default=0)  # ✅ Existe
    amount_delivered = models.IntegerField(default=0)  # ✅ Existe
    
    @property
    def pending_purchase(self): ...  # ✅ Existe
    
    @property
    def pending_delivery(self): ...  # ✅ Existe
```

**Client** (`apps/client/src/types/product.d.ts`) - ✅ **CORRECTO**:
```typescript
amount_requested: number;
amount_purchased: number;  // ✅ Tiene
amount_delivered: number;  // ✅ Tiene

// Propiedades computadas
pending_purchase: number;
pending_delivery: number;
is_fully_purchased: boolean;
is_fully_delivered: boolean;
```

---

### 3. **Modelo Order - Campos Faltantes**

#### Admin - Campos Faltantes:
```typescript
// ❌ FALTAN en Admin
total_products_requested: number;
total_products_purchased: number;
total_products_delivered: number;
```

**Backend** (`backend/api/models.py`):
```python
@property
def total_products_requested(self): ...  # ✅ Existe

@property
def total_products_purchased(self): ...  # ✅ Existe

@property
def total_products_delivered(self): ...  # ✅ Existe
```

**Client** (`apps/client/src/types/order.d.ts`) - ✅ **CORRECTO**:
```typescript
total_products_requested: number;
total_products_purchased: number;
total_products_delivered: number;
```

---

### 4. **Modelo DeliverReceip - Campos Faltantes**

#### Admin - Campos Faltantes:
```typescript
// ❌ FALTAN en Admin
weight_cost: number;
manager_profit: number;
```

**Backend** (`backend/api/models.py`):
```python
class DeliverReceip(models.Model):
    weight_cost = models.FloatField(default=0)  # ✅ Existe
    manager_profit = models.FloatField(default=0)  # ✅ Existe
```

**Client** - ⚠️ **TAMBIÉN FALTA** (ambos necesitan corrección)

---

### 5. **Modelo BuyingAccount - Campo Faltante**

#### Admin - Campo Faltante:
```typescript
// ❌ FALTA en Admin
shop: Shop;  // Relación con Shop
```

**Backend** (`backend/api/models.py`):
```python
class BuyingAccounts(models.Model):
    shop = models.ForeignKey('Shop', ...)  # ✅ Existe
```

**Client** - ⚠️ **TAMBIÉN FALTA**

---

### 6. **Modelo Shop - Campos Faltantes**

#### Admin - Tiene campos que NO existen en backend:
```typescript
// ❌ NO EXISTEN en backend
description?: string;
location?: string;
```

**Backend** (`backend/api/models.py`):
```python
class Shop(models.Model):
    name = models.CharField(max_length=100, unique=True)
    link = models.URLField(unique=True)
    is_active = models.BooleanField(default=True)
    # ❌ NO tiene description ni location
```

---

### 7. **Modelo CustomUser - Diferencias**

#### Admin - Campo adicional no estándar:
```typescript
user_id?: ID; // Alias para la API de Django
```

**Backend** - Solo usa `id`, no `user_id`

**Client** - ✅ No tiene `user_id`, usa solo `id` (correcto)

---

### 8. **Modelo CommonInformation - Campos Faltantes**

#### Admin y Client - Faltan timestamps:
```typescript
// ❌ FALTAN en Admin y Client
created_at: DateTime;
updated_at: DateTime;
```

**Backend**:
```python
created_at = models.DateTimeField(default=timezone.now)
updated_at = models.DateTimeField(auto_now=True)
```

---

### 9. **Modelo EvidenceImage - Campo Faltante**

#### Admin y Client - Falta descripción:
```typescript
// ❌ FALTA en ambos
description?: string;
```

**Backend**:
```python
description = models.CharField(max_length=255, blank=True, null=True)
```

---

### 10. **Modelo Package - Timestamps Faltantes**

#### Admin - Tiene timestamps ✅
```typescript
created_at: string;
updated_at: string;
```

#### Client - ❌ NO tiene timestamps

---

## 📊 Resumen de Diferencias

| Modelo | Admin | Client | Backend | Estado |
|--------|-------|--------|---------|--------|
| **OrderStatus** | ❌ Inglés | ✅ Español | ✅ Español | **CRÍTICO - Admin debe corregirse** |
| **PayStatus** | ❌ Inglés | ✅ Español | ✅ Español | **CRÍTICO - Admin debe corregirse** |
| **ProductStatus** | ❌ Inglés + diferente | ✅ Español | ✅ Español | **CRÍTICO - Admin debe corregirse** |
| **DeliveryStatus** | ❌ Inglés + diferente | ✅ Español | ✅ Español | **CRÍTICO - Admin debe corregirse** |
| **Product.amount_purchased** | ❌ Falta | ✅ Existe | ✅ Existe | Admin debe agregar |
| **Product.amount_delivered** | ❌ Falta | ✅ Existe | ✅ Existe | Admin debe agregar |
| **Product.pending_purchase** | ❌ Falta | ✅ Existe | ✅ Existe | Admin debe agregar |
| **Product.pending_delivery** | ❌ Falta | ✅ Existe | ✅ Existe | Admin debe agregar |
| **Order totals** | ❌ Falta | ✅ Existe | ✅ Existe | Admin debe agregar |
| **DeliverReceip.weight_cost** | ❌ Falta | ❌ Falta | ✅ Existe | Ambos deben agregar |
| **DeliverReceip.manager_profit** | ❌ Falta | ❌ Falta | ✅ Existe | Ambos deben agregar |
| **BuyingAccount.shop** | ❌ Falta | ❌ Falta | ✅ Existe | Ambos deben agregar |
| **Shop.description** | ⚠️ Existe | ⚠️ Existe | ❌ No existe | Eliminar o agregar al backend |
| **Shop.location** | ⚠️ Existe | ⚠️ Existe | ❌ No existe | Eliminar o agregar al backend |
| **EvidenceImage.description** | ❌ Falta | ❌ Falta | ✅ Existe | Ambos deben agregar |
| **Package.timestamps** | ✅ Existe | ❌ Falta | ✅ Existe | Client debe agregar |
| **CommonInfo.timestamps** | ❌ Falta | ❌ Falta | ✅ Existe | Ambos deben agregar |

---

## 🔧 Acciones Recomendadas

### Prioridad ALTA (Bloquea funcionalidad):

1. **Corregir todos los enums en Admin** para que coincidan con el backend (español)
2. **Agregar `amount_purchased` y `amount_delivered` al tipo Product en Admin**
3. **Agregar propiedades computadas de Product en Admin**
4. **Agregar totales de productos al tipo Order en Admin**

### Prioridad MEDIA:

5. Agregar `weight_cost` y `manager_profit` a DeliverReceip (Admin y Client)
6. Agregar `shop` a BuyingAccount (Admin y Client)
7. Decidir sobre `description` y `location` en Shop (eliminar de frontend o agregar al backend)
8. Agregar `description` a EvidenceImage (Admin y Client)

### Prioridad BAJA:

9. Agregar timestamps a Package en Client
10. Agregar timestamps a CommonInformation (Admin y Client)
11. Eliminar o estandarizar el uso de `user_id` en Admin

---

## 💡 Conclusión

**El Client está mucho mejor alineado con el Backend que el Admin.** 

El Admin tiene errores críticos en los enums que impedirán el correcto funcionamiento de la aplicación. Se recomienda:

1. Copiar los tipos de base del Client al Admin (especialmente los enums)
2. Revisar y actualizar todos los modelos del Admin basándose en los del Client
3. Mantener ambos frontends sincronizados con el backend en el futuro

---

## 📝 Notas Adicionales

- Los serializers del backend usan `email` como slug_field para relaciones de usuario, pero a veces el email puede ser opcional/null
- El backend tiene una inconsistencia en `ProductReceived.original_product_id` (debería ser UUID, no ID)
- Considerar crear tipos compartidos entre Admin y Client para evitar duplicación
