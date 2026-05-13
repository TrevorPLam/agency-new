# Security Baselines & Compliance

**For AI coding agents.** All generated code and infrastructure must satisfy these non‑negotiable security requirements. Violations block PR merges. For detailed implementation, see the stack books and ADRs.

---

## 1. Supply Chain Security

- **GitHub Actions:** Every third‑party action must be pinned to a full commit SHA (validated by `scripts/check-gha-shas.ts`).
- **pnpm 11 defaults:** `minimumReleaseAge: 1440` (24‑hour cooldown), `blockExoticSubdeps: true`, `allowBuilds` explicit allowlist.
- **SBOM:** Every production build generates a CycloneDX SBOM via `pnpm sbom`.
- **SLSA provenance:** All container images and deployable artifacts are signed using `actions/attest-build-provenance@v3`.

---

## 2. Secrets Management

- **Never hardcode secrets.** Use Infisical (self‑hosted) + environment variables.
- **Rotation:** Database passwords and API keys rotate every 90 days. Infisical automates where supported.
- **Machine identities:** CI uses OIDC tokens to fetch secrets — no long‑lived credentials stored in GitHub Secrets.

---

## 3. Multi‑Tenant Isolation

- **Row‑Level Security (RLS):** Every table containing `tenant_id` must have an RLS policy.
- **Application layer:** All data access functions accept `tenantId` as an explicit parameter. The `setTenantContext()` helper sets `SET LOCAL app.current_tenant_id` inside a transaction.
- **Cache isolation:** Cache keys include tenant ID (e.g., `cacheTag(`tenant-${tenantId}-blog`)`).
- **Tenant Resolution:** `proxy.ts` is the canonical boundary for Vercel deployments; `middleware.ts` is retained only for Cloudflare.

---

## 4. Input Validation & Output Sanitization

- **Zod v4 is mandatory** for all user input (API, forms, webhooks). Reject invalid input with `400`.
- **No `dangerouslySetInnerHTML`** unless content is sanitized with DOMPurify.
- **UTM parameters** are validated as injection vectors via Zod schemas.
- **File uploads:** Validate MIME type via magic bytes (not `Content-Type` header). Store in private bucket; serve via signed URLs (TTL ≤ 1 hour).

---

## 5. HTTP Security Headers

Every production response must include:
- **CSP:** Nonce‑based for SSR (`proxy.ts` generates per‑request nonce), hash‑based for SSG (Next.js 16.2 + Turbopack auto‑generates hashes).
- **HSTS:** `max-age=31536000; includeSubDomains; preload` 
- **X‑Content-Type-Options:** `nosniff` 
- **X-Frame-Options:** `DENY` 
- **Referrer-Policy:** `strict-origin-when-cross-origin` 

CI validates CSP headers per deployment target (`scripts/verify-security-headers.ts`).

---

## 6. Webhook Security

- **Signature verification:** `crypto.timingSafeEqual` for HMAC comparison.
- **Replay protection:** Reject webhooks with timestamp older than 5 minutes.
- **Idempotency:** Store and check `idempotencyKey` (from provider's event ID) with a unique database constraint.

---

## 7. AI Security & Compliance

- **EU AI Act Article 50 (deadline Aug 2, 2026):** All AI‑generated content must be labelled with C2PA manifests and non‑removable disclosure labels.
- **FTC Endorsement Guidelines:** AI‑generated marketing content must carry conspicuous disclosure.
- **Prompt injection protection:** All LLM calls pass through Arcjet v1.0 prompt injection detection.
- **Per‑tenant token budgets:** Enforced at the `firm-ai-core` layer with Redis atomic counters.

---

## 8. Privacy & Consent

- **Google Consent Mode v3 (deadline June 15, 2026):** `ad_storage` is the sole authority for Google Ads data. Every client must be audited.
- **GPC (Global Privacy Control):** The `Sec-GPC` header is respected and disables all non‑essential tracking.
- **CNIL email tracking pixels (deadline July 14, 2026):** Tracking pixels require separate, prior consent for EU recipients.
- **reCAPTCHA replaced by Cloudflare Turnstile** (privacy‑first, no cookies, GDPR‑friendly).
- **GDPR data minimization:** Only aggregated/anonymized data is sent to AI models.

---

## 9. Compliance Deadlines

| Requirement | Deadline |
|-------------|----------|
| Google Consent Mode v3 | June 15, 2026 |
| CNIL email tracking pixel consent | July 14, 2026 |
| EU AI Act Article 50 | August 2, 2026 |
| NY synthetic performer labeling | June 9, 2026 |

---

*See `docs/ai-context/82-adapters.md` for webhook security specifics, `docs/stack/ai.md` for AI compliance implementation, and `docs/stack/governance-costs.md` for vendor exit strategies.*
