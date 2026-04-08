# Architecture

## Layers
- Frontend (React + Vite)
- API (Workers + Hono)
- Data (D1 SQLite)

## Frontend Structure
- `src/app/`
- `src/pages/admin/`
- `src/pages/customer/`
- `src/pages/participant/`
- `src/pages/public/`
- `src/components/`
- `src/services/`
- `src/types/`

## Workers Structure
- `workers/src/index.ts`
- `workers/src/routes/`
- `workers/src/lib/`
- `workers/src/middleware/`
- `workers/migrations/`
- `workers/seeds/`

## Auth Boundaries
- Admin bearer JWT
- Customer bearer JWT
- Participant submission token

## Primary Flows
- Public participant flow
- Customer assessment management
- Admin operations and review
- Billing/manual verification flow

## Data Domains
- Sessions and submissions
- Questions and options
- Results and summaries
- Customers and subscriptions
- Manual payments
