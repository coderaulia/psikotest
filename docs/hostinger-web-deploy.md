# Hostinger Main App Deployment Guide

Target main app domain: `codeyourcareer.my.id`

## Deploy source

Deploy the repository root from GitHub. This deployment is for the React app only.

## Recommended Hostinger settings

- Branch: `main`
- Node.js version: `20.x`
- Build command: `npm run build:hostinger-web`
- Startup file: `server.js`
- Start command if the panel asks for it: `npm start`

The root `server.js` serves the built SPA from `apps/web/dist` and provides an SPA fallback for routes like `/admin/login` and `/t/:token`.

## Environment variables

Set this variable in Hostinger before building:

```env
VITE_API_BASE_URL=https://api2.codeyourcareer.my.id/api
```

Optional local port override:

```env
PORT=3000
```

## Verification

After deployment, test these URLs on the main domain:

- `/`
- `/admin/login`
- `/t/disc-batch-a`

The main app calls the API on `https://api2.codeyourcareer.my.id/api` at build time via `VITE_API_BASE_URL`.
