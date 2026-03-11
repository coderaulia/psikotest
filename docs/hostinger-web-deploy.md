# Hostinger Main App Deployment Guide

Target main app domain: `https://your-app-domain.com`

## Deploy source

Deploy the repository root from GitHub. The root is a standard Vite React app, and its frontend source is in `src/`.

## Recommended Hostinger settings

- Branch: `main`
- Node.js version: `20.x`
- Build command: `npm run build`
- Output directory: `dist`

## Environment variables

Set this variable before building:

```env
VITE_API_BASE_URL=https://api.your-app-domain.com/api
```

## Important note about `nodejs` and `public_html`

On Hostinger shared hosting, the website web root is `public_html`.

For frontend Git deployments, Hostinger takes the build output directory, such as `dist/`, and publishes it into `public_html` automatically.

Do not try to configure the frontend project itself to serve from `nodejs/`. The `nodejs/` directory is used by Hostinger for backend/runtime app deployments, not as a manual document root for a Vite frontend.

## Verification

After deployment, test these URLs on the main domain:

- `/`
- `/admin/login`
- `/t/disc-batch-a`

The backend should remain separate on `https://api.your-app-domain.com/api`.
