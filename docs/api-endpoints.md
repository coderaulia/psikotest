# API Endpoints Documentation

**Last Updated:** 2026-04-03
**API Version:** 2.2.0
**Base URL:** `https://psikotest-api.coderaulia.workers.dev/api`

## Authentication Types

| Type | Description | Header |
|------|-------------|--------|
| None | Public endpoint | No auth required |
| Admin Bearer | Admin JWT token | `Authorization: Bearer <token>` |
| Customer Bearer | Customer JWT token | `Authorization: Bearer <token>` |
| Submission Token | Participant access | `X-Submission-Token: <token>` |

---

## Public Endpoints

### Health Check

#### GET /api/health
- **Auth:** None
- **Handler:** `health.ts`
- **Status:** ✅ Working
- **Description:** Returns API status and version

```json
Response: {
  "status": "ok",
  "timestamp": "2026-04-01T00:00:00.000Z",
  "message": "Psikotest API running on Cloudflare Workers",
  "version": "2.2.0"
}
```

---

### Participant Test Delivery

#### GET /api/public/session/:token
- **Auth:** None
- **Handler:** `public-sessions.ts`
- **Status:** ✅ Working
- **Description:** Get session details for participant test access

```json
Response: {
  "session": {
    "id": 1,
    "title": "IQ Assessment",
    "testType": "iq",
    "instructions": ["..."],
    "timeLimitMinutes": 20,
    "status": "active"
  }
}
```

#### POST /api/public/session/:token/start
- **Auth:** None
- **Handler:** `public-sessions.ts`
- **Status:** ✅ Working
- **Description:** Start a test submission

```json
Request: { "fullName": "John Doe", "email": "john@example.com" }
Response: {
  "submissionId": 123,
  "participantId": 456,
  "token": "...",
  "submissionAccessToken": "...",
  "status": "in_progress"
}
```

#### GET /api/public/submissions/:id/questions
- **Auth:** Submission Token (`X-Submission-Token`)
- **Handler:** `public-sessions.ts`
- **Status:** ✅ Working
- **Description:** Get questions for a submission

```json
Response: {
  "submissionId": 123,
  "groupIndex": 0,
  "questions": [...]
}
```

#### POST /api/public/submissions/:id/answers
- **Auth:** Submission Token (`X-Submission-Token`)
- **Handler:** `public-sessions.ts`
- **Status:** ✅ Working
- **Description:** Save answers during test

```json
Request: { "answers": [...] }
Response: { "submissionId": 123, "saved": true }
```

#### POST /api/public/submissions/:id/submit
- **Auth:** Submission Token (`X-Submission-Token`)
- **Handler:** `public-sessions.ts`
- **Status:** ✅ Working
- **Description:** Submit completed test

```json
Response: {
  "submissionId": 123,
  "status": "submitted",
  "resultId": 789,
  "message": "Test submitted successfully"
}
```

---

## Admin Endpoints

### Authentication (Admin)

#### POST /api/auth/login
- **Auth:** None
- **Handler:** `auth.ts`
- **Status:** ✅ Working
- **Description:** Admin login

```json
Request: { "email": "admin@example.com", "password": "..." }
Response: { "token": "...", "admin": { "id": 1, "fullName": "...", "role": "super_admin" } }
```

#### GET /api/auth/me
- **Auth:** Admin Bearer
- **Handler:** `auth.ts`
- **Status:** ✅ Working
- **Description:** Get current admin profile

#### POST /api/auth/logout
- **Auth:** Admin Bearer
- **Handler:** `auth.ts`
- **Status:** ✅ Working
- **Description:** Logout admin (invalidate session)

#### POST /api/auth/set-password
- **Auth:** Admin Bearer
- **Handler:** `auth.ts`
- **Status:** ✅ Working
- **Description:** Set password for new admin

#### POST /api/auth/forgot-password
- **Auth:** None
- **Handler:** `auth.ts`
- **Status:** ✅ Working
- **Description:** Request admin password reset

#### POST /api/auth/reset-password
- **Auth:** None
- **Handler:** `auth.ts`
- **Status:** ✅ Working
- **Description:** Reset admin password with token

---

### Dashboard

#### GET /api/dashboard
- **Auth:** Admin Bearer
- **Handler:** `dashboard.ts`
- **Status:** ✅ Working
- **Description:** Get dashboard metrics (legacy format)

#### GET /api/dashboard/summary
- **Auth:** Admin Bearer
- **Handler:** `dashboard.ts`
- **Status:** ✅ Working
- **Description:** Get dashboard summary metrics

```json
Response: {
  "activeSessions": 5,
  "draftSessions": 3,
  "participantCount": 150,
  "totalSubmissions": 89,
  "completedSubmissions": 75,
  "averageIqScore": 102,
  "completionRate": 84
}
```

---

### Participants Management

#### GET /api/participants
- **Auth:** Admin Bearer
- **Handler:** `participants.ts`
- **Status:** ✅ Working
- **Description:** List all participants with search

```json
Query: ?search=john
Response: { "items": [...] }
```

---

### Test Sessions Management

#### GET /api/test-sessions
- **Auth:** Admin Bearer
- **Handler:** `test-sessions.ts`
- **Status:** ✅ Working
- **Description:** List test sessions with filters

```json
Query: ?status=active&testType=iq&search=assessment
Response: { "items": [...] }
```

#### GET /api/test-sessions/:id
- **Auth:** Admin Bearer
- **Handler:** `test-sessions.ts`
- **Status:** ✅ Working
- **Description:** Get session detail with participants

#### POST /api/test-sessions
- **Auth:** Admin Bearer
- **Handler:** `test-sessions.ts`
- **Status:** ✅ Working
- **Description:** Create new test session

#### PATCH /api/test-sessions/:id
- **Auth:** Admin Bearer
- **Handler:** `test-sessions.ts`
- **Status:** ✅ Working
- **Description:** Update test session

#### DELETE /api/test-sessions/:id
- **Auth:** Admin Bearer
- **Handler:** `test-sessions.ts`
- **Status:** ✅ Working
- **Description:** Delete test session

---

### Question Bank Management

#### GET /api/question-bank/questions
- **Auth:** Admin Bearer
- **Handler:** `question-bank.ts`
- **Status:** ✅ Working
- **Description:** List questions with filters

```json
Query: ?testType=iq&status=active&search=math
Response: { "items": [...] }
```

#### GET /api/question-bank/questions/:id
- **Auth:** Admin Bearer
- **Handler:** `question-bank.ts`
- **Status:** ✅ Working
- **Description:** Get single question

#### POST /api/question-bank/questions
- **Auth:** Admin Bearer
- **Handler:** `question-bank.ts`
- **Status:** ✅ Working
- **Description:** Create new question

#### PATCH /api/question-bank/questions/:id
- **Auth:** Admin Bearer
- **Handler:** `question-bank.ts`
- **Status:** ✅ Working
- **Description:** Update question

#### GET /api/question-bank/questions/export
- **Auth:** Admin Bearer
- **Handler:** `question-bank.ts`
- **Status:** ✅ Working
- **Description:** Export question bank as flat CSV (one row per question with option slots)

#### POST /api/question-bank/questions/import
- **Auth:** Admin Bearer
- **Handler:** `question-bank.ts`
- **Status:** ✅ Working
- **Description:** Import question bank from CSV string payload (`dryRun` and write mode supported)

```json
Request: { "csv": "...", "dryRun": true, "replaceAll": false }
Response (dry run): { "success": true, "preview": 24, "categories": ["iq"], "dryRun": true }
Response (write): { "success": true, "imported": 20, "skipped": 4, "dryRun": false }
```

#### GET /api/question-bank/questions/import/template
- **Auth:** Admin Bearer
- **Handler:** `question-bank.ts`
- **Status:** ✅ Working
- **Description:** Download CSV import template with headers and sample rows

---

### Results Management

#### GET /api/results
- **Auth:** Admin Bearer
- **Handler:** `results.ts`
- **Status:** ✅ Working
- **Description:** List results with filters

```json
Query: ?testType=iq&reviewStatus=reviewed&dateFrom=2026-01-01&dateTo=2026-04-01
Response: { "items": [...] }
```

#### GET /api/results/reviewer-queue/summary
- **Auth:** Admin Bearer
- **Handler:** `results.ts`
- **Status:** ✅ Working
- **Description:** Get reviewer queue summary

```json
Response: {
  "pendingCount": 10,
  "unassignedCount": 5,
  "assignedToMeCount": 3,
  "inReviewCount": 2,
  "readyForReleaseCount": 1
}
```

#### GET /api/results/reviewer-queue
- **Auth:** Admin Bearer
- **Handler:** `results.ts`
- **Status:** ✅ Working
- **Description:** Get results in reviewer queue

```json
Query: ?scope=all|mine|unassigned
Response: { "items": [...] }
```

#### GET /api/results/reviewers
- **Auth:** Admin Bearer
- **Handler:** `results.ts`
- **Status:** ✅ Working
- **Description:** Get list of available reviewers

#### GET /api/results/:id
- **Auth:** Admin Bearer
- **Handler:** `results.ts`
- **Status:** ✅ Working
- **Description:** Get result detail

#### PATCH /api/results/:id/review-status
- **Auth:** Admin Bearer
- **Handler:** `results.ts`
- **Status:** ✅ Working
- **Description:** Update result review status

```json
Request: { "reviewStatus": "reviewed" }
```

#### PATCH /api/results/:id/review
- **Auth:** Admin Bearer
- **Handler:** `results.ts`
- **Status:** ✅ Working
- **Description:** Update result review (professional summary, recommendation, etc.)

```json
Request: {
  "reviewStatus": "reviewed",
  "professionalSummary": "...",
  "recommendation": "...",
  "limitations": "...",
  "reviewerNotes": "..."
}
```

#### PATCH /api/results/:id/assign-reviewer
- **Auth:** Admin Bearer
- **Handler:** `results.ts`
- **Status:** ✅ Working
- **Description:** Assign reviewer to result

```json
Request: { "reviewerAdminId": 2 } | null
```

#### GET /api/results/:id/pdf
- **Auth:** Admin Bearer
- **Handler:** `results.ts`
- **Status:** ✅ Working (stub)
- **Description:** Get PDF export URL (currently returns browser print URL for manual PDF generation)

```json
Response: {
  "method": "browser_print",
  "printUrl": "/admin/results/:id/export",
  "message": "PDF generation via external service not yet configured. Use browser print instead."
}
```
**Note:** Future implementation will stream PDF bytes when external service is configured.

---

### Reports

#### GET /api/reports/summary
- **Auth:** Admin Bearer
- **Handler:** `reports.ts`
- **Status:** ✅ Working
- **Description:** Get reports summary

---

### Settings

#### GET /api/settings
- **Auth:** Admin Bearer
- **Handler:** `settings.ts`
- **Status:** ✅ Working
- **Description:** Get admin settings overview

```json
Response: {
  "profile": { "id": 1, "fullName": "...", "email": "...", "role": "super_admin" },
  "sessionDefaults": { ... },
  "auditFeed": [...]
}
```

#### PATCH /api/settings/profile
- **Auth:** Admin Bearer
- **Handler:** `settings.ts`
- **Status:** ✅ Working
- **Description:** Update admin profile

```json
Request: { "fullName": "New Name", "email": "new@example.com" }
```

#### PATCH /api/settings/session-defaults
- **Auth:** Admin Bearer
- **Handler:** `settings.ts`
- **Status:** ✅ Working
- **Description:** Update session defaults

---

### Customers Management

#### GET /api/customers
- **Auth:** Admin Bearer
- **Handler:** `customers.ts`
- **Status:** ✅ Working
- **Description:** List customers with filters

```json
Query: ?search=company&status=active&accountType=business
Response: { "items": [...] }
```

#### GET /api/customers/:id
- **Auth:** Admin Bearer
- **Handler:** `customers.ts`
- **Status:** ✅ Working
- **Description:** Get customer detail

#### PATCH /api/customers/:id/status
- **Auth:** Admin Bearer
- **Handler:** `customers.ts`
- **Status:** ✅ Working
- **Description:** Update customer status

```json
Request: { "status": "active" | "inactive" }
```

#### GET /api/customers/:id/billing
- **Auth:** Admin Bearer
- **Handler:** `customers.ts`
- **Status:** ✅ Working
- **Description:** Get customer billing info

#### PATCH /api/customers/:id/billing
- **Auth:** Admin Bearer
- **Handler:** `customers.ts`
- **Status:** ✅ Working
- **Description:** Update customer billing (admin override)

---

## Customer Endpoints

### Authentication (Customer)

#### POST /api/site-auth/signup
- **Auth:** None
- **Handler:** `site-auth.ts`
- **Status:** ✅ Working
- **Description:** Register new customer

```json
Request: { "fullName": "...", "email": "...", "password": "...", "accountType": "business"|"researcher", "organizationName": "..." }
Response: { "token": "...", "account": {...} }
```

#### POST /api/site-auth/login
- **Auth:** None
- **Handler:** `site-auth.ts`
- **Status:** ✅ Working
- **Description:** Customer login

#### GET /api/site-auth/me
- **Auth:** Customer Bearer
- **Handler:** `site-auth.ts`
- **Status:** ✅ Working
- **Description:** Get current customer profile

#### POST /api/site-auth/logout
- **Auth:** Customer Bearer
- **Handler:** `site-auth.ts`
- **Status:** ✅ Working
- **Description:** Customer logout

#### GET /api/site-auth/invite/:token
- **Auth:** None
- **Handler:** `site-auth.ts`
- **Status:** ✅ Working
- **Description:** Preview workspace invite

#### POST /api/site-auth/invite/:token/accept
- **Auth:** None
- **Handler:** `site-auth.ts`
- **Status:** ✅ Working
- **Description:** Accept workspace invite

#### POST /api/site-auth/forgot-password
- **Auth:** None
- **Handler:** `site-auth.ts`
- **Status:** ✅ Working
- **Description:** Request customer password reset

#### GET /api/site-auth/reset-password/validate
- **Auth:** None
- **Handler:** `site-auth.ts`
- **Status:** ✅ Working
- **Description:** Validate reset token

```json
Query: ?token=...
Response: { "valid": true } | { "valid": false, "reason": "expired"|"used"|"invalid" }
```

#### POST /api/site-auth/reset-password
- **Auth:** None
- **Handler:** `site-auth.ts`
- **Status:** ✅ Working
- **Description:** Reset password with token

---

### Workspace Settings

#### GET /api/site-workspace/settings
- **Auth:** Customer Bearer
- **Handler:** `site-workspace.ts`
- **Status:** ✅ Working
- **Description:** Get workspace settings

#### PATCH /api/site-workspace/settings
- **Auth:** Customer Bearer (owner/admin)
- **Handler:** `site-workspace.ts`
- **Status:** ✅ Working
- **Description:** Update workspace settings

---

### Workspace Activity

#### GET /api/site-workspace/activity
- **Auth:** Customer Bearer
- **Handler:** `site-workspace.ts`
- **Status:** ✅ Working
- **Description:** Get workspace activity feed

---

### Workspace Team

#### GET /api/site-workspace/team
- **Auth:** Customer Bearer (owner/admin)
- **Handler:** `site-workspace.ts`
- **Status:** ✅ Working
- **Description:** Get team members

#### POST /api/site-workspace/team
- **Auth:** Customer Bearer (owner/admin)
- **Handler:** `site-workspace.ts`
- **Status:** ✅ Working
- **Description:** Add team member

```json
Request: { "fullName": "...", "email": "...", "role": "admin"|"operator"|"reviewer" }
```

#### POST /api/site-workspace/team/:memberId/send
- **Auth:** Customer Bearer (owner/admin)
- **Handler:** `site-workspace.ts`
- **Status:** ✅ Working
- **Description:** Send/resent invite to team member

---

### Billing

#### GET /api/site-billing/overview
- **Auth:** Customer Bearer (owner/admin)
- **Handler:** `site-billing.ts`
- **Status:** ✅ Working
- **Description:** Get billing overview with usage diagnostics

#### GET /api/site-billing/invoices
- **Auth:** Customer Bearer (owner/admin)
- **Handler:** `site-billing.ts`
- **Status:** ✅ Working
- **Description:** Get invoice history

#### POST /api/site-billing/checkout-session
- **Auth:** Customer Bearer (owner)
- **Handler:** `site-billing.ts`
- **Status:** ✅ Working
- **Description:** Create checkout session (currently dummy)

```json
Request: { "selectedPlan": "starter"|"growth"|"research", "billingCycle": "monthly"|"annual" }
```

#### PATCH /api/site-billing/subscription
- **Auth:** Customer Bearer (owner)
- **Handler:** `site-billing.ts`
- **Status:** ✅ Working
- **Description:** Update subscription plan (currently dummy)

---

### Results (Customer)

#### GET /api/site-results
- **Auth:** Customer Bearer
- **Handler:** `site-results.ts`
- **Status:** ✅ Working
- **Description:** Get customer results list

#### GET /api/site-results/:id
- **Auth:** Customer Bearer
- **Handler:** `site-results.ts`
- **Status:** ✅ Working
- **Description:** Get customer result detail

#### GET /api/site-results/export.csv
- **Auth:** Customer Bearer
- **Handler:** `site-results.ts`
- **Status:** ✅ Working
- **Description:** Export results as CSV

#### GET /api/site-results/:id/pdf
- **Auth:** Customer Bearer
- **Handler:** `site-results.ts`
- **Status:** ✅ Working (stub)
- **Description:** Get PDF export URL (currently returns browser print URL for manual PDF generation)
- **Note:** Only released results can be exported; returns 403 for non-released results

```json
Response: {
  "method": "browser_print",
  "printUrl": "/workspace/results/:id/export",
  "message": "PDF generation via external service not yet configured. Use browser print instead."
}
```
**Note:** Future implementation will stream PDF bytes when external service is configured.

---

### Assessment Management

#### GET /api/site-onboarding/assessments
- **Auth:** Customer Bearer
- **Handler:** `site-onboarding.ts`
- **Status:** ✅ Working
- **Description:** Get customer assessments list

#### GET /api/site-onboarding/assessments/:id
- **Auth:** Customer Bearer
- **Handler:** `site-onboarding.ts`
- **Status:** ✅ Working
- **Description:** Get assessment detail

#### POST /api/site-onboarding/assessments
- **Auth:** Customer Bearer (owner/admin/operator)
- **Handler:** `site-onboarding.ts`
- **Status:** ✅ Working
- **Description:** Create new assessment

```json
Request: {
  "testType": "iq"|"disc"|"workload"|"custom",
  "title": "...",
  "purpose": "recruitment"|"employee_development"|...,
  "organizationName": "...",
  "administrationMode": "supervised"|"remote_unsupervised",
  "timeLimitMinutes": 20,
  "participantLimit": 100,
  "resultVisibility": "participant_summary"|"review_required",
  "protectedDeliveryMode": false
}
```

#### PATCH /api/site-onboarding/assessments/:id
- **Auth:** Customer Bearer (owner/admin/operator)
- **Handler:** `site-onboarding.ts`
- **Status:** ✅ Working
- **Description:** Update assessment (draft only)

#### POST /api/site-onboarding/assessments/:id/activate
- **Auth:** Customer Bearer (owner/admin/operator)
- **Handler:** `site-onboarding.ts`
- **Status:** ✅ Working
- **Description:** Activate assessment

#### POST /api/site-onboarding/assessments/:id/checkout
- **Auth:** Customer Bearer (owner/admin/operator)
- **Handler:** `site-onboarding.ts`
- **Status:** ✅ Working
- **Description:** Create checkout for assessment plan

---

### Participant Management

#### GET /api/site-onboarding/assessments/:id/participants
- **Auth:** Customer Bearer (owner/admin/operator)
- **Handler:** `site-onboarding.ts`
- **Status:** ✅ Working
- **Description:** Get participant list for assessment

#### POST /api/site-onboarding/assessments/:id/participants
- **Auth:** Customer Bearer (owner/admin/operator)
- **Handler:** `site-onboarding.ts`
- **Status:** ✅ Working
- **Description:** Add participant

```json
Request: {
  "fullName": "...",
  "email": "...",
  "employeeCode": "...",
  "department": "...",
  "positionTitle": "...",
  "note": "..."
}
```

#### POST /api/site-onboarding/assessments/:id/participants/import
- **Auth:** Customer Bearer (owner/admin/operator)
- **Handler:** `site-onboarding.ts`
- **Status:** ✅ Working
- **Description:** Bulk import participants

```json
Request: { "rows": [...] }
Response: { "importedCount": 10, "updatedCount": 2, "totalRows": 12 }
```

#### POST /api/site-onboarding/assessments/:id/participants/send-bulk
- **Auth:** Customer Bearer (owner/admin/operator)
- **Handler:** `site-onboarding.ts`
- **Status:** ✅ Working
- **Description:** Send invites to all draft participants

```json
Request: { "channel": "email"|"link" }
Response: { "invitedCount": 10, "skippedCount": 2, "shareLink": "..." }
```

#### POST /api/site-onboarding/assessments/:id/participants/remind-bulk
- **Auth:** Customer Bearer (owner/admin/operator)
- **Handler:** `site-onboarding.ts`
- **Status:** ✅ Working
- **Description:** Send reminders to invited participants

#### POST /api/site-onboarding/assessments/:id/participants/:participantId/send
- **Auth:** Customer Bearer (owner/admin/operator)
- **Handler:** `site-onboarding.ts`
- **Status:** ✅ Working
- **Description:** Send invite to single participant

#### POST /api/site-onboarding/assessments/:id/participants/:participantId/remind
- **Auth:** Customer Bearer (owner/admin/operator)
- **Handler:** `site-onboarding.ts`
- **Status:** ✅ Working
- **Description:** Send reminder to single participant

---

## Error Responses

All endpoints follow standard error format:

```json
{
  "error": "Error message"
}
```

Common status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate, limit reached)
- `500` - Internal Server Error

---

## Rate Limits

Currently, there are no rate limits implemented. This is technical debt that should be addressed in Phase 3.

---

## Future Endpoints (Planned)

| Endpoint | Purpose | Priority |
|----------|---------|----------|
| `POST /api/site-email/send-invite` | Send actual email invites | Phase 1 |
| `POST /api/site-email/send-reminder` | Send actual email reminders | Phase 1 |
| `GET /api/site-email/templates` | Manage email templates | Phase 2 |
| `POST /api/site-billing/webhooks/stripe` | Stripe webhook handler | Phase 2 |
| `GET /api/site-billing/portal` | Stripe customer portal | Phase 2 |
| `GET /api/results/:id/report.pdf` | PDF report download | Phase 2 |
| `GET /api/admin/analytics` | Advanced analytics | Phase 3 |
