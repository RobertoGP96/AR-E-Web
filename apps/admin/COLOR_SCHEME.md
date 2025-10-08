# 🎨 Esquema de Colores - Aplicación Admin

## 📋 Resumen

La aplicación utiliza un **tema claro profesional** con una paleta basada en **Naranja, Gris y Blanco**, diseñada para ser limpia, moderna y fácil de leer.

---

## 🌟 Tema Claro (Principal)

### **Paleta de Colores Base**

| Categoría | Color | oklch | Uso |
|-----------|-------|-------|-----|
| **Fondo** | Blanco casi puro | `oklch(99% 0 0)` | Fondo principal de la app |
| **Texto** | Gris muy oscuro | `oklch(25% 0.01 270)` | Texto principal |
| **Tarjetas** | Blanco puro | `oklch(100% 0 0)` | Superficies elevadas |

---

## 🔶 Color Primario - Naranja

### **Uso Principal:**
- Botones primarios
- Enlaces importantes
- Items activos en navegación
- Indicadores de selección
- Call-to-actions

### **Valores:**
```css
--primary: oklch(62% 0.20 40); /* Naranja vibrante profesional */
--primary-foreground: oklch(100% 0 0); /* Blanco para contraste */
```

### **Ejemplos de Uso:**
```tsx
// Botón primario
<Button className="bg-primary text-primary-foreground">
  Guardar
</Button>

// Item activo en navegación
className="bg-gradient-to-r from-orange-500 to-amber-500"
```

---

## ⚪ Grises - Neutrales

### **Escala de Grises:**

| Nombre | oklch | Uso |
|--------|-------|-----|
| **Gris Muy Claro** | `oklch(95% 0.005 270)` | Fondos secundarios, hover suaves |
| **Gris Claro** | `oklch(87% 0.005 270)` | Bordes, separadores |
| **Gris Medio** | `oklch(50% 0.01 270)` | Texto secundario, placeholders |
| **Gris Oscuro** | `oklch(25% 0.01 270)` | Texto principal |

### **Uso:**
- **Texto secundario:** Información complementaria, timestamps
- **Bordes:** Separadores, inputs
- **Fondos secundarios:** Secciones alternadas
- **Hover states:** Estados de interacción suaves

---

## 🎯 Colores Secundarios

### **Secondary - Gris Muy Claro**
```css
--secondary: oklch(92% 0.005 270);
--secondary-foreground: oklch(30% 0.01 270);
```
**Uso:** Botones secundarios, badges informativos

### **Accent - Naranja Claro**
```css
--accent: oklch(88% 0.08 45);
--accent-foreground: oklch(30% 0.01 270);
```
**Uso:** Fondos hover naranja suaves, estados de hover

### **Muted - Gris Muy Claro**
```css
--muted: oklch(95% 0.005 270);
--muted-foreground: oklch(50% 0.01 270);
```
**Uso:** Elementos deshabilitados, información secundaria

---

## 🚨 Color Destructivo - Rojo Coral

### **Uso:**
- Botones de eliminación
- Mensajes de error
- Alertas críticas

### **Valores:**
```css
--destructive: oklch(58% 0.20 25);
--destructive-foreground: oklch(100% 0 0);
```

### **Ejemplo:**
```tsx
<Button variant="destructive">
  Eliminar
</Button>
```

---

## 📊 Colores para Gráficos

### **Paleta de Charts:**

| Chart | Color | oklch | Descripción |
|-------|-------|-------|-------------|
| **Chart 1** | Naranja Primario | `oklch(62% 0.20 40)` | Color principal |
| **Chart 2** | Naranja Oscuro | `oklch(55% 0.18 30)` | Contraste |
| **Chart 3** | Naranja Claro | `oklch(70% 0.15 50)` | Variación clara |
| **Chart 4** | Gris Medio | `oklch(55% 0.01 270)` | Neutro |
| **Chart 5** | Ámbar Suave | `oklch(75% 0.12 60)` | Complementario |

---

## 🎨 Sidebar

### **Configuración:**
- **Fondo:** Gris casi blanco `oklch(97% 0.005 270)`
- **Texto:** Gris oscuro `oklch(30% 0.01 270)`
- **Item Activo:** Naranja primario con fondo degradado
- **Hover:** Naranja claro `oklch(90% 0.08 45)`
- **Borde:** Gris claro `oklch(90% 0.005 270)`

### **Implementación:**
```tsx
// Item activo
<Link className={cn(
  active 
    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
    : "text-gray-700 hover:bg-orange-50"
)}>
```

---

## 🖼️ Ejemplos de Componentes

### **1. Botón Primario**
```tsx
<Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
  Acción Principal
</Button>
```
**Resultado:** Botón naranja con texto blanco

---

### **2. Botón Secundario**
```tsx
<Button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
  Acción Secundaria
</Button>
```
**Resultado:** Botón gris claro con texto oscuro

---

### **3. Card**
```tsx
<Card className="bg-card border border-border">
  <CardHeader className="text-card-foreground">
    Título
  </CardHeader>
</Card>
```
**Resultado:** Tarjeta blanca con borde gris claro

---

### **4. Input**
```tsx
<Input 
  className="bg-input border-border focus:ring-ring"
  placeholder="Escribe aquí..."
/>
```
**Resultado:** Input con fondo gris muy claro y focus naranja

---

### **5. Badge**
```tsx
// Badge primario
<Badge className="bg-primary text-primary-foreground">
  Nuevo
</Badge>

// Badge secundario
<Badge className="bg-secondary text-secondary-foreground">
  Activo
</Badge>
```

---

### **6. Navegación Activa**
```tsx
<Link className={cn(
  "flex items-center gap-3 px-4 py-3 rounded-xl",
  active
    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg"
    : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
)}>
  <Icon />
  <span>Dashboard</span>
</Link>
```

---

### **7. Dropdown Hover**
```tsx
<DropdownMenuItem className="hover:bg-orange-50 group">
  <Settings className="text-gray-500 group-hover:text-orange-600" />
  <span className="group-hover:text-orange-700">Configuración</span>
</DropdownMenuItem>
```

---

## 🎯 Reglas de Uso

### ✅ **Hacer:**
- Usar naranja para acciones principales y elementos activos
- Usar gris para texto secundario y bordes
- Usar blanco para fondos principales y tarjetas
- Mantener contraste WCAG AA (mínimo 4.5:1 para texto)
- Usar degradados naranja-ámbar para elementos destacados

### ❌ **Evitar:**
- No usar naranja en texto sobre fondo blanco directo (usar el valor primary)
- No mezclar muchos tonos de naranja diferentes
- No usar colores saturados en grandes áreas
- No usar bordes muy oscuros en tema claro

---

## 📱 Responsividad

Los colores se mantienen consistentes en todos los tamaños de pantalla. Las únicas variaciones son:
- **Estados hover:** Más visibles en desktop
- **Focus states:** Más prominentes en mobile
- **Touch targets:** Mayor padding en mobile

---

## 🔄 Estados Interactivos

### **Estados de Botón:**
```css
/* Normal */
bg-primary text-primary-foreground

/* Hover */
hover:bg-primary/90 hover:shadow-lg

/* Focus */
focus:ring-4 focus:ring-ring/20

/* Disabled */
disabled:opacity-50 disabled:cursor-not-allowed
```

### **Estados de Input:**
```css
/* Normal */
bg-input border-border

/* Focus */
focus:ring-2 focus:ring-ring focus:border-primary

/* Error */
border-destructive focus:ring-destructive
```

---

## 🎨 Gradientes Predefinidos

### **1. Primario - Naranja a Ámbar**
```css
bg-gradient-to-r from-orange-500 to-amber-500
```
**Uso:** Botones principales, items activos, headers importantes

### **2. Hover - Naranja Oscuro a Ámbar Oscuro**
```css
hover:from-orange-600 hover:to-amber-600
```
**Uso:** Estado hover de gradientes primarios

### **3. Background - Naranja Claro a Gris**
```css
bg-gradient-to-br from-orange-100 to-gray-500
```
**Uso:** Fondos de páginas de login o landing

### **4. Avatar - Naranja Claro a Ámbar**
```css
bg-gradient-to-r from-orange-400 to-amber-500
```
**Uso:** Avatares sin imagen, badges especiales

---

## 📐 Radios y Espaciados

```css
--radius: 0.75rem; /* 12px - Radio base */
--radius-sm: 0.5rem; /* 8px */
--radius-md: 0.625rem; /* 10px */
--radius-lg: 0.75rem; /* 12px */
--radius-xl: 1rem; /* 16px */
```

---

## 🌙 Tema Oscuro (Futuro)

Actualmente la aplicación está optimizada para tema claro. El tema oscuro está preparado en el CSS pero no activado. Si se requiere en el futuro, ya está configurado con:
- Fondos grises oscuros
- Naranja más brillante para mejor visibilidad
- Contraste adecuado para lectura nocturna

---

## 📊 Accesibilidad

### **Contraste de Colores:**
- ✅ **Primario sobre Blanco:** No usar directamente
- ✅ **Primario con Foreground:** 6.2:1 (AAA)
- ✅ **Texto sobre Fondo:** 8.5:1 (AAA)
- ✅ **Gris Medio sobre Blanco:** 5.1:1 (AA)

### **Recomendaciones:**
- Usar siempre `primary-foreground` sobre `primary`
- No depender solo del color para información crítica
- Incluir iconos junto a estados de color
- Probar con simuladores de daltonismo

---

## 🛠️ Personalización

Para cambiar colores específicos, editar `apps/admin/src/index.css`:

```css
:root {
  /* Cambiar color primario */
  --primary: oklch(62% 0.20 40); /* Modificar aquí */
  
  /* Cambiar gris de fondo */
  --background: oklch(99% 0 0); /* Modificar aquí */
}
```

**Nota:** Usar siempre formato `oklch()` para mantener consistencia perceptual.

---

## 📝 Clases de Tailwind Equivalentes

| Variable CSS | Tailwind Aproximado |
|--------------|---------------------|
| `--primary` | `orange-500` |
| `--secondary` | `gray-100` |
| `--muted` | `gray-50` |
| `--border` | `gray-200` |
| `--destructive` | `red-500` |

**Nota:** Se recomienda usar las variables CSS para mantener consistencia.

---

*Última actualización: 8 de octubre de 2025*
