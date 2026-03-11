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

## Build output

The build output is `dist/`. Hostinger publishes that build output into the site's actual web root, which is `public_html` on the server.

The generated `dist/.htaccess` file enables SPA fallback for routes such as `/admin/login`, `/admin/dashboard`, and `/t/disc-batch-a`.

## Verification

After deployment, test these URLs on the main domain:

- `/`
- `/admin/login`
- `/t/disc-batch-a`

The backend should remain separate on `https://api.your-app-domain.com/api`.
