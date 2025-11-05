# Actualización del Modelo DeliverReceip - Agregar Campo Cliente

Este documento describe los cambios realizados para agregar un campo `client` directo al modelo `DeliverReceip`, permitiendo que los deliveries tengan un cliente asignado independientemente de si tienen un pedido asociado.

## Cambios en el Backend

### 1. Modelo `DeliverReceip` (`backend/api/models.py`)

Se agregó un nuevo campo `client` al modelo:

```python
class DeliverReceip(models.Model):
    """Receipt given periodically to user every time they get products"""
    
    client = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="deliveries",
        limit_choices_to={'role': 'client'},
        help_text='Cliente al que pertenece el delivery',
        null=True, blank=True  # Nullable para permitir migración
    )
    order = models.ForeignKey(
        Order, on_delete=models.SET_NULL, related_name="delivery_receipts",
        null=True, blank=True
    )
    # ... resto de campos
```

**Características:**
- El campo `client` está vinculado al modelo `CustomUser`
- Solo permite usuarios con rol 'client'
- Es nullable y blank para permitir la migración de datos existentes
- Tiene una relación inversa `deliveries` en el modelo `CustomUser`

### 2. Serializer `DeliverReceipSerializer` (`backend/api/serializers.py`)

Se actualizó el serializer para incluir el campo `client`:

```python
class DeliverReceipSerializer(serializers.ModelSerializer):
    client = serializers.SlugRelatedField(
        queryset=CustomUser.objects.filter(role='client'),
        slug_field="id",
        required=False,
        allow_null=True,
        error_messages={
            "does_not_exist": "El cliente {value} no existe.",
            "invalid": "El valor proporcionado para el cliente no es válido.",
        },
    )
    # ... resto de campos
    
    class Meta:
        model = DeliverReceip
        fields = [
            "id",
            "client",  # Nuevo campo
            "order",
            # ... resto de campos
        ]
```

### 3. Script de Migración de Datos

Se creó un script para migrar los deliveries existentes:

**Archivo:** `backend/migrate_delivery_clients.py`

Este script:
- Encuentra todos los deliveries sin cliente asignado
- Asigna el cliente del pedido asociado al campo `client`
- Reporta los deliveries que no pudieron ser actualizados

**Uso:**
```bash
cd backend
python migrate_delivery_clients.py
```

## Cambios en el Frontend

### 1. Tipo `DeliverReceip` (`apps/admin/src/types/models/delivery.ts`)

Se actualizó la interfaz para incluir el campo `client`:

```typescript
export interface DeliverReceip {
  id: ID;
  client?: CustomUser | null; // Nuevo campo
  order?: Order | null;
  weight: number;
  status: DeliveryStatus;
  // ... resto de campos
}

export interface CreateDeliverReceipData {
  client?: ID | null; // Nuevo campo
  order?: ID | null;
  weight: number;
  // ... resto de campos
}
```

### 2. Componente `CreateDeliveryDialog`

Se actualizó el formulario de creación para incluir un selector de cliente:

**Cambios principales:**
- Agregado selector de cliente (obligatorio)
- El campo de orden es ahora opcional
- Se utiliza el hook `useUsers` para obtener la lista de clientes
- Validación de cliente obligatoria antes de crear el delivery

**Nuevo flujo:**
1. Usuario selecciona un cliente (requerido)
2. Opcionalmente selecciona un pedido
3. Ingresa el peso y demás datos
4. El delivery se crea con el cliente directamente asignado

### 3. Componente `DeliveryTable`

Se actualizó la tabla para mostrar el cliente del delivery:

```typescript
<TableCell>
  {delivery.client ? (
    <AvatarUser user={delivery.client} />
  ) : delivery.order?.client ? (
    <AvatarUser user={delivery.order.client} />
  ) : (
    <span className="text-gray-400 text-sm italic">Sin cliente</span>
  )}
</TableCell>
```

**Prioridad de visualización:**
1. Cliente directo del delivery (`delivery.client`)
2. Cliente del pedido asociado (`delivery.order.client`)
3. Mensaje de "Sin cliente"

### 4. Componente `DeliveryDetail`

Se actualizó la página de detalles para mostrar correctamente la información del cliente:

```typescript
<Card>
  <CardHeader>
    <CardTitle>Cliente</CardTitle>
  </CardHeader>
  <CardContent>
    {delivery.client ? (
      <AvatarUser user={delivery.client} />
    ) : delivery.order?.client ? (
      <AvatarUser user={delivery.order.client} />
    ) : (
      <p>Sin cliente asociado</p>
    )}
  </CardContent>
</Card>
```

## Proceso de Migración

### Paso 1: Aplicar Cambios en el Backend

1. Los cambios en el modelo ya están aplicados
2. Crear la migración:
   ```bash
   cd backend
   python manage.py makemigrations
   ```

3. Aplicar la migración:
   ```bash
   python manage.py migrate
   ```

### Paso 2: Migrar Datos Existentes

Ejecutar el script de migración:
```bash
cd backend
python migrate_delivery_clients.py
```

Este script:
- Asignará el cliente del pedido a cada delivery existente
- Mostrará un reporte de los deliveries actualizados

### Paso 3: Verificar los Cambios

1. Verificar que los deliveries existentes tienen cliente asignado
2. Crear un nuevo delivery y verificar que se puede seleccionar el cliente
3. Verificar que la tabla muestra correctamente los clientes

## Beneficios de estos Cambios

1. **Independencia del Pedido**: Los deliveries pueden existir sin un pedido asociado
2. **Flexibilidad**: Se puede crear deliveries para cualquier cliente
3. **Claridad**: Es más claro a qué cliente pertenece cada delivery
4. **Consultas Eficientes**: Se puede filtrar deliveries por cliente directamente
5. **Compatibilidad**: Los deliveries existentes siguen funcionando (fallback a `order.client`)

## Endpoints Afectados

### POST `/api/delivery_receips/`
**Antes:**
```json
{
  "order": 123,
  "weight": 5.0,
  "status": "Pendiente"
}
```

**Ahora:**
```json
{
  "client": 456,
  "order": 123,  // opcional
  "weight": 5.0,
  "status": "Pendiente"
}
```

### GET `/api/delivery_receips/{id}/`
**Respuesta incluye ahora:**
```json
{
  "id": 1,
  "client": 456,
  "order": 123,
  "weight": 5.0,
  // ... resto de campos
}
```

## Consideraciones Futuras

### Opción 1: Hacer el Campo `client` Obligatorio
Una vez que todos los deliveries tengan cliente asignado, se puede hacer el campo obligatorio:

```python
client = models.ForeignKey(
    CustomUser, on_delete=models.CASCADE, related_name="deliveries",
    limit_choices_to={'role': 'client'},
    help_text='Cliente al que pertenece el delivery'
    # Quitar null=True, blank=True
)
```

### Opción 2: Eliminar Dependencia de `order.client`
Si se decide hacer obligatorio el campo `client`, se puede simplificar el código del frontend eliminando los fallbacks a `order.client`.

## Consultas Útiles

### Filtrar deliveries por cliente
```python
# Backend
DeliverReceip.objects.filter(client=cliente_id)
```

### Obtener todos los deliveries de un cliente
```python
# Backend
cliente = CustomUser.objects.get(id=cliente_id)
deliveries = cliente.deliveries.all()
```

### Contar deliveries por cliente
```python
# Backend
from django.db.models import Count
stats = CustomUser.objects.filter(role='client').annotate(
    total_deliveries=Count('deliveries')
)
```

## Notas Importantes

1. **Migración Reversible**: El campo es nullable, por lo que la migración es segura
2. **Datos Existentes**: El script de migración asegura que los datos existentes se mantengan consistentes
3. **Validación en Frontend**: El selector de cliente es obligatorio en el formulario de creación
4. **Compatibilidad**: El código mantiene compatibilidad con deliveries antiguos que solo tienen `order.client`

## Testing

### Casos de Prueba

1. **Crear delivery con cliente y pedido**
2. **Crear delivery solo con cliente (sin pedido)**
3. **Ver deliveries existentes (migrados)**
4. **Filtrar deliveries por cliente**
5. **Editar delivery y cambiar cliente**
6. **Ver detalles de delivery con cliente directo**
7. **Ver detalles de delivery sin cliente (fallback a order.client)**

## Soporte

Si encuentras algún problema con estos cambios:

1. Verifica que la migración se aplicó correctamente
2. Ejecuta el script de migración de datos
3. Verifica que los componentes del frontend se actualizaron
4. Revisa los logs del backend para errores de validación
