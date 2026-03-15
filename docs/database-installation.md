# Database Installation Notes

This project now supports two database paths:

## Fresh install

Use these files after running:

```bash
npm run package:db-deploy
```

Then import the bundle from:

- `deploy/install/01_schema_current.sql`
- `deploy/install/02_seed_test_catalog.sql`
- `deploy/install/03_seed_assessment_questions.sql`
- `deploy/install/04_seed_demo_sessions.sql` (optional)

Use this path when setting up a brand-new environment.

## Existing database upgrade

If an older Psikotest database already exists, use:

- `deploy/upgrade/01_upgrade_legacy_to_current.sql`

This bundled upgrade adds the later schema changes that are not present in older installs.

## Maintenance rule

- `apps/api/src/database/migrations/001_init_schema.sql` should always describe the current full schema for fresh installs.
- Later migration files should exist only for legacy upgrade paths.
- `deploy/install/` is the user-facing install bundle.
- `deploy/upgrade/` is the user-facing upgrade bundle.
- `deploy/source/` stores raw seed sources used to assemble the install bundle.
