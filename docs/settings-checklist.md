# Settings Expansion Checklist

This checklist tracks the implementation status of platform-wide and workspace-specific settings following the Phase 2 expansion.

## Platform Settings (Admin)
Managed via `app_settings` table (JSON blobs).

| Section | Field | Table / Key | UI | API | Status |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Identity** | Platform Name | `app_settings` / `platform_identity` | ✅ | ✅ | Implemented |
| | Support Email | `app_settings` / `platform_identity` | ✅ | ✅ | Implemented |
| | Contact URL | `app_settings` / `platform_identity` | ✅ | ✅ | Implemented |
| **Compliance** | Consent Template | `app_settings` / `compliance_defaults` | ✅ | ✅ | Implemented |
| | Privacy Template | `app_settings` / `compliance_defaults` | ✅ | ✅ | Implemented |
| | Reviewer Mode | `app_settings` / `compliance_defaults` | ✅ | ✅ | Implemented |
| **Security** | Token Expiry | `app_settings` / `security_defaults` | ✅ | ✅ | Implemented |
| | Protected Mode Default | `app_settings` / `security_defaults` | ✅ | ✅ | Implemented |
| | Sequence Strictness | `app_settings` / `security_defaults` | ✅ | ✅ | Implemented |
| **Controls** | Default Plan | `app_settings` / `customer_controls` | ✅ | ✅ | Implemented |
| | Trial Duration | `app_settings` / `customer_controls` | ✅ | ✅ | Implemented |
| | Manual Activation | `app_settings` / `customer_controls` | ✅ | ✅ | Implemented |

## Workspace Settings (Customer)
Managed via `customer_accounts.settings_json`.

| Section | Field | Plan Gated? | UI | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Identity** | Org Name / Brand / Tagline | No | ✅ | Implemented |
| | Support Email / Contact | No | ✅ | Implemented |
| **Defaults** | Purpose / Mode / Visibility | No | ✅ | Implemented |
| | Limits (Participant / Time) | No | ✅ | Implemented |
| | Consent / Privacy Copy | No | ✅ | Implemented |
| **Experience** | Completion Message | No | ✅ | Implemented |
| | Redirect URL | **Yes (Growth+)** | ✅ | Implemented |
| **Notifications** | Notify on Submission | No | ✅ | Implemented |
| | Notify on Report Released | No | ✅ | Implemented |
| | Notification Email | No | ✅ | Implemented |

## Implementation Notes
- **Plan Gating**: Logic implemented in `workers/src/routes/site-workspace.ts`. Currently gates `postSubmitRedirectUrl` for 'starter' plan.
- **Backend**: Migration `008_settings_expansion.sql` applies initial defaults to `app_settings`.
- **API**: Generic `PATCH /api/settings/app-settings/:key` for admin overrides.
- **Frontend**: Bilingual support (EN/ID) for all customer-facing settings.
