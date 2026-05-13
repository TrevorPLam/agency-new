# Platform Apps – Internal Operations & Client‑Facing Dashboards

Each platform app is a Next.js 16 application deployed under a subdomain. They are the interface for clients to view analytics, manage content, approve AI drafts, schedule bookings, and access invoices — and for agency staff to configure tenants and orchestrate services.

---

## 1. Global Rules (All Platform Apps)

- **Authentication:** Better Auth + Authentik OIDC via `firm-auth`. All routes protected by `requireSession()` and RBAC‑checked via `requirePermission()`.
- **Tenant isolation:** `tenantId` from `SessionContext`; `CrossTenantAccessError` is always 403.
- **API Layer:** Internal communication uses tRPC. External endpoints are REST + OpenAPI (generated from Zod schemas).
- **Observability:** `GET /api/health`, Prometheus metrics on `:9090/metrics`, structured logs to Loki.
- **Security:** CSP via `proxy.ts`, Arcjet v1.0 per‑tenant rate limiting.
- **Deployment:** Vercel Pro (except `platform-booking` which is self‑hosted on Hetzner via Coolify).

---

## 2. Subdomain & Build Order

| App | Subdomain | Phase |
|-----|-----------|-------|
| `platform-analytics` | `analytics.[agency]` | Month 2, Week 1 |
| `platform-portal` | `portal.[agency]` | Month 2, Week 2 |
| `platform-reputation` | `reputation.[agency]` | Month 2, Week 3 |
| `platform-seo` | `seo.[agency]` | Month 2, Week 4 |
| `platform-booking` | `booking.[agency]` | Month 3, Week 1 |
| `platform-crm` | `crm.[agency]` | Month 3, Week 2 |
| `platform-email` | `email.[agency]` | Month 3, Week 3 |
| `platform-content` | `content.[agency]` | Month 4+ (when 5+ clients on Keystatic) |

---

## 3. App Summaries

### `platform-analytics`
Unified analytics dashboard consolidating Umami, Google Search Console, Google Ads, Meta Ads, form submissions, bookings, and reputation. All PII masked server‑side.

### `platform-portal`
Primary client hub. White‑label enabled (custom domain). Includes dashboard, analytics summary, content approval queue, booking overview, file delivery (signed URLs), invoice history, support tickets.

### `platform-reputation`
Automated review generation via email/SMS. Pulls reviews from Google Business Profile. AI‑drafted response suggestions (require human approval). FTC‑compliant (no review gating).

### `platform-seo`
Rank tracking, technical audit runner, keyword research, GSC integration, competitor comparison, scheduled SEO reports.

### `platform-booking`
Native appointment scheduling. Phase 1 wraps Cal.com v2; Phase 2 is a native engine. Self‑hosted for maximum retention. Reminder sequences via email + SMS.

### `platform-crm`
Contact management, lead pipeline, activity timeline. Syncs bidirectionally with external CRMs (GoHighLevel, HubSpot). Per‑tenant credentials in Infisical.

### `platform-email`
Email campaign builder, broadcast sends, drip automations. CAN‑SPAM/GDPR compliant. Consent‑gated for marketing sends. Unsubscribe honored immediately.

### `platform-content`
Branded CMS portal with AI content generation. Built when Keystatic friction points are understood at scale. Editorial workflow: Draft → Review → Client Approval → Publish.

---

## 4. Compliance Summary

| Requirement | Implementation |
|-------------|---------------|
| GDPR opt‑in consent | `firm-consent` gate |
| CCPA / GPC opt‑out | `Sec-GPC` header in `proxy.ts` |
| TCPA SMS opt‑in | Explicit opt‑in checkbox |
| CAN‑SPAM | Unsubscribe + physical address |
| PII masking | Server‑side hash before render |
| Data retention | Configurable per client, auto‑purge |