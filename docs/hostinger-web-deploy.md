# Hostinger Main App Deployment Guide

Target main app domain: `codeyourcareer.my.id`

## Deploy source

Deploy the repository root from GitHub. The root is now a standard Vite React app, which is what Hostinger expects during repository import.

## Recommended Hostinger settings

- Branch: `main`
- Node.js version: `20.x`
- Build command: `npm run build`
- Startup file: `server.js`
- Start command if the panel asks for it: `npm start`

## Environment variables

Set this variable before building:

```env
VITE_API_BASE_URL=https://api2.codeyourcareer.my.id/api
```

## Verification

After deployment, test these URLs on the main domain:

- `/`
- `/admin/login`
- `/t/disc-batch-a`

The backend should remain separate on `https://api2.codeyourcareer.my.id/api`.
