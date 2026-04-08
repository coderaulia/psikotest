# Project Context

## Product Scope
- Multi-tenant psychometric assessment platform.
- Surfaces: public participant flow, customer workspace, admin portal.
- Test families: IQ, DISC, Workload, Custom.

## Tech Stack
- Frontend: React 19, Vite, Tailwind CSS, React Router v7, TypeScript.
- API: Cloudflare Workers, Hono, Zod, TypeScript.
- Database: Cloudflare D1 (SQLite).
- Deploy: Wrangler (Workers), Cloudflare Pages (frontend).

## Core Runtime Contracts
- Public test entry: `/t/:token`.
- Admin API auth: bearer JWT.
- Customer API auth: bearer JWT.
- Participant question/answer auth: submission access token (Bearer).

## Naming Rules (Essential)
- Route files: kebab-case (e.g. `public-sessions.ts`).
- React pages/components: kebab-case file names, PascalCase exports.
- Types/interfaces: PascalCase.
- Variables/functions: camelCase.
- Constants/env keys: UPPER_SNAKE_CASE.
- DB columns: snake_case.
- Commit style: conventional prefixes (`feat`, `fix`, `docs`, `chore`, `refactor`, `test`).
