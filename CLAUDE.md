# AR-E Web — Shein Shop Management System

**Type:** pnpm monorepo with 3 apps
**Domain:** E-commerce / logistics / shop management

---

## Architecture Overview

Three apps share a single repository:

| App | Directory | Port | Deploy Target |
|-----|-----------|------|---------------|
| Admin Panel | `apps/admin/` | 5173 | Cloudflare Pages |
| Client App | `apps/client/` | 5174 | Vercel |
| Backend API | `backend/` | 8000 | Render.com (Gunicorn) |

---

## Apps

### Admin Panel (`apps/admin/`)

Full management dashboard for admin, agents, accountants, and logistical staff.

**Stack:** React 19 + TypeScript + Vite 7 + TailwindCSS 4
**UI:** shadcn/ui + Radix UI + Lucide Icons
**State:** TanStack Query 5 + React Context
**Forms:** React Hook Form + Zod
**Charts:** Recharts

**Pages:** Dashboard, Users, Shops, Products, Orders, Delivery, Packages, Purchases, Categories, Balance, Analytics, Invoices, Expenses, Settings, Profile

### Client App (`apps/client/`)

Customer-facing app for browsing stores, placing orders, and tracking deliveries.

**Stack:** React 19 + TypeScript + Vite 7 + TailwindCSS 4
**UI:** shadcn/ui + Radix UI + Lucide Icons
**State:** TanStack Query + React Context

**Pages:** Home, About, Pricing, Contact, Stores, Profile, Orders, Deliveries

### Backend API (`backend/`)

Django REST API serving both frontend apps.

**Stack:** Django 5.1 + DRF 3.15 + PostgreSQL (prod) / SQLite (dev)
**Auth:** JWT via djangorestframework-simplejwt
**Image storage:** Cloudinary
**Email:** Resend
**Scraping:** BeautifulSoup4 + fake-useragent (Amazon product scraping)
**API docs:** drf-spectacular (Swagger + ReDoc)

---

## User Roles

| Role | Access |
|------|--------|
| `admin` | Full system access |
| `agent` | Agent/seller operations |
| `accountant` | Financial operations |
| `logistical` | Delivery/logistics management |
| `client` | Standard client account |

---

## Database Models

`CustomUser`, `Shop`, `BuyingAccounts`, `ShoppingReceipt`, `Product`, `ProductBuyed`, `ProductReceived`, `ProductDelivery`, `Order`, `DeliverReceipt`, `Package`, `Balance`, `Invoice`, `Expense`, `Category`, `CommonInformation`, `Notification`

---

## API Reference

**Base URL:** `/arye_system/`

| Path | Purpose |
|------|---------|
| `/api_data/user/` | User management |
| `/api_data/order/` | Orders |
| `/api_data/shop/` | Shops |
| `/api_data/product/` | Products |
| `/api_data/package/` | Packages |
| `/api_data/delivery_receipts/` | Delivery receipts |
| `/api_data/balance/` | Balance operations |
| `/api_data/invoice/` | Invoices |
| `/api_data/expense/` | Expenses |
| `/api_data/tag/` | Tags/categories |
| `POST /auth/` | Obtain JWT tokens |
| `POST /auth/refresh/` | Refresh JWT token |
| `/image_upload/` | Image upload utility |
| `/amazon/scrape/` | Amazon product scraping |
| `/cards/operations/` | Card operations |
| `/api_data/dashboard/stats/` | Dashboard statistics |
| `/api_data/reports/profits/` | Profit reports |
| `/api_data/reports/deliveries/` | Delivery reports |
| `/api/docs/` | Swagger UI |
| `/api/redoc/` | ReDoc UI |
| `/api/schema/` | OpenAPI schema |

---

## Commands

```bash
# Monorepo root (pnpm)
pnpm dev              # Run all apps concurrently
pnpm dev:client       # Client app only
pnpm dev:admin        # Admin app only
pnpm dev:backend      # Backend (Python) only
pnpm build            # Build both frontend apps
pnpm lint             # Lint all apps
pnpm test             # Test all apps
pnpm type-check       # TypeScript check across frontends
pnpm install:all      # Install all deps including backend pip

# Backend (run from backend/)
python manage.py runserver
python manage.py migrate
python manage.py createsuperuser
pytest --cov=api
```

---

## Environment Variables

### Frontend (both apps)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Backend API base URL |
| `VITE_APP_MODE` | `development` or `production` |
| `VITE_AUTH_TOKEN_KEY` | localStorage key for access token |
| `VITE_REFRESH_TOKEN_KEY` | localStorage key for refresh token |

### Backend

| Variable | Purpose |
|----------|---------|
| `SECRET_KEY` | Django secret key |
| `DATABASE_URL` | PostgreSQL connection string (prod) |
| `ALLOWED_HOSTS` | Comma-separated allowed host names |
| `CORS_ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `CLOUDINARY_*` | Cloudinary credentials (image storage) |
| `RESEND_API_KEY` | Resend email service key |

---

## Coding Conventions

### Frontend (Admin & Client)

- Components in PascalCase, one component per file
- Hooks in `hooks/` prefixed with `use`
- API services in `services/`
- Types in `types/`
- Zod schemas in `schemas/`
- Use TanStack Query for all API calls — no raw `useEffect` data fetching
- shadcn/ui components live in `components/ui/` — do NOT modify these files
- Use `class-variance-authority` for component variants
- Path alias: `@/` maps to `src/`

### Backend

- Django settings split: `base.py` → `development.py` / `production.py`
- Models in `api/models/` split by domain
- Business logic in `api/services/` — not in views
- Custom permissions in `api/permissions/`
- Serializers in `api/serializers/`
- Use ViewSets for standard CRUD, `APIView` for custom actions

---

## Skills & When to Trigger Them

| Skill | Trigger |
|-------|---------|
| `django-patterns` | Editing backend/ Python code, views, serializers, models |
| `django-security` | Touching auth, permissions, middleware in backend/ |
| `django-tdd` | Writing or fixing backend tests |
| `react-best-practices` | Editing React components in apps/admin/ or apps/client/ |
| `tailwind-patterns` | Working with TailwindCSS styles |
| `frontend-patterns` | Building UI features, state management, forms |
| `senior-frontend` | Complex frontend architecture decisions |
| `senior-backend` | Complex backend architecture decisions |
| `api-and-backend` | Designing API endpoints or serializers |
| `database-migrations` | Creating Django migrations or schema changes |
| `postgres-patterns` | Writing raw SQL or optimizing queries |
| `docker-patterns` | Modifying Dockerfile or docker-compose.yml |
| `deployment-patterns` | Configuring CI/CD, Cloudflare, Vercel, or Render deploys |
| `security-review` | Before commits touching auth, payments, or user data |
| `tdd-workflow` | Implementing new features (write tests first) |
| `e2e-testing` | Creating Playwright E2E tests |
| `coding-standards` | General code quality and TypeScript best practices |
| `fintech-debugger` | Debugging payment, balance, or invoice issues |
| `error-resolver` | Encountering build or runtime errors |
| `design-system` | Building reusable UI components |

---

## Gotchas

- Backend uses `arye_system/` as the URL prefix, not just `/api/` — check this when constructing API calls
- Frontend token storage keys are configurable via env vars (`VITE_AUTH_TOKEN_KEY`, `VITE_REFRESH_TOKEN_KEY`)
- Admin and Client share the same backend but have different auth flows — do not assume they are interchangeable
- Dev uses SQLite, prod uses PostgreSQL — always test migrations against both before merging
- Cloudinary is optional in dev (local file fallback); do not require it for dev environment setup

---

## File Structure Reference

```
StartNew/
├── apps/
│   ├── admin/                  # Admin dashboard (React + Vite)
│   │   └── src/
│   │       ├── components/     # Shared and feature components
│   │       ├── pages/          # Route-level page components
│   │       ├── routes/         # React Router route definitions
│   │       ├── hooks/          # Custom React hooks (use* prefix)
│   │       ├── lib/            # Third-party library configs
│   │       ├── context/        # React context providers
│   │       ├── services/       # API call functions
│   │       ├── types/          # TypeScript type definitions
│   │       ├── schemas/        # Zod validation schemas
│   │       └── utils/          # Pure utility functions
│   └── client/                 # Customer app (React + Vite)
│       └── src/
│           ├── components/
│           ├── pages/
│           ├── routes/
│           ├── hooks/
│           ├── lib/
│           ├── context/
│           ├── services/
│           ├── types/
│           └── utils/
├── backend/                    # Django REST API
│   ├── api/
│   │   ├── models/             # Domain-split Django models
│   │   ├── serializers/        # DRF serializers
│   │   ├── views/              # ViewSets and APIViews
│   │   ├── services/           # Business logic layer
│   │   ├── permissions/        # Custom DRF permissions
│   │   ├── middleware/         # Django middleware
│   │   ├── notifications/      # Notification logic
│   │   ├── signals/            # Django signals
│   │   └── tests/              # Backend test suite
│   └── config/
│       └── settings/           # base.py, development.py, production.py
├── doc/                        # Documentation
├── scripts/                    # Utility scripts
└── .github/                    # CI/CD workflows
```
