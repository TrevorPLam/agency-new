# Master Task Index — Agency Platform Monorepo

*Every parent task across all phases, compressed for quick reference. IDs link to the full task in the respective phase document.*

---

## Phase 1 — Foundation Hardening

| ID | Compressed Description |
|----|------------------------|
| PH1.1 | Repository governance: SECURITY.md, CONTRIBUTING.md, issue/PR templates |
| PH1.2 | ADR infrastructure: directory, template, 8 blocking ADRs |
| PH1.3 | SLO definitions & runbook skeleton: 6 SLOs, per‑alert runbooks |
| PH1.4 | Rename `services/` → `workers/`, update all references |
| PH1.5 | Build `firm-config-prettier`: frozen Prettier config |
| PH1.6 | Build `firm-config-vitest`: shared Vitest config, coverage thresholds |
| PH1.7 | Build `firm-config-playwright`: shared Playwright config |
| PH1.8 | Build `firm-config-commitlint`: conventional commits enforcement |
| PH1.9 | Build `firm-config-docker`: hardened Node.js Dockerfile factory |
| PH1.10 | Build `firm-config-storybook`: shared Storybook config |
| PH1.11 | Build `firm-config-security-headers`: CSP/HSTS/Permissions‑Policy factory |
| PH1.12 | Build `firm-config-k6`: shared k6 load‑test config |
| PH1.13 | Update existing Layer 0 configs: worker variant, v4 export, serverExternalPackages, ESLint rules |
| PH1.14 | Fix `firm-cache` TTL bug, add `acquireLock`, `warmCache`, full tests (Fix 1) |
| PH1.15 | Fix `firm-security` import bug (Fix 2a), prepare for rate‑limiter extraction |
| PH1.16 | Fix `firm-auth` types, remove deprecated impersonation (Fix 3) |
| PH1.17 | Fix `firm-validators` imports, migrations, add factory schemas (Fix 4) |
| PH1.18 | Fix `firm-db` pre‑split: outbox import, softDelete types, RLS API (Fix 5) |
| PH1.19 | Fix `firm-request-context` design flaw, module augmentation, full tests (Fix 6) |
| PH1.20 | Fix `firm-observability`: undeprecate, add `withTenantSpan`, tests (Fix 7) |
| PH1.21 | Extract `firm-primitives` from `firm-types`: branded IDs, gatekeepers (Fix 8) |
| PH1.22 | Fix `firm-logger` split‑brain, add child loggers, sampling, test logger (Fix 9) |
| PH1.23 | Fix `firm-health` synthetic runner, add OTel health check, event‑driven registration (Fix 10) |
| PH1.24 | Add `checkQuota()` to `firm-metering`, CI enforcement script (Fix 11) |
| PH1.25 | Build `adapters-storage-local`: filesystem storage adapter (Fix 13) |
| PH1.26 | Split `firm-db` → `firm-db-schema` + `firm-db-client` (Fix 14) |
| PH1.27 | Create `firm-db-read` (CQRS read model), per ADR‑004 |
| PH1.28 | Extract `firm-rate-limiter` from `firm-security`, full test suite (Fix 2b) |
| PH1.29 | Rename `firm-test-utils` → `firm-testing`, expand harnesses (Fix 15) |
| PH1.30 | Add missing utilities to `firm-utils`: `retry`, `sleep`, `paginate` |
| PH1.31 | Add missing error helpers: `isRetryable`, `toTRPCError`, `toHTTPResponse` |
| PH1.32 | Add crypto functions (`generateSecureToken`, `encryptField`), remove `generateUUID` |
| PH1.33 | Enhance `firm-env`: secret format validation, `environment` export |
| PH1.34 | Enhance `firm-api-contracts`: `deprecateEvent`, webhook envelope, domain routers |
| PH1.35 | Fix `firm-consent` bugs, add Google Consent Mode v3, TCF 2.2, CNIL pixel suppression |
| PH1.36 | Build CI pipeline and all enforcement scripts (16 gates) |
| PH1.37 | Set up release workflow with SLSA provenance |
| PH1.38 | Create `local-dev/` Docker Compose stack |
| PH1.39 | Create `load-tests/` with 3 baseline k6 scenarios |
| PH1.40 | Create `chaos/` with Toxiproxy scenarios (Redis‑down, outbox crash, PgBouncer) |
| PH1.41 | Build adapter scaffolding generator (`pnpm turbo gen adapter`) |
| PH1.42 | Partition `infra/` into regional structure (`us‑east‑1`, `eu‑west‑1`, `shared`) |

---

## Phase 2 — Infrastructure Foundation

| ID | Compressed Description |
|----|------------------------|
| PH2.1 | Build `firm-bus`: outbox processor, cron, sagas (ADR‑001) |
| PH2.2 | Build `firm-flags`: feature flags with expiration, Redis circuit breaker |
| PH2.3 | Build `firm-metering` (full): usage aggregation, quota enforcement API |
| PH2.4 | Build `firm-audit`: immutable, cryptographically chained audit log |
| PH2.5 | Build `firm-i18n`: locales, formatting, RTL, ICU MessageFormat |
| PH2.6 | Build `firm-template-engine`: Liquid/Handlebars rendering with versioning |
| PH2.7 | Build `firm-media`: file storage, image processing, CDN, quota‑enforced |
| PH2.8 | Build `firm-tenant-config`: per‑tenant config resolution, plan merging, versioning |
| PH2.9 | Build `firm-payments`: Stripe checkout, webhook handling, split payments |
| PH2.10 | Build `firm-notifications`: multi‑channel delivery, digest batching, consent gate |
| PH2.11 | Build `firm-webhooks`: outbound delivery, signing, retry, test ping, mTLS |
| PH2.12 | Build `firm-search`: full‑text search, tenant isolation, faceting (ADR‑002) |
| PH2.13 | Build `firm-sse`: Server‑Sent Events for real‑time updates |
| PH2.14 | Build `firm-ai`: AI infra (model routing, cost metering, lead scoring) |
| PH2.15 | Build `firm-migrations`: migration runner and drift check |
| PH2.16 | Build `firm-seed`: deterministic seed data for dev/test |
| PH2.17 | Build `firm-kpi`: business KPI telemetry, anomaly detection |
| PH2.18 | Build `firm-sdk` (Layer 2): typed client, pagination, webhook verification |

---

## Phase 3 — Adapters (105 adapters in 25 groups)

| ID | Compressed Description |
|----|------------------------|
| PH3.1 | Critical missing adapters: PDF generator (Puppeteer), AI image (OpenAI/Stability), video conf (Zoom/Meet), email validation (ZeroBounce) |
| PH3.2 | CRM adapters (7): HubSpot, Salesforce, GoHighLevel, Pipedrive, Zoho, ActiveCampaign, Keap |
| PH3.3 | Email adapters (6): Resend, SendGrid, SES, Postmark, SMTP, Mailgun |
| PH3.4 | AI Model adapters (4): OpenAI, Anthropic, Google AI, Azure OpenAI |
| PH3.5 | Cloud Storage adapters (2): S3, R2 |
| PH3.6 | Payment adapters (4): Stripe, Paddle, PayPal, Square |
| PH3.7 | SMS adapters (4): Twilio, Vonage, MessageBird, Sinch |
| PH3.8 | Analytics adapters (5): GA4, Plausible, Fathom, Mixpanel, PostHog |
| PH3.9 | CRO adapters (4): Hotjar, CrazyEgg, Optimizely, VWO |
| PH3.10 | SEO Data adapters (4): SearchConsole, Semrush, Ahrefs, Moz |
| PH3.11 | Paid Ads adapters (4): Google Ads, Meta Ads, LinkedIn Ads, TikTok Ads |
| PH3.12 | CMS adapters (4): Sanity, Strapi, Directus, Contentful |
| PH3.13 | Booking adapters (4): Cal.com, Google Calendar, Outlook, Acuity |
| PH3.14 | Accounting adapters (3): QuickBooks, Xero, FreshBooks |
| PH3.15 | Social adapters (4): Meta, Twitter, LinkedIn, TikTok |
| PH3.16 | Review adapters (3): Google Business, Trustpilot, Yelp |
| PH3.17 | Proposal/Signing adapters (4): PandaDoc, Qwilr, DocuSign, Dropbox Sign |
| PH3.18 | Project Management adapters (4): Asana, Trello, Monday, ClickUp |
| PH3.19 | Design adapters (3): Figma, Canva, Adobe CC |
| PH3.20 | Video adapters (4): YouTube, Vimeo, Wistia, Mux |
| PH3.21 | Chat adapters (4): Intercom, Drift, Tidio, WhatsApp |
| PH3.22 | SCIM adapters (2): Okta, Azure AD |
| PH3.23 | Remaining Email Validation adapters (2): NeverBounce, Kickbox |
| PH3.24 | Remaining PDF Generator adapter (1): PdfShift |
| PH3.25 | Remaining Video Conferencing adapter (1): Microsoft Teams |

---

## Phase 4 — Operations Layer

| ID | Compressed Description |
|----|------------------------|
| PH4.1 | `firm-provisioning`: tenant lifecycle saga (create, upgrade, suspend, offboard) |
| PH4.2 | `firm-compliance`: GDPR erasure (2‑phase), data export, residency checks |
| PH4.3 | `firm-projects`: project/task management, kanban, time tracking |
| PH4.4 | `firm-sales-pipeline`: deal pipeline, forecasting, lead scoring integration |
| PH4.5 | `firm-documents`: PDF generation, e‑signature, proposals, collaborative review |
| PH4.6 | `firm-appointments`: booking pages, staff availability, group appointments, reminders |
| PH4.7 | `firm-workflow`: internal process automation (ADR‑009 condition model) |
| PH4.8 | `firm-integrations`: unified integration dashboard, health scoring, token refresh |

---

## Phase 5 — Revenue Packages

| ID | Compressed Description |
|----|------------------------|
| PH5.1 | `firm-subscriptions`: plan lifecycle, entitlements, grace periods, grandfathering |
| PH5.2 | `firm-billing`: invoicing, revenue recognition, dunning, multi‑currency, tax jurisdiction |

---

## Phase 6 — Client‑Facing & Marketing

| ID | Compressed Description |
|----|------------------------|
| PH6.1 | `firm-reporting`: analytics engine, branded reports, CQRS read model |
| PH6.2 | `firm-cms`: headless CMS, content staging, multilingual, SEO metadata |
| PH6.3 | `firm-forms`: form builder, conditional logic, partial save, CRM field mapping |
| PH6.4 | `firm-landing-pages`: block‑based page builder, A/B testing, Core Web Vitals, consent‑gated pixels |
| PH6.5 | `firm-funnels`: marketing automation, cross‑channel sequences, analytics |
| PH6.6 | `firm-social`: cross‑platform scheduling, social listening, inbound DM routing |
| PH6.7 | `firm-seo`: keyword tracking, site audits, structured data, SERP features |
| PH6.8 | `firm-reputation`: review monitoring, SLA alerts, AI‑suggested replies (human‑approved) |
| PH6.9 | `firm-ads`: campaign management, performance aggregation, ad fatigue detection |
| PH6.10 | `firm-ai-content`: AI generation with mandatory human‑approval gate, C2PA, content moderation |
| PH6.11 | `firm-inbox`: unified conversation inbox, assignment, SLA, real‑time updates |

---

## Phase 7 — Client Portal

| ID | Compressed Description |
|----|------------------------|
| PH7.1 | `firm-portal` API: white‑label client portal, module toggling, admin override, activity audit |
| PH7.2 | Portal worker: notifications, file sharing (presigned URLs), client approvals |

---

## Phase 8 — Applications, Workers, Infrastructure

| ID | Compressed Description |
|----|------------------------|
| PH8.1 | `workers/outbox-processor`: outbox polling loop, graceful shutdown |
| PH8.2 | `workers/email-delivery-worker`: email sending, consent check, bounce handling |
| PH8.3 | `workers/sms-delivery-worker`: SMS sending, delivery receipts |
| PH8.4 | `workers/pdf-generation-worker`: PDF rendering via Puppeteer/PdfShift |
| PH8.5 | `workers/media-processing-worker`: image variants, EXIF stripping, dedup |
| PH8.6 | `workers/cron-worker`: cron scheduler, distributed lock, one‑time delayed events |
| PH8.7 | `workers/erasure-worker`: GDPR Phase 2 hard delete |
| PH8.8 | `workers/search-indexing-worker`: index updates from domain events |
| PH8.9 | `workers/reporting-worker`: scheduled report generation and delivery |
| PH8.10 | `workers/webhook-delivery-worker`: outbound webhook dispatch with retry |
| PH8.11 | `workers/integration-health-worker`: periodic health checks, OAuth token refresh |
| PH8.12 | `workers/audit-archive-worker`: archive old audit logs, verify integrity, delete |
| PH8.13 | `workers/kpi-anomaly-worker`: periodic KPI anomaly detection and alerts |
| PH8.14 | Platform applications: all apps per ADR‑005, with auth, theming, feature packages |
| PH8.15 | Agency marketing site: public website, CMS‑driven, lead capture, consent |
| PH8.16 | Client site generation: ephemeral site generation from config, per ADR‑006 |
| PH8.17 | Finalise infrastructure: Prometheus targets, Grafana dashboards, runbooks complete |
| PH8.18 | `tools/catalog/`: auto‑generated internal developer portal |
| PH8.19 | Configure Renovate for automated dependency updates |
| PH8.20 | Configure DNS via DNSControl |
| PH8.21 | Cross‑cutting integration tests: all 7 data‑flow scenarios (A–F1/F2) |