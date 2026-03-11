# Hostinger Main App Deployment Guide

Target main app domain: `https://your-app-domain.com`

## Deploy source

Deploy the repository root from GitHub. The root is a standard Vite React app.

## Recommended Hostinger settings

- Branch: `main`
- Node.js version: `20.x`
- Build command: `npm run build`
- Startup file: `server.js`
- Start command if the panel asks for it: `npm start`

## Environment variables

Set this variable before building:

```env
VITE_API_BASE_URL=https://api.your-app-domain.com/api
```

## Build output

The build output goes directly to `public_html/`, which matches Hostinger's web root. No manual move from a sibling folder should be needed after build.

The generated `public_html/.htaccess` file enables SPA fallback for routes such as `/admin/login`, `/admin/dashboard`, and `/t/disc-batch-a`.

## Verification

After deployment, test these URLs on the main domain:

- `/`
- `/admin/login`
- `/t/disc-batch-a`

The backend should remain separate on `https://api.your-app-domain.com/api`.
