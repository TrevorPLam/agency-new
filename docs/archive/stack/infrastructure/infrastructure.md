# Infrastructure – How We Self‑Host Services on Hetzner

This guide describes our physical and logical infrastructure. All self‑hosted services are deployed via Coolify on Hetzner Cloud. Vercel handles client sites and platform apps; this document covers the services that run on our own hardware.

---

## 1. Philosophy

- **Vercel for code, Hetzner for state.** Client sites and platform apps deploy to Vercel. Databases, identity, secrets, monitoring, and background services run on Hetzner VPS instances — owned infrastructure, no vendor lock‑in.
- **Coolify as the control plane.** All Docker services on Hetzner are managed via Coolify v4. No manual Docker Compose in production.
- **Zero long‑lived credentials.** CI authenticates via OIDC tokens. Secrets are stored in Infisical, never in `.env` files on servers.
- **Infrastructure as Code.** DNS, monitoring configs, and deployment definitions are version‑controlled in the `infra/` directory.

---

## 2. VPS Layout

### Why Hetzner (post‑April 2026 pricing)
- CPX22 (2 vCPU / 4 GB) at ~€7.99/month, CPX31 (4 vCPU / 8 GB) at ~€15.99/month.
- 20 TB egress included (EU regions), GDPR‑compliant, ISO 27001.
- Proven integration with Coolify.

### Server Map

| Server | Type | Monthly Cost | Services |
|--------|------|-------------|----------|
| `vps-primary` | CPX31 (4 vCPU, 8 GB) | ~€15.99 | Coolify, Authentik, Infisical, Verdaccio |
| `vps-observability` | CPX21 (3 vCPU, 4 GB) | ~€9.99 | Prometheus, Grafana, Loki, Alertmanager, Promtail |
| `vps-db` | CPX31 (4 vCPU, 8 GB) | ~€15.99 | PostgreSQL (future self‑hosted), Redis, Umami |
| `vps-workers` | CPX21 (3 vCPU, 4 GB) | ~€9.99 | Inngest workers, background job runners |

**Total: ~€51.96/month.** Starter configuration (omit `vps-db` and `vps-workers`): ~€25.98/month.

### Networking
- All servers communicate over Hetzner’s private network (`10.0.0.0/16`).
- Hetzner Cloud Firewall blocks all inbound traffic except ports 80/443 and SSH from agency IP allowlist.
- UFW and Fail2ban provide host‑level protection.

---

## 3. Coolify Control Plane

**Coolify v4** runs on `vps-primary` and provides a Vercel‑like experience on owned hardware.

- Deploys Docker services across all VPSes using a single dashboard.
- Built‑in **Traefik** reverse proxy handles automatic TLS (Let’s Encrypt) for all services.
- Git‑triggered deployments: push to GitHub → Coolify builds and redeploys.
- Health checks and automatic container restarts.
- Automated backups of databases to Hetzner Storage Box.

### Coolify Self‑Monitoring
- **Health check endpoint** on separate VPS monitors Coolify service availability
- **Uptime Kuma** or external monitoring service checks Coolify dashboard accessibility
- **Failure recovery**: If Coolify becomes unavailable, manual redeployment via SSH and Docker CLI fallback

| Service | Host | URL |
|---------|------|-----|
| Authentik (Identity) | `vps-primary` | `auth.[agency-domain].com` |
| Infisical (Secrets) | `vps-primary` | `secrets.[agency-domain].com` |
| Umami (Analytics) | `vps-db` | `umami.[agency-domain].com` |
| Prometheus | `vps-observability` | `prometheus.[agency-domain].com` (internal) |
| Grafana | `vps-observability` | `grafana.[agency-domain].com` |
| Loki | `vps-observability` | (internal only) |
| Alertmanager | `vps-observability` | (internal only) |
| Promtail | all VPSes | (internal) |
| Verdaccio (npm) | `vps-primary` | `npm.[agency-domain].com` |
| Redis | `vps-db` | (internal) |

---

## 4. Database Layer

### Primary: Neon (Serverless PostgreSQL)
- All application data uses Neon, with PgBouncer connection pooling built in.
- Per‑PR preview branches via Neon API in CI.
- Nightly `pg_dump` to Hetzner Storage Box.
- Launch plan: $19/month (10 GB storage).

### Self‑Hosted PostgreSQL (Fallback on `vps-db`)
- Provisioned only if Neon costs exceed thresholds or compliance requires full data control.
- Managed via Coolify, with automated backups.

### Redis (on `vps-db`)
- Used by Inngest, session cache, rate limiting, and circuit breakers.
- **Replication plan**: Start with single node; add Sentinel when session storage becomes critical for high‑traffic clients
- Used by Inngest, session cache, rate limiting, and circuit breakers.
- AOF persistence enabled, RDB snapshots.

---

## 5. DNS & Domains

- Cloudflare proxies all domains for DDoS protection and CDN.
- DNS records are defined as code with **DNSControl** (version‑controlled in `infra/dns/`).
- Agency domain, platform apps, and self‑hosted services are all managed via DNSControl.
- Sensitive services (`coolify.*`, `secrets.*`) are restricted to agency IPs via Cloudflare Zero Trust Access.

---

## 6. Observability Stack

All components run on `vps-observability`.

### Prometheus
- Scrapes `/metrics` from all platform apps and node exporters every 15s.
- Retention: 30 days.
- Config and alert rules live in `infra/prometheus/`.
- **AI Cost Tracking**: The `ai_tokens_used_total` metric is incremented from the DB log write path to ensure synchronization. Weekly reconciliation compares Prometheus aggregates against `SUM(cost_cents)` from the `ai_generation_log` table and alerts on discrepancies >1%.

### Grafana
- Dashboards as code in `infra/grafana/dashboards/`.
- SSO via Authentik.
- Alerting routes to Alertmanager → Slack + PagerDuty.

### Loki
- Aggregates structured JSON logs from all services via Promtail.
- Retention: 30 days hot, 90 days warm, archive to Storage Box.

### Log Volume Growth
- **Estimated ingestion**: 50 GB/day across all services
- **Cost trade‑offs**: Hot 30 days, warm 90 days, archive cold storage
- **Monitoring**: Track Loki storage costs and alert when approaching retention limits
- Routes alerts by severity: P2 pages on‑call, P3 notifies Slack, P4 logs tickets.
- Alert conditions: 5xx rate >5%, p95 latency >2s, service down, AI budget exceeded.

### External Synthetic Monitoring
- **Checkly** performs Playwright‑based browser checks on critical flows (form submission, booking, login).

---

## 7. Backup & Disaster Recovery

### Backup Schedule

| Data | Method | Frequency | Retention | Location |
|------|--------|----------|-----------|----------|
| Neon DB | `pg_dump -Fc` encrypted | Nightly | 30 days | Hetzner Storage Box (BX11, 1 TB) |
| Infisical secrets | Encrypted export | Weekly | 90 days | Storage Box |
| VPS snapshots | Hetzner API | Weekly | 4 snapshots | Hetzner |
| DNS records | Git repo | On change | Full history | GitHub |
| Coolify config | Git repo | On change | Full history | GitHub |

### Recovery Objectives
- **RTO:** 4 hours.
- **RPO:** 24 hours (nightly backup).
- **Quarterly restore drill** verifies recoverability.

---

## 8. Infrastructure as Code

All infrastructure configuration lives in the `infra/` directory:

```
infra/
├── dns/
│   ├── dnsconfig.js
│   └── clients/
├── prometheus/
│   ├── prometheus.yml
│   └── rules/
├── grafana/
│   └── dashboards/
├── coolify/
│   └── compose/
└── runbooks/
    ├── database-restore.md
    ├── secret-rotation.md
    └── disaster-recovery.md
```

Changes to `infra/` require PR review and are applied via CI on merge.

---

## 9. Cost Summary (Post‑April 2026)

| Item | Monthly Cost |
|------|-------------|
| Hetzner VPS (4 servers) | ~€52 |
| Hetzner Storage Box (1 TB) | ~€4 |
| Neon PostgreSQL (Launch plan) | $19 |
| Vercel Pro | $20 |
| Checkly (Starter) | $24 |
| Cloudflare | $0 (Free tier) |
| **Total** | **~$130/month** |
| **Starter (2 VPS, Neon Free)** | **~$50/month** |

---

*Related: [deployment.md](./deployment.md), [database.md](../core/database.md), [auth.md](../integrations/auth.md), [ci-cd.md](../development/ci-cd.md), [governance-costs.md](../operations/governance-costs.md)*