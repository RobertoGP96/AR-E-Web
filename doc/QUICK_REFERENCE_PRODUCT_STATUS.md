# ⚡ GUÍA RÁPIDA: SISTEMA DE ESTADOS DE PRODUCTOS

**Última actualización:** 6 de febrero de 2026  
**Status:** ✓ COMPLETAMENTE VALIDADO (17/17 pruebas)

---

## 🎯 REGLA DE ORO

> **Un producto solo puede transicionar de estado si TODAS las dependencias anteriores están cumplidas**

```
ENCARGADO
    ↓ (Si compra completa)
COMPRADO
    ↓ (Si recepción completa)
RECIBIDO
    ↓ (Si entrega completa)
ENTREGADO
```

---

## ✅ TABLA DE REFERENCIA RÁPIDA

### Estados y Sus Requisitos

| Estado | Requisitos | Ejemplo |
|--------|-----------|---------|
| **ENCARGADO** | Sin compra (< 100%) | 0/10 unidades compradas |
| **COMPRADO** | Compra 100%, Recepción < 100% | 10 compradas, 0-9 recibidas |
| **RECIBIDO** | Compra 100%, Recepción 100%, Entrega < 100% | 10 compradas, 10 recibidas, 0-9 entregadas |
| **ENTREGADO** | Compra 100%, Recepción 100%, Entrega 100% | 10 compradas, 10 recibidas, 10 entregadas |

---

## 🚫 Transiciones INVÁLIDAS (Automáticamente bloqueadas)

| Intento | Bloqueo | Resultado |
|---------|---------|-----------|
| Ir a RECIBIDO sin compra completa | Sí | Mantiene COMPRADO |
| Ir a ENTREGADO sin recepción completa | Sí | Mantiene RECIBIDO |
| Entregar sin recibir nada | Sí | Mantiene COMPRADO |
| Saltar estados (COMPRADO → ENTREGADO) | Sí | Mantiene COMPRADO |

---

## 💻 Comandos Útiles

```bash
# Ver estado de TODOS los productos
python manage.py diagnose_product_status --verbose

# Ver estado de UN producto
python manage.py diagnose_product_status --product-id abc123 --verbose

# Corregir inconsistencias automáticamente
python manage.py diagnose_product_status --fix

# Ejecutar todas las pruebas de validación
python scripts/test_product_status_dependencies.py
```

---

## 📊 Ejemplos Prácticos

### ✓ FLUJO CORRECTO

```
Orden: "Comprar 10 iPhones"

1. Crear ProductBuyed(amount_buyed=10)
   Estado: ENCARGADO → COMPRADO (10/10 compradas)

2. Crear ProductReceived(amount_received=5)
   Estado: COMPRADO (10/10 compradas, 5/10 recibidas)

3. Crear ProductReceived(amount_received=5)
   Estado: COMPRADO → RECIBIDO (10/10 compradas, 10/10 recibidas)

4. Crear ProductDelivery(amount_delivered=10)
   Estado: RECIBIDO → ENTREGADO (10/10 entregadas)
```

### ✗ FLUJO BLOQUEADO

```
Intento: "Ir directamente a ENTREGADO sin recibir"

1. Crear ProductBuyed(amount_buyed=10)
   Estado: COMPRADO (10/10 compradas, 0/10 recibidas)

2. Crear ProductDelivery(amount_delivered=10)
   Sistema: "❌ No puedes entregar sin recibir primero"
   Estado: Permanece COMPRADO

Razón: amount_received (0) < amount_requested (10)
```

---

## 🔍 Validación de Dependencias

### Condición 1: RECIBIDO REQUIERE COMPRADO

```
Validación:
  ✓ amount_purchased >= amount_requested (Todo comprado)
  ✓ amount_received >= amount_requested (Todo recibido)
  ✓ amount_delivered < amount_received (Falta entregar)

Ejemplo válido:
  Compra: 10/10 ✓
  Recepción: 10/10 ✓
  Entrega: 0-9/10 ✓
  → Estado: RECIBIDO

Ejemplo inválido:
  Compra: 5/10 ✗ (Falta comprar)
  Recepción: 10/10
  Entrega: 0/10
  → Estado: BLOQUEADO (Permanece ENCARGADO)
```

### Condición 2: ENTREGADO REQUIERE RECIBIDO

```
Validación:
  ✓ amount_purchased >= amount_requested (Todo comprado)
  ✓ amount_received >= amount_requested (Todo recibido)
  ✓ amount_delivered >= amount_received (Todo entregado)

Ejemplo válido:
  Compra: 10/10 ✓
  Recepción: 10/10 ✓
  Entrega: 10/10 ✓
  → Estado: ENTREGADO

Ejemplo inválido:
  Compra: 10/10 ✓
  Recepción: 5/10 ✗ (Falta recibir)
  Entrega: 10/10
  → Estado: BLOQUEADO (Permanece COMPRADO)
```

---

## 💰 Reembolsos y Reversiones

### Cuando hay Reembolso

```
Situación: Compra de 10, reembolso de 2

ANTES:
  Estado: COMPRADO
  Compra: 10/10
  Recepción: 0/10

REEMBOLSO: quantity_refuned = 2

RECALCULACIÓN:
  Nueva compra: 10 - 2 = 8/10
  Comprobación: 8 < 10 ✗ (Ya no está COMPRADO)
  
DESPUÉS:
  Estado: ENCARGADO (Automáticamente revertido)
  Compra: 8/10
  Recepción: 0/10
```

---

## 📋 Verificar el Sistema

### Paso 1: Ejecutar diagnóstico
```bash
cd backend
python manage.py diagnose_product_status --verbose
```

Busca líneas como:
- "Estado calculado coincide con estado almacenado" = ✓ OK
- "inconsistencia detectada" = ⚠️ Revisar

### Paso 2: Si hay inconsistencias, corregir
```bash
python manage.py diagnose_product_status --fix
```

### Paso 3: Verificar que se corrigieron
```bash
python manage.py diagnose_product_status --verbose
```

Todos deberían mostrar "✓ OK"

---

## 🧪 Pruebas de Validación

### Ejecutar todas las pruebas
```bash
python scripts/test_product_status_dependencies.py
```

Resultado esperado:
```
✓ TODAS LAS DEPENDENCIAS DE ESTADO ESTÁN CORRECTAMENTE IMPLEMENTADAS
✓ RESUMEN: 17/17 pruebas PASARON
```

### Interpretar resultados

| Resultado | Significado |
|-----------|-------------|
| 17/17 PASARON | ✓ Sistema funcionando correctamente |
| Alguna falla | ✗ Hay un problema, revisar la salida |

---

## 📞 Preguntas Frecuentes

### P: ¿Puedo hacer que un producto vaya directamente a ENTREGADO?
**R:** No. El sistema bloquea automáticamente cualquier intento. Debe pasar por:
1. COMPRADO (después de compra completa)
2. RECIBIDO (después de recepción completa)
3. ENTREGADO (después de entrega completa)

### P: ¿Qué pasa si intento entregar sin recibir?
**R:** El sistema lo bloquea automáticamente. El estado permanece en COMPRADO.

### P: ¿Cómo se revierten los estados?
**R:** Automáticamente cuando hay reembolsos o devoluciones. Ejemplo:
- Si hay reembolso durante COMPRADO → vuelve a ENCARGADO
- Si hay devolución durante RECIBIDO → vuelve a COMPRADO

### P: ¿Dónde veo los logs de cambios de estado?
**R:** En los logs de Django bajo "ProductStatusService":
```bash
tail -f backend/logs/django.log | grep ProductStatusService
```

### P: ¿Cómo reporto un problema con los estados?
**R:** 
1. Anota el ID del producto
2. Ejecuta: `python manage.py diagnose_product_status --product-id <ID> --verbose`
3. Incluye la salida en el reporte

---

## ✅ Checklist: ¿Está todo funcionando?

- [ ] Todos los productos tienen estados válidos
- [ ] No hay productos en estado inválido
- [ ] Los cambios de estado se registran en logs
- [ ] Las pruebas pasan: `test_product_status_dependencies.py`
- [ ] El comando `diagnose_product_status` funciona
- [ ] Se pueden ver cambios en el dashboard

---

## 🚨 Soporte de Emergencia

Si algo falla:

1. **Ejecuta diagnóstico:**
   ```bash
   python manage.py diagnose_product_status --verbose
   ```

2. **Si hay inconsistencias, intenta reparar:**
   ```bash
   python manage.py diagnose_product_status --fix
   ```

3. **Verifica que funcionó:**
   ```bash
   python manage.py diagnose_product_status --verbose
   ```

4. **Si persiste el problema, revisa logs:**
   ```bash
   grep ERROR backend/logs/django.log
   ```

---

**Estado del sistema:** ✓ OPERACIONAL Y VALIDADO  
**Última validación:** 6 de febrero de 2026  
**Próxima revisión:** Después de 48 horas en producción
