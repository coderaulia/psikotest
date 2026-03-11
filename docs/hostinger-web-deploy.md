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

## Publishing note

Hostinger serves the website from `public_html`. If build files land beside `public_html` instead of inside it, the domain can return `403 Forbidden` until the files are published into the actual web root.

## Verification

After deployment, test these URLs on the main domain:

- `/`
- `/admin/login`
- `/t/disc-batch-a`

The backend should remain separate on `https://api.your-app-domain.com/api`.
