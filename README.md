# Nexus Shop — Full-Stack E-commerce

Portfolio-grade e-commerce monorepo: **NestJS + PostgreSQL** API with an **React Router (SPA) + Tailwind v4 + Redux Toolkit** storefront and admin panel.

- **Payment:** Cash on Delivery only (no card payments, no push notifications)
- **Shipping:** flat fee, editable by admin, optional free-shipping threshold
- **Auth:** email + password, cookie-based JWT (access + rotating refresh), role-based (CUSTOMER / ADMIN)
- **Features:** catalog with categories/brands/variants/images, cart (guest cart merges on login), wishlist, coupons, COD checkout with stock locking, order tracking timeline, product reviews, admin dashboard with revenue chart, customers block/unblock, settings

```
ecommerce/
├── backend/    NestJS 12 + Prisma 6 + PostgreSQL (port 3000, prefix /api)
└── frontend/   React Router 8 SPA + Tailwind 4 + RTK Query (port 5173, dev proxy)
```

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (tested with 18)

## Setup

### 1. Database

```sql
CREATE DATABASE ecommerce;
```

### 2. Backend

```bash
cd backend
npm install --legacy-peer-deps     # required: npm peer-resolution bug with this dep tree
cp .env.example .env               # then edit DATABASE_URL / secrets
npx prisma migrate deploy
npm run seed                       # categories, brands, 16 products, coupons, settings, admin user
npm run start:dev                  # http://localhost:3000
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env               # defaults work with the dev proxy
npm run dev                        # http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to `http://localhost:3000` (override with `VITE_API_PROXY`).

## Seeded logins

| Role     | Email               | Password        |
| -------- | ------------------- | --------------- |
| Admin    | `admin@shop.com`    | `Admin@12345`   |
| Customer | `customer@example.com` | `Customer@123` |

Admin panel: `http://localhost:5173/admin`

## Configuration

All config is environment-driven (no hard-coded secrets):

**backend/.env** — `DATABASE_URL`, `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`, TTLs, `CORS_ORIGIN`, cookie flags, upload limits, optional SMTP (forgot-password links log to console when SMTP is unset), seed credentials.

**frontend/.env** — `VITE_API_URL` (empty = same-origin/proxy), `VITE_APP_NAME`, `VITE_CURRENCY_SYMBOL` (default `৳`), `VITE_API_PROXY`.

## API overview

Global prefix `api`. Responses are wrapped as `{ "data": ... }`; errors as `{ statusCode, message, error, path }`.

| Area       | Endpoints |
| ---------- | --------- |
| Auth       | `POST /auth/register` `POST /auth/login` `POST /auth/logout` `POST /auth/refresh` `POST /auth/forgot-password` `POST /auth/reset-password` |
| Catalog    | `GET /products` `GET /products/home` `GET /products/:slug` `GET /categories` `GET /brands` |
| Cart       | `GET/POST/PATCH/DELETE /cart/items` `POST /cart/coupon` `POST /coupons/validate` (guest cart via cookie) |
| Wishlist   | `GET /wishlist` `POST/DELETE /wishlist/:productId` |
| Orders     | `POST /orders` `GET /orders` `GET /orders/:id` `POST /orders/:id/cancel` `POST /orders/:id/reorder` |
| Reviews    | `GET/POST /reviews?productId=` `PATCH/DELETE /reviews/:id` |
| Account    | `GET/PATCH /users/me` `POST /users/me/password` `GET/POST/PATCH/DELETE /users/me/addresses` |
| Settings   | `GET /settings/shipping` |
| Uploads    | `POST /uploads` (image, 5 MB max) |
| Admin      | `/admin/dashboard` `/admin/products` `/admin/categories` `/admin/brands` `/admin/coupons` `/admin/orders` `/admin/customers` `/admin/reviews` `/admin/settings` |

Admin endpoints require the `ADMIN` role (403 otherwise); authenticated routes read the `access_token` httpOnly cookie (Bearer also accepted).

## Guarantees & behaviour notes

- **Checkout** runs in a transaction with row locks (`FOR UPDATE`) — concurrent orders cannot oversell a variant; cancelled orders restock.
- **Order status flow:** `PENDING → PROCESSING → SHIPPED → DELIVERED` (cancel allowed while pending/processing); `DELIVERED` marks payment `PAID`. Every change is recorded in a tracking timeline.
- **Refresh tokens** rotate on use; reuse revokes the session.
- **CSRF:** mutating requests verify the `Origin` header against `CORS_ORIGIN`.
- **Coupons:** percent/fixed, min purchase, expiry, global + per-customer usage limits.
- **Product delete** archives instead of hard-deleting when order history exists.

## Scripts

| Where     | Command | What |
| --------- | ------- | ---- |
| backend   | `npm run start:dev` | dev server with reload |
| backend   | `npm run build` / `npm start` | production build/run |
| backend   | `npm test` | unit tests (vitest) |
| backend   | `npx tsc --noEmit` / `npx oxlint src` | typecheck / lint |
| backend   | `npx prisma migrate dev` | create migration (interactive) |
| backend   | `npm run seed` | seed demo data |
| frontend  | `npm run dev` | dev server (proxy to :3000) |
| frontend  | `npm run build` | production SPA build |
| frontend  | `npm run typecheck` | typegen + tsc |

## Production notes

- Build frontend (`npm run build` in `frontend/`) and serve `build/client/` from any static host or the included `react-router-serve` (`npm start`); keep `VITE_API_URL` pointing at the API origin.
- Set `COOKIE_SECURE=true`, real JWT secrets, `CORS_ORIGIN` to your domain, and configure SMTP.
- Put the API behind HTTPS; Prisma + PostgreSQL connection pooling is handled by Prisma defaults.
