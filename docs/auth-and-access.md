# Auth and Access

This document describes the current authentication model and the intended direction for future SaaS and white-label growth.

## Current auth surfaces

### Admin auth
- endpoint group: `/api/auth/*`
- validated against `admins`
- bearer token session with signed token payload
- roles currently supported:
  - `super_admin`
  - `admin`
  - `psychologist_reviewer`

### Customer auth
- endpoint group: `/api/site-auth/*`
- validated against `customer_accounts`
- bearer token session with signed token payload
- current account types:
  - `business`
  - `researcher`

### Participant access
- no username/password login
- access through assessment token and signed submission access token
- participant endpoints are scoped to the public session flow

## Role intent

### Super admin
- platform owner
- can manage all admin features and operational settings

### Admin
- internal platform operator
- can manage sessions, questions, participants, and reports

### Psychologist reviewer
- reviews scored outputs
- can move reports through review and release states

### Customer workspace user
Current state:
- one primary account per workspace
- no internal customer team role separation yet

Planned next roles:
- `owner`
- `workspace_admin`
- `hr_user`
- `researcher_member`
- `review_only` where needed

## Session model

### Admin and customer sessions
- signed bearer tokens
- session version revalidated against the database
- logout invalidates tokens by incrementing `session_version`
- frontend currently stores tokens in `sessionStorage`

### Participant session access
- tokenized assessment link
- signed submission token for answer save and submit
- submission write access is locked after final submit

## Access boundaries

### Customer workspace routes
- authenticated via customer bearer token
- should never expose platform admin functions
- should remain scoped to the customer account boundary

### Admin routes
- authenticated via admin bearer token
- never exposed to the public site or customer workspace flows

### Reviewer-sensitive result access
- report states matter:
  - `scored_preliminary`
  - `in_review`
  - `reviewed`
  - `released`
- participant-facing release must not expose preliminary machine output as a final professional result
- psychologist reviewers should only edit results assigned to them, or explicitly claim an unassigned result from the queue

## Security rules already in place
- CORS allowlist by configured origin
- rate limiting on auth and public submission routes
- DB-backed token revalidation for admin and customer requests
- signed submission token requirement for public answer save and submit
- no-store headers on API responses

## Planned auth evolution

### SaaS phase
- workspace team members
- invitation flow
- workspace role management
- feature access by plan

### White-label phase
- tenant-scoped branding controls
- optional domain-specific identity flows
- stricter workspace isolation rules

### Enterprise phase
- SSO
- optional 2FA
- policy-driven session lifetime
- IP and network restrictions if needed

## Maintenance rule

When auth or role behavior changes, also update:
- `docs/new-flow.md`
- `docs/compliance.md`
- `docs/testing-strategy.md` once that file exists
