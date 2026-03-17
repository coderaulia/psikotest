# Language Maintenance Guide

This app currently uses a lightweight custom language system with English as the default language and Indonesian as the secondary language.

## Current language files

Language provider and persistence:

- `src/lib/language.tsx`

Language toggle UI:

- `src/components/common/language-toggle.tsx`

App bootstrap:

- `src/main.tsx`

## How the language preference works

- Default language: English (`en`)
- Secondary language: Bahasa Indonesia (`id`)
- Stored in browser local storage under:
  - `psikotest:language`

## How to add or adjust bilingual wording

Current pattern used in translated shells:

```tsx
const copy = {
  en: {
    title: 'Customer workspace',
  },
  id: {
    title: 'Workspace pelanggan',
  },
} as const;

const { language } = useLanguage();
const t = copy[language];
```

Recommended process:

1. Open the page or layout file you want to translate.
2. Add or update a local `copy` object with `en` and `id` keys.
3. Read the active language using `useLanguage()`.
4. Replace inline strings with values from `t`.

## Files already prepared for bilingual UI chrome

- `src/layouts/marketing-layout.tsx`
- `src/components/common/customer-shell.tsx`
- `src/components/common/admin-shell.tsx`
- `src/layouts/participant-layout.tsx`

## Recommended next expansion order

If you want to keep extending the bilingual UI cleanly, translate in this order:

1. Public marketing pages
   - `src/pages/landing-page.tsx`
   - `src/pages/manual-page.tsx`
   - `src/pages/white-label-page.tsx`
2. Customer auth and onboarding pages
   - `src/pages/customer/customer-signup-page.tsx`
   - `src/pages/customer/customer-login-page.tsx`
   - `src/pages/customer/customer-onboarding-page.tsx`
3. Participant flow pages
   - `src/pages/participant/consent-page.tsx`
   - `src/pages/participant/identity-page.tsx`
   - `src/pages/participant/instructions-page.tsx`
   - `src/pages/participant/completed-page.tsx`
4. Admin workspace pages
   - dashboard, results, settings, and reporting pages

## Important limitation

Question text, option text, session consent statements, and privacy statements may come from the database. The language toggle does not automatically translate database content.

If you want bilingual question banks later, that needs a data-model decision on the API/database side.

## Validation after wording changes

Run these commands after editing translated copy:

- `npm run typecheck`
- `npm run build`
- `npm run test:frontend`
