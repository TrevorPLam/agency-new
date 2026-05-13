# Governance & Cost Management – How We Keep the Platform Lean and Compliant

This guide covers our financial controls, vendor management, architectural governance, and internal tooling policies. For market analyses or vendor comparisons, see the archived research.

---

## 1. Financial Planning & Cost Control

### Per‑Client Cost Attribution
Every tenant‑scoped resource includes a `tenant.id` label in metrics and logs, enabling per‑client cost breakdowns for:
- Build minutes, bandwidth, asset storage
- Database compute, storage, and I/O
- AI token consumption (by model and task)
- Email sends and SMS messages

Cost data flows into Grafana dashboards and feeds into the monthly billing report. **Note:** The `ai_generation_log` database table is the single source of truth for AI cost billing and client attribution. Grafana dashboards are derived from this authoritative source.

### FOCUS 1.3 (FinOps Standard)
We follow the **FinOps Open Cost and Usage Specification** to normalize billing data across Vercel, Cloudflare, Neon, and Hetzner. This enables consistent financial reporting regardless of the underlying cloud vendor.

### Usage Limits & Overages
| Usage Level | Action |
|------------|--------|
| <80% of included | No action |
| 80–100% | Informational note in monthly report |
| 100–150% (first) | Account manager contacts client; no charge |
| >150% or repeated | Overage rate applied; plan upgrade proposed |

### Overage Collection Mechanism
- **Collection method**: Invoiced monthly via automated system
- **Late payment handling**: 30-day grace period, then automated reminders
- **Dispute resolution**: Account manager mediation, documented in ADR

### Vercel Spend Management
Spend Management is **opt‑in**. We explicitly enable “Pause Production Deployments” after setting the caps. Notifications are set at 50% and 75% of the budget.

---

## 2. Vendor Management & Exit Strategy

### Critical Vendor Inventory
Every critical service (Neon, Vercel, Cloudflare, Resend, Inngest) has a documented migration path and estimated effort.

| Service | Replacement | Est. Effort |
|---------|-------------|-------------|
| Vercel | Self‑hosted Coolify on Hetzner | 1 week per app |
| Neon | Self‑hosted PostgreSQL (on `vps-db`) | 2 days |
| Cloudflare Workers | Netlify, or Caddy + object storage | 1 day per site |
| Resend | AWS SES or Postmark | 2–3 days |
| Authentik | Keycloak or Zitadel | 2–3 days |

### Sunset Triggers
- **GDPR consent record retention**: All consent records must be demonstrable on demand for 90 days minimum; reference `docs/stack/features/cnil-email-pixels.md`
- **Terms of Service change** that exposes client data or conflicts with client contracts.
- **Acquisition** by a company with poor privacy/security track record.
- **End‑of‑life** or deprecation announcement.
- **Critical unpatched CVE** with no vendor response within 30 days.

### Data Portability
All client data is exportable in open, documented formats (CSV, JSON, SQL dump). Exports are tested quarterly. The agency guarantees complete data delivery within 14 days of offboarding.

### Consent Record Retention (CNIL Compliance)

**CNIL Requirement:** Consent records for email tracking pixels must be retained for the duration of data-processing activity and be demonstrable to CNIL on demand.

**Storage Requirements:**
- **Consent timestamps:** Store `consentedAt` date when consent is collected
- **Consent flags:** All granular consent choices (performance analytics, personalisation, profiling)
- **Audit trail:** Complete history of consent changes and withdrawals
- **Retention period:** Minimum 24 months, aligned with data-processing activity duration
- **Demonstrability:** Ability to export consent records for CNIL audits on demand

**Cost Implications:**
- Additional database storage for consent metadata and audit trail
- Increased backup requirements for consent records
- Extended retention periods may increase storage costs by 15-20%

**Implementation Status:** ✅ Supported via `@firm/db` consent record storage and audit logging

---

## 3. Architectural Governance

### Architecture Decision Records (ADRs)
Significant technical decisions are captured as ADRs in `docs/adr/`. Each ADR records the context, decision, consequences, and alternatives considered.

ADRs follow an append‑only log:
- **Proposed** → **Accepted** (merged, in force) → **Superseded** (replaced by newer ADR with link) → **Deprecated** (kept as historical record).
- Once accepted, ADRs are never edited — only superseded.

### Package Ownership Metadata
Every package declares ownership and support tier in its `package.json` under a `firm` key:

```json
{
  "firm": {
    "owner": "frontend-team",
    "support_tier": "critical",
    "runbook": "docs/runbooks/ui-troubleshooting.md",
    "sla": "99.9%"
  }
}
```

### Module Deprecation Lifecycle
1. Mark as deprecated in TSDoc (`@deprecated`).
2. Create `DEPRECATED.md` in package root.
3. Add ESLint rule warning on imports.
4. Set removal date as comment (`// TODO: Remove after YYYY‑MM‑DD`).
5. Deletion commit with `git note` documenting what was removed and why.

---

## 4. Secret Management & Access Control

- All secrets live in **Infisical** (self‑hosted on `vps-primary`).
- CI authenticates via OIDC machine identities — no long‑lived tokens.
- **Rotation policy:**
  - Database passwords: 90 days (Infisical automated)
  - API keys: 90 days
  - JWT signing keys: 90 days (manual, zero‑downtime overlap)
- Repository access is governed by **GitHub Rulesets** (branch protection, required reviews, merge queue).

---

## 5. Documentation Standards

- All documentation follows the **Diátaxis** framework: Tutorials, How‑to guides, Reference, Explanation.
- Internal docs are built with **VitePress** and deployed to `docs.[agency-domain].com`.
- Architecture diagrams follow the **C4 model** (Context, Container, Component), authored in PlantUML and version‑controlled.
- Runbooks follow a standard template (Purpose, Prerequisites, Steps, Rollback, Test Validation).

---

## 6. Client‑Specific Documentation

Every client has a dedicated directory: `docs/clients/<slug>/` containing:
- `legal/contract-summary.md`, `dpa.md`
- `compliance/consent-config.md`
- `launch-checklist.md` (completed, signed)
- `runbook.md` (DNS, CMS credentials location, emergency contacts)
- `analytics/` (archived monthly reports)
- `content-inventory.md` (page list, last review date)

---

*Related: [frontend.md](../core/frontend.md), [infrastructure.md](../infrastructure/infrastructure.md), [deployment.md](../infrastructure/deployment.md), [client-lifecycle.md](../features/client-lifecycle.md)*
```

Next file: `docs/stack/ai.md` — the merged AI implementation guide.**Generating `docs/stack/ai.md`**

```markdown
# AI Strategy – How We Build AI Features into the Platform

This guide covers our LLM gateway, model selection, brand voice system, content generation pipeline, and compliance. For market analysis or model benchmarks, see the archived research.

---

## 1. AI Philosophy

- **AI is infrastructure, not a feature.** Every platform app has an AI layer — content, SEO, ads, analytics, and personalization are AI‑native.
- **Multi‑model, not single‑vendor.** No single LLM provider is used for everything. The right model is selected per task.
- **Disclosure by default.** All AI‑generated content is tagged, tracked, and disclosed per FTC/EU requirements.
- **Human in the loop for publish.** AI drafts; humans approve. Auto‑publish is architecturally impossible.

---

## 2. LLM Provider Strategy (May 2026)

All LLM calls go through **`firm-ai-core`** — no other package calls a model SDK directly.

| Task | Primary Model | Fallback |
|------|--------------|----------|
| Long‑form content (blogs, service pages) | Claude Opus 4.7 | GPT‑5 |
| Short‑form content (social, CTAs, subject lines) | Gemini 3.1 Pro | GPT‑5 |
| Structured / analytical (reports, data extraction) | GPT‑5 | Gemini 3.1 Pro |
| Code generation (internal tools) | Claude Opus 4.7 | GPT‑5 |
| Cost‑sensitive / high‑volume (classifications) | GPT‑5 Nano | GPT‑5 |
| Embeddings / semantic search | OpenAI text-embedding-3-large | — |

Model routing is handled by `firm-ai-core` based on a `task → model` mapping table.

---

## 3. Structured Outputs (Vercel AI SDK)

All AI responses are validated with Zod schemas using the Vercel AI SDK `Output.json()`:

```typescript
import { generateText, Output } from 'ai';
import { z } from 'zod';

const result = await generateText({
  model: anthropic('claude-opus-4-7'),
  output: Output.json(z.object({
    sentiment: z.enum(['positive', 'negative', 'neutral']),
    confidence: z.number().min(0).max(1),
  })),
  prompt: 'Analyze this text...',
});
```

The `strict: true` guarantee ensures 100% schema conformance — the model cannot produce a token that would break the schema.

---

## 4. Package Architecture

```
packages/
├── firm-ai-core/              ← LLM abstraction, model routing, cost tracking, budget enforcement
├── firm-ai-brand-voice/       ← Per‑client voice profile, tone analysis, embedding storage
├── firm-ai-content/           ← Blog, service pages, social, email copy generation
├── firm-ai-seo/               ← Meta descriptions, title tags, schema markup, programmatic SEO
├── firm-ai-ads/               ← Ad copy variants, A/B test generation, creative fatigue detection
├── firm-ai-analytics/         ← NL insight generation, anomaly detection, report narration
├── firm-ai-personalization/   ← Dynamic CTA, geo‑based content, return‑visitor recognition
└── firm-ai-agent/             ← (Future) Autonomous campaign optimization, predictive budget allocation
```

---

## 5. Brand Voice System (`firm-ai-brand-voice`)

Every client gets a brand voice profile stored in the database and as a pgvector embedding.

**Ingestion process:**
1. Agency inputs client’s existing content (website, social posts).
2. LLM analyzes tone, vocabulary, audience characteristics.
3. Profile stored; embedding used for semantic similarity matching.

**Quality control:**
- Brand voice match score returned with every generation.
- Scores below 0.75 are flagged for human review.
- Clients can mark outputs as “good example” to retrain the profile.

---

## 6. Content Generation Pipeline

```
Client request / scheduled trigger
  → firm-ai-brand-voice (inject brand context)
  → firm-ai-content (generate draft)
  → Disclosure tag attached (aiGenerated: true)
  → platform-content approval queue (Draft → Review → Client Approval → Publish)
  → Human approves → AI disclosure label rendered at publish time
```

**Auto‑publishing is never allowed.** This is an architectural constraint, not a configurable option.

---

## 7. AI Compliance (Non‑Negotiable)

### Mandatory Deadlines

| Requirement | Deadline | Scope |
|-------------|----------|-------|
| FTC endorsement disclosure | Now (enforced) | All AI‑generated marketing content |
| NY synthetic performer law | June 9, 2026 | Ads featuring “synthetic performers” distributed in New York |
| EU AI Act Article 50 | August 2, 2026 | AI‑generated content in the EU; chatbots must identify as AI |
| South Korea FTC guidelines | April 2026 | “Virtual person” label for AI‑generated endorsers |

### Platform Implementation
- Every AI‑generated content record carries `aiGenerated: true`, `model`, `generatedAt`.
- `@firm/ui` disclosure labels are **non‑removable** and **non‑configurable** by clients.
- Full audit trail retained for 24 months.
- No raw PII is ever sent to an LLM — only aggregated/anonymized data.

---

## 8. Token Budget Enforcement

Per‑tenant AI budgets are enforced at the `firm-ai-core` layer:

- **80% warning** – Prometheus alert, account manager notified.
- **90% circuit breaker** – `AiQuotaExceededError` thrown, Inngest pauses the queue.
- Budgets are configured per client in `platform-portal`.
- All costs are logged per tenant, model, and task to `ai_generation_log`.

---

## 9. AI Infrastructure

- All LLM calls are **server‑side only** — API keys never exposed to the browser.
- Non‑latency‑sensitive tasks (blog generation, programmatic SEO) are dispatched via Inngest.
- Real‑time generation (e.g., chat) uses streaming via Server‑Sent Events — client receives only the token stream.
- C2PA manifests are attached to AI‑generated content for EU AI Act compliance.

---

## 10. Roadmap to Agentic Automation

| Phase | Timeline | Capabilities |
|-------|----------|--------------|
| **Phase 1** | Q3 2026 | Analytics Agent – anomaly detection, insight narratives, scheduled reports |
| **Phase 2** | Q4 2026 | Content Agent – scheduled drafts, performance‑based topic suggestions, A/B headline testing |
| **Phase 3** | Q1 2027 | Ad Agent – creative fatigue monitoring, automated variant generation, budget pacing |
| **Phase 4** | Q2 2027 | Full Orchestrator – multi‑agent coordination, cross‑channel optimization, predictive budget allocation |

All agents operate under strict guardrails:
- Budget kill‑switches at the agent level.
- Approval gates for money‑moving or publishing actions.
- Full audit trail for every agent decision.

---

*Related: [api.md](./api.md), [background-jobs.md](./background-jobs.md), [forms.md](../features/forms.md), [governance-costs.md](../operations/governance-costs.md)*