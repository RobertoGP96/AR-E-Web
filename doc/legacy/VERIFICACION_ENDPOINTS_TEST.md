## 🧪 SCRIPT DE VERIFICACIÓN RÁPIDA

### Opción 1: Verificación con curl (Terminal)

```bash
# 1️⃣ Test local (desarrollo)
curl -X GET "http://localhost:8000/arye_system/api_data/order/my-orders/?page=1&per_page=20" \
  -H "Authorization: Bearer <tu-token-jwt>" \
  -H "Accept: application/json"

# 2️⃣ Test producción (Render)
curl -X GET "https://ar-e-web.onrender.com/arye_system/api_data/order/my-orders/?page=1&per_page=20" \
  -H "Authorization: Bearer <tu-token-jwt>" \
  -H "Accept: application/json"

# 3️⃣ Test entregas local
curl -X GET "http://localhost:8000/arye_system/api_data/delivery_receips/my-deliveries/?page=1&per_page=20" \
  -H "Authorization: Bearer <tu-token-jwt>" \
  -H "Accept: application/json"

# 4️⃣ Test entregas producción
curl -X GET "https://ar-e-web.onrender.com/arye_system/api_data/delivery_receips/my-deliveries/?page=1&per_page=20" \
  -H "Authorization: Bearer <tu-token-jwt>" \
  -H "Accept: application/json"
```

---

### Opción 2: Verificación con Postman

#### Setup en Postman:

1. **Crear variable de entorno:**
   - Variables → New Variable
   - Name: `API_TOKEN`
   - Value: `<tu-token-jwt>`
   - Save

2. **Crear requests:**

**Request 1: Mis Órdenes (Local)**
```
GET http://localhost:8000/arye_system/api_data/order/my-orders/?page=1&per_page=20

Headers:
- Authorization: Bearer {{API_TOKEN}}
- Accept: application/json
```

**Request 2: Mis Órdenes (Producción)**
```
GET https://ar-e-web.onrender.com/arye_system/api_data/order/my-orders/?page=1&per_page=20

Headers:
- Authorization: Bearer {{API_TOKEN}}
- Accept: application/json
```

**Request 3: Mis Entregas (Local)**
```
GET http://localhost:8000/arye_system/api_data/delivery_receips/my-deliveries/?page=1&per_page=20

Headers:
- Authorization: Bearer {{API_TOKEN}}
- Accept: application/json
```

**Request 4: Mis Entregas (Producción)**
```
GET https://ar-e-web.onrender.com/arye_system/api_data/delivery_receips/my-deliveries/?page=1&per_page=20

Headers:
- Authorization: Bearer {{API_TOKEN}}
- Accept: application/json
```

---

### Opción 3: Verificación desde DevTools (Frontend)

1. Abre la app en el navegador
2. Abre DevTools (F12)
3. Ve a la pestaña **Network**
4. Navega a `/my-orders` o `/my-deliveries`
5. Busca las requests con estos nombres:
   - `my-orders` - debe mostrar status **200** (no 404)
   - `my-deliveries` - debe mostrar status **200** (no 404)
6. Haz click en la request y verifica:
   - **Request URL:** Debe ser `/arye_system/api_data/order/my-orders/` o `/delivery_receips/my-deliveries/`
   - **Status:** 200 OK
   - **Response:** JSON con datos de órdenes/entregas

---

### Opción 4: Verificación JavaScript (Console)

En el navegador, abre la console (F12 → Console) y ejecuta:

```javascript
// Obtener el token (si está guardado en localStorage)
const token = localStorage.getItem('access_token');

// Test - Mis Órdenes
fetch('https://ar-e-web.onrender.com/arye_system/api_data/order/my-orders/?page=1&per_page=20', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  }
})
.then(res => {
  console.log('Status:', res.status);
  console.log('OK:', res.ok);
  return res.json();
})
.then(data => console.log('Órdenes:', data))
.catch(err => console.error('Error:', err));

// Test - Mis Entregas
fetch('https://ar-e-web.onrender.com/arye_system/api_data/delivery_receips/my-deliveries/?page=1&per_page=20', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  }
})
.then(res => {
  console.log('Status:', res.status);
  console.log('OK:', res.ok);
  return res.json();
})
.then(data => console.log('Entregas:', data))
.catch(err => console.error('Error:', err));
```

---

### 📊 Respuestas Esperadas

#### ✅ Si funciona (Status 200):

**Mis Órdenes:**
```json
{
  "count": 5,
  "next": "https://...",
  "previous": null,
  "results": [
    {
      "id": 1,
      "customer": "Cliente X",
      "status": "pendiente",
      "total": 150.00,
      "created_at": "2024-01-15T10:30:00Z"
    },
    ...
  ]
}
```

**Mis Entregas:**
```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "order": 1,
      "client": "Cliente X",
      "status": "entregada",
      "tracking": "TRK123456",
      "created_at": "2024-01-15T11:00:00Z"
    },
    ...
  ]
}
```

#### ❌ Si no funciona (Status 404):

```json
{
  "detail": "Not found."
}
```

**O en los headers:**
```
HTTP/1.1 404 Not Found
Content-Type: application/json
```

---

### 🐛 Debugging en caso de Error

Si sigues recibiendo **404**:

1. **Verificar URL exacta:**
   - Abre DevTools → Network
   - Copia la URL exacta de la request fallida
   - Compara con las URLs esperadas:
     - ✅ `/arye_system/api_data/order/my-orders/`
     - ✅ `/arye_system/api_data/delivery_receips/my-deliveries/`

2. **Verificar Authorization:**
   - Token debe tener formato: `Bearer <token>`
   - Si error es 401: Token expirado o inválido
   - Si error es 403: Permisos insuficientes

3. **Verificar CORS:**
   - Si ves error en Console como `CORS: ...`
   - Backend no tiene el dominio del frontend en `CORS_ALLOWED_ORIGINS`

4. **Verificar variables de entorno:**
   - En Vercel: Settings → Environment Variables
   - Confirmar: `VITE_API_URL=https://ar-e-web.onrender.com`

---

### 🔍 Checklist de Verificación

- [ ] URL local funciona: `http://localhost:8000/arye_system/api_data/order/my-orders/`
- [ ] URL producción funciona: `https://ar-e-web.onrender.com/arye_system/api_data/order/my-orders/`
- [ ] Token JWT válido incluido en Authorization header
- [ ] Status 200 OK (no 404, 401 o 403)
- [ ] Respuesta contiene JSON con datos de órdenes
- [ ] URL entregas corregida a `/delivery_receips/my-deliveries/`
- [ ] Entregas también retornan 200 OK
- [ ] Frontend renderiza datos correctamente

---

## 📝 Notas Importantes

1. **`<tu-token-jwt>`** = Reemplaza con un token real
   - Puedes obtener uno haciendo login en la app
   - Luego ve a DevTools → Application → Local Storage → `access_token`

2. **Ambiente Local** = Cambia `https://ar-e-web.onrender.com` por `http://localhost:8000`

3. **Si todo funciona** pero frontend aún muestra error:
   - Limpia caché del navegador
   - Hard refresh: Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)
   - Verifica console (F12) para errores JavaScript

4. **Si hay error de CORS:**
   - Puede ignorarse en desarrollo local
   - En producción, backend debe tener frontend en `CORS_ALLOWED_ORIGINS`
