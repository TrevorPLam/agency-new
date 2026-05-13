# Client Lifecycle & Operations – How We Onboard, Operate, and Offboard Clients

This guide covers the operational procedures for managing client sites on the platform. For market analysis or vendor comparisons, see the archived research.

---

## 1. Onboarding

Onboarding transforms a signed contract into a live client site. We target **under 1 hour** from contract to live preview using automation.

### Stages

| Stage | Actions |
|-------|---------|
| **A – Legal & Discovery** | Contract executed (MSA, SOW, DPA). Slug assigned (unique, hyphenated). Internal kickoff notification sent. |
| **B – Infrastructure** | Infisical project created, DNS records added to DNSControl, deployment project provisioned on Vercel (or Cloudflare), SSL certificates automatically provisioned. |
| **C – Application** | Site scaffolded via `pnpm generate app-client`. Design tokens, SEO defaults, analytics, consent banner, and form/CRM integration wired. For scaffolding template maintenance, see [Developer Guide](../development/developer-guide.md). |
| **D – Launch Gates** | All automated checks must pass. Content replaced with client data. Domain cut over to production. Post‑launch monitoring for 48–72 hours. |

---

## 2. Launch Checklist

Every client site must pass a standardized launch checklist before going live.

### Automated Gates (enforced by CI)
- Lint, type‑check, unit/integration tests
- Accessibility audit (axe‑core – zero critical violations)
- Performance budget (Lighthouse CI)
- Security scan (Semgrep/CodeQL – no high severity)
- Content validation (all content passes Zod schema checks)
- Structured data validation (JSON‑LD passes Rich Results Test)

### Human Gates
| Gate | Approver |
|------|----------|
| Visual design sign‑off | Designer |
| Copy & content review | Client or copywriter |
| Legal / privacy review | Compliance officer |
| SEO review | SEO specialist |
| Form functionality | QA / Developer |
| Client sign‑off | Client contact (written approval) |
| CNIL compliance | Compliance officer |

---

## 3. Content Update Workflow

- **CMS self‑service (headless CMS):** Client edits → publish → webhook triggers ISR revalidation or static rebuild.
- **Git‑based PR (Keystatic):** Client edits via admin UI → opens PR → reviewer approves → production redeploy.
- **Emergency hotfix:** Developer creates hotfix PR, expedited approval, merges directly.

---

## 4. On‑Call Rotation

- **Model:** Weekly rotation with one primary and one secondary, rotating among DevOps and senior developers.
- **Escalation path:** Primary on‑call → Tech Lead → CTO / Engineering Manager → Account Manager (for client‑facing incidents).
- **Tooling:** PagerDuty for enterprise clients, Slack webhooks for smaller teams. On‑call schedule published in a shared calendar.

---

## 5. Incident Response

### Severity Classification

| Severity | Definition | Response SLA |
|----------|------------|--------------|
| **P1 – Critical** | Complete outage or data breach. All users affected, or client’s primary revenue stream down. | Acknowledge ≤15 min; mitigate ≤1 hour |
| **P2 – Major** | Significant degradation, subset of users or critical feature affected. | Acknowledge ≤30 min; mitigate ≤4 hours |
| **P3 – Minor** | Non‑critical, workaround exists. | Acknowledge ≤1 business day; fix in next sprint |

Any data breach or suspected PII exposure is automatically P1 and follows the security incident sub‑procedure.

### Response Procedure
1. **Detect & Acknowledge:** On‑call acknowledges alert.
2. **Assess & Declare:** Verify impact, declare severity, open dedicated incident channel.
3. **Mitigate:** Stop the bleeding (rollback, failover, block offending IP). Do not wait for root cause.
4. **Resolve:** Implement permanent fix or stable workaround.
5. **Communicate:** Internal updates every 30 min (P1) or 2 hours (P2). Client notification within 1 hour (P1) or 2 hours (P2).
6. **Close:** All‑clear message with impact summary. Post‑mortem (blameless) within 5 business days for all P1s.

### Security Incident Sub‑Procedure
- Isolate (rotate all potentially compromised secrets)
- Preserve evidence (snapshot databases, copy logs to secure write‑only storage)
- Engage legal counsel before external communication
- Notify authorities and affected parties under legal guidance

---

## 6. Offboarding

When a contract ends, offboarding ensures clean separation and data delivery.

### Standard Offboarding (T‑30 days)
| Timeline | Action |
|----------|--------|
| T‑30 days | Account manager records written termination |
| T‑14 days | Export all client‑owned data (database records, uploaded files, analytics) in machine‑readable format |
| T‑10 days | Extract client‑specific code (agency retains shared infrastructure; client owns bespoke work) |
| T‑7 days | Transfer domain ownership or point DNS to client’s new hosting |
| Day of termination | Rotate all shared secrets so departing client cannot access agency infrastructure |
| T+48 hours | Delete deployments, remove databases, cancel monitoring, retain backups per compliance |
| T+30 days | Follow‑up for feedback, testimonials, referrals |

### Emergency Offboarding
For contract breach or abuse: 48‑hour timeline with legal oversight. Data export runs in parallel.

---

## 7. SLOs & Client Health

### SLO Framework
- Define SLOs per client service tier (e.g., 99.9% availability for premium, 99.5% for standard).
- Instrument SLIs in Prometheus/Grafana.
- Monitor error budget burn rate. When budget is exhausted, freeze feature deploys and invest in reliability.

### Client Health Scoring
Aggregated from signals with weighted contributions:
- **Portal login frequency** (25%): Regular client engagement indicates satisfaction
- **Content approval velocity** (20%): Faster approval cycles suggest good workflow
- **Report open rates** (15%): High engagement with delivered reports
- **Support ticket frequency** (20%): Low ticket volume indicates platform reliability
- **Invoice payment timeliness** (20%): Prompt payments suggest financial health
- Automated intervention workflows: notify account manager when score drops below threshold, escalate to executive at critical level.

### SLA Breach Alerts
Configure at 50%, 75%, 90%, 100% of breach window so that team can react before client notices. Client SLO dashboards are exposed via:
- **Grafana embedded view** with tenant-specific filters
- **Monthly PDF reports** automatically generated and emailed to account managers

---

*Related: [deployment.md](../infrastructure/deployment.md), [governance-costs.md](../operations/governance-costs.md), [ci-cd.md](../development/ci-cd.md), [email.md](../integrations/email.md)*