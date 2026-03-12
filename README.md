# AR-E Web — Shein Shop Management System

A full-stack pnpm monorepo for managing a Shein-based shop, covering product catalogs, order tracking, delivery logistics, financial reporting, and multi-role access control.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://reactjs.org/)
[![Django](https://img.shields.io/badge/Django-5.1-092E20?logo=django)](https://djangoproject.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev/)

---

## Architecture

Three separate applications in a single pnpm monorepo:

| App | Directory | Port | Deploy |
|-----|-----------|------|--------|
| Admin Panel | `apps/admin/` | 5173 | Cloudflare Pages |
| Client App | `apps/client/` | 5174 | Vercel |
| Backend API | `backend/` | 8000 | Render.com |

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, TypeScript, Vite 7, TailwindCSS 4, shadcn/ui, Radix UI, TanStack Query 5, React Hook Form, Zod, Recharts |
| Backend | Django 5.1, DRF 3.15, djangorestframework-simplejwt, drf-spectacular |
| Database | PostgreSQL (production), SQLite (development) |
| Storage | Cloudinary |
| Email | Resend |

---

## Key Features

- Multi-role system: admin, agent, accountant, logistical, client
- Product catalog management with Cloudinary image storage
- Order management and tracking
- Delivery logistics with QR codes
- Financial management: balance, invoices, expenses, profit reports
- Amazon product scraping
- Dashboard with analytics (Recharts)
- API documentation via Swagger UI and ReDoc

---

## Prerequisites

- Node.js 18+
- pnpm 8+
- Python 3.11+
- PostgreSQL (for production)

---

## Getting Started

```bash
# Clone the repository
git clone <repo-url>
cd StartNew

# Install all dependencies (frontend workspaces)
pnpm install:all

# Set up environment variables
cp .env.example .env.local            # Frontend
cp backend/.env.example backend/.env  # Backend

# Set up the backend
cd backend
python -m venv .venv
source .venv/bin/activate   # Linux/macOS
# .venv\Scripts\activate    # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
cd ..

# Start all apps concurrently
pnpm dev
```

---

## Available Scripts

```bash
pnpm dev              # Run all apps concurrently
pnpm dev:admin        # Admin panel only (port 5173)
pnpm dev:client       # Client app only (port 5174)
pnpm dev:backend      # Backend API only (port 8000)
pnpm build            # Build both frontend apps
pnpm lint             # Lint all apps
pnpm test             # Run all tests
pnpm type-check       # TypeScript type checking
```

---

## Project Structure

```
StartNew/
├── apps/
│   ├── admin/          # Admin dashboard (React + Vite)
│   └── client/         # Customer-facing app (React + Vite)
├── backend/            # Django REST API
│   ├── config/
│   │   └── settings/   # Modular settings (base, development, production)
│   ├── api/
│   │   ├── models/     # Domain models
│   │   ├── serializers/
│   │   ├── views/
│   │   ├── services/   # Business logic (amazon scraping, profit)
│   │   └── tests/
│   └── requirements.txt
├── doc/                # Documentation
├── scripts/            # Utility scripts
├── .github/            # CI/CD workflows
├── package.json        # Monorepo root config
└── pnpm-workspace.yaml
```

---

## API Documentation

When the backend is running:

- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/
- OpenAPI Schema: http://localhost:8000/api/schema/

---

## Environment Variables

### Frontend (both apps)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |
| `VITE_APP_MODE` | `development` or `production` |

### Backend

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret key |
| `DATABASE_URL` | Database connection string |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RESEND_API_KEY` | Resend email service API key |

---

## Deployment

| App | Platform | Notes |
|-----|----------|-------|
| Admin | Cloudflare Pages | See `apps/admin/CLOUDFLARE_DEPLOYMENT_GUIDE.md` |
| Client | Vercel | Auto-deploys on push to `main`. See `VERCEL_DEPLOY_CLIENT.md` |
| Backend | Render.com | PostgreSQL + Gunicorn + WhiteNoise. See `backend/RENDER_DEPLOYMENT_GUIDE.md` |

---

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit using Conventional Commits: `git commit -m 'feat: add new feature'`
3. Push and open a Pull Request with a clear description
4. Ensure tests pass and code is linted before requesting review

---

## Additional Documentation

- `backend/README.md` — Backend API details
- `apps/admin/README.md` — Admin panel details
- `apps/client/README.md` — Client app details
- `backend/RENDER_DEPLOYMENT_GUIDE.md` — Backend deployment
- `VERCEL_DEPLOY_CLIENT.md` — Client app deployment

---

## License

Private
