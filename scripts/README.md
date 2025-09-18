# Scripts de Desarrollo para AR-E Web

Este directorio contiene scripts para facilitar el desarrollo del monorepo.

## Scripts disponibles:

### `dev.bat` (Windows)
Script principal para desarrollo en Windows PowerShell.

**Uso:**
```powershell
# Iniciar todas las aplicaciones
.\scripts\dev.bat all

# Iniciar solo el cliente
.\scripts\dev.bat client

# Iniciar solo el admin
.\scripts\dev.bat admin

# Iniciar solo el backend
.\scripts\dev.bat backend
```

### `dev.sh` (Linux/macOS)
Script principal para desarrollo en sistemas Unix.

**Uso:**
```bash
# Hacer ejecutable (solo la primera vez)
chmod +x scripts/dev.sh

# Iniciar todas las aplicaciones
./scripts/dev.sh all

# Iniciar solo el cliente
./scripts/dev.sh client

# Iniciar solo el admin
./scripts/dev.sh admin

# Iniciar solo el backend
./scripts/dev.sh backend
```

## Configuración inicial:

1. **Instalar dependencias:**
   ```powershell
   pnpm install
   ```

2. **Configurar entorno Python (primera vez):**
   ```powershell
   cd backend
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   ```

3. **Configurar variables de entorno:**
   - Copiar `.env.example` a `.env.local`
   - Ajustar las variables según tu configuración

## Puertos por defecto:
- **Client:** http://localhost:5173
- **Admin:** http://localhost:5174
- **Backend:** http://localhost:8000
- **Backend Admin:** http://localhost:8000/admin