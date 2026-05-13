# Disaster Recovery Runbook – Recovery Procedures for All Platform Services

**Created: May 2026**  
**Owner: DevOps Team**  
**Last tested: [Date of most recent quarterly drill]**  

*This runbook provides step‑by‑step recovery procedures for every critical service in the platform. It is designed to be executable by on‑call engineers at 2 AM with minimal context. Keep it in version control and test it quarterly.*

---

## 1. Recovery Objectives

### 1.1 RTO & RPO Targets

| Service / Data | RTO (Recovery Time) | RPO (Recovery Point) | Priority |
|---|---|---|---|
| **Neon PostgreSQL** (all client data, platform apps) | 4 hours | 24 hours (nightly pg_dump) | P1 – all client sites depend on DB |
| **Vercel Deployments** (client sites, platform apps) | <5 minutes | Zero (instant rollback) | P1 – client‑facing apps |
| **Cloudflare DNS** (all domains) | 2 hours | Zero (Git‑versioned, rebuildable) | P1 – routing for all services |
| **Infisical** (secrets) | 4 hours | 7 days (weekly encrypted exports) | P1 – no secrets = no deploys |
| **Authentik** (identity, SSO) | 4 hours | 24 hours (Coolify managed backup) | P2 – can fall back to Better Auth direct |
| **Coolify** (control plane) | 8 hours | 24 hours (Coolify self‑backup) | P2 – only needed for self‑hosted service changes |
| **Prometheus / Grafana / Loki** (observability) | 24 hours | Zero (rebuildable from IaC) | P3 – monitoring gap, not service‑affecting |
| **Redis** (session cache, rate limiting) | 4 hours | Zero (cache data only; rebuildable) | P3 – graceful degradation acceptable |
| **Umami** (analytics) | 24 hours | 24 hours (Coolify managed backup) | P4 – non‑critical for service delivery |
| **Verdaccio** (private npm registry) | 24 hours | Zero (packages re‑publishable from CI) | P4 – only blocks internal package publishes |

### 1.2 Severity Mapping

| Severity | Definition | Escalation |
|---|---|---|
| **P1 – Critical** | Total outage of a client‑facing service or data loss. | Immediate page to on‑call. Tech Lead within 15 min. |
| **P2 – Major** | Significant degradation; critical service affected but workaround exists. | Page to on‑call. Tech Lead within 1 hour. |
| **P3 – Minor** | Internal tool outage; no client impact. | Slack notification. Resolve in next business day. |
| **P4 – Low** | Non‑critical service degraded. | Log ticket. Resolve in next sprint. |

---

## 2. Backup Inventory

### 2.1 What Is Backed Up, Where, and How Often

| Data | Method | Frequency | Retention | Storage Location | Encryption |
|---|---|---|---|---|---|
| **Neon PostgreSQL** | `pg_dump -Fc` (custom format) | Nightly at 02:00 UTC | 30 days | Cloudflare R2 bucket `platform-backups` | AES‑256 (R2 server‑side) |
| **Neon PITR history** | Neon built‑in WAL archiving | Continuous | 7 days (Launch plan) | Neon managed storage | Neon managed |
| **Infisical secrets** | Encrypted export via Infisical API | Weekly (Sunday 01:00 UTC) | 90 days | Hetzner Storage Box (BX11) `infisical-exports/` | AES‑256‑GCM |
| **Coolify config** | Coolify built‑in database backup | Daily at 03:00 UTC | 30 days | Hetzner Storage Box | Coolify managed |
| **Coolify SSH keys** | Manual backup after key rotation | On change | Perpetual | 1Password vault + Storage Box | Vault‑managed |
| **VPS snapshots** (vps-primary, vps-observability, vps-db, vps-workers) | Hetzner Cloud API | Weekly (Saturday 04:00 UTC) | 4 snapshots (rolling) | Hetzner Cloud | Hetzner managed |
| **DNS records** | Git repository (`infra/dns/`) | On every merge to `main` | Full Git history | GitHub | SSH transport |
| **Grafana dashboards** | IaC files in `infra/grafana/dashboards/` | On every merge to `main` | Full Git history | GitHub | SSH transport |
| **Prometheus config & alert rules** | IaC files in `infra/prometheus/` | On every merge to `main` | Full Git history | GitHub | SSH transport |

### 2.2 Backup Verification Schedule

| Verification | Frequency | Owner | Success Criteria |
|---|---|---|---|
| Latest `pg_dump` integrity check | Weekly (automated) | CI pipeline | `pg_restore --list` shows all tables; row counts match within 1% |
| Infisical export decryptable | Monthly (automated) | CI pipeline | Export decrypts successfully with recovery key |
| Coolify backup integrity | Monthly | DevOps | Restore to staging Coolify instance |
| VPS snapshot bootable | Quarterly | DevOps | Launch snapshot as new VPS; services start |

---

## 3. Recovery Scenarios

### 3.1 Scenario A – Full Database Restore (Neon pg_dump from R2)

**When to use:** Neon is unreachable, corrupted, or data has been deleted beyond the PITR window. The nightly `pg_dump` is the last line of defence.

**RTO target:** 4 hours  
**RPO target:** 24 hours (last nightly backup)

#### Step‑by‑Step Procedure

**Prerequisites:**
- Access to Cloudflare R2 bucket `platform-backups`
- Neon account access (to create a new project)
- `pg_restore` ≥18 installed locally or on a jumpbox
- Infisical access (to retrieve Neon connection strings)

---

**Step 1 – Declare Incident (T+0 minutes)**

```
/incident declare "Neon database recovery – Scenario A"
severity: P1
rto_target: 4 hours
rpo_target: 24 hours
```

Open the dedicated incident Slack channel `#incident-[date]`. Notify the on‑call primary and secondary.

---

**Step 2 – Retrieve the Latest Backup from R2 (T+5 minutes)**

```bash
# List available backups in R2 (sorted by date, newest last)
aws s3 ls s3://platform-backups/neon-pgdump/ \
  --endpoint-url https://<account-id>.r2.cloudflarestorage.com \
  | sort

# Download the latest backup file
aws s3 cp \
  s3://platform-backups/neon-pgdump/neon-backup-2026-05-11.dmp \
  ./neon-backup-2026-05-11.dmp \
  --endpoint-url https://<account-id>.r2.cloudflarestorage.com
```

R2 credentials are stored in Infisical under `/platform/backups/r2-credentials`.

---

**Step 3 – Verify Backup Integrity (T+10 minutes)**

```bash
# List all objects in the dump to verify it's readable
pg_restore --list ./neon-backup-2026-05-11.dmp | head -50

# Quick check: verify expected table count
pg_restore --list ./neon-backup-2026-05-11.dmp | grep -c "TABLE DATA"
```

If the dump is corrupted or incomplete, fall back to the previous day's backup. Accept the additional 24 hours of data loss.

---

**Step 4 – Create a New Neon Project (T+15 minutes)**

1. Log into the [Neon Console](https://console.neon.tech).
2. Click **New Project**.
3. Name it `platform-recovery-YYYY-MM-DD`.
4. Select the same region as the original project (check Infisical for the original `DATABASE_URL` region).
5. Choose a plan with sufficient compute (at minimum Launch, $19/month).
6. Note the new **unpooled** connection string from the **Connect** modal (deselect "Connection pooling").

---

**Step 5 – Create the Target Database (T+20 minutes)**

In the Neon SQL Editor for the new project:

```sql
CREATE DATABASE neondb;
```

Or use the Neon Console to create a database named `neondb` (or match the original database name).

---

**Step 6 – Restore the Backup (T+25 minutes)**

```bash
# Restore using pg_restore with the unpooled connection string
# The -v flag provides verbose output for monitoring
# --clean drops existing objects before recreating them
pg_restore \
  -v \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  -d "postgresql://neondb_owner:<password>@<new-project-host>.aws.neon.tech/neondb?sslmode=require" \
  ./neon-backup-2026-05-11.dmp
```

**Important:** Always use an **unpooled** (direct) connection string. Pooled connections (PgBouncer) will cause `pg_restore` to fail because they don't support the `--clean` flag and certain DDL operations.

Monitor the output for errors. Common issues:
- `role "X" does not exist` → expected with `--no-owner`; safe to ignore.
- `extension "X" is not available` → install missing extensions (pgvector, pgvectorscale, TimescaleDB, pg_cron) via Neon Console before re‑running.

For a large database (>10 GB), the restore may take 30–90 minutes. You can proceed with Steps 7–8 in parallel.

---

**Step 7 – Verify Data Integrity (T+30–120 minutes)**

```sql
-- Verify row counts on critical tables
SELECT 'leads' AS table_name, COUNT(*) FROM leads
UNION ALL
SELECT 'submissions', COUNT(*) FROM submissions
UNION ALL
SELECT 'contacts', COUNT(*) FROM contacts
UNION ALL
SELECT 'ai_generation_log', COUNT(*) FROM ai_generation_log;

-- Verify tenant isolation: each tenant_id should have data
SELECT tenant_id, COUNT(*) FROM leads GROUP BY tenant_id ORDER BY 2 DESC;

-- Verify recent data: check max created_at
SELECT MAX(created_at) FROM leads;

-- Verify RLS policies are enabled
SELECT tablename, policyname, permissive, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Compare row counts against the most recent Grafana dashboard snapshot (if available) or against expected magnitudes (an order‑of‑magnitude check is better than no check).

---

**Step 8 – Reconfigure Applications (T+30–45 minutes)**

Update the database connection string in Infisical:

1. Log into Infisical.
2. Navigate to the affected project and environment (`production`).
3. Update `DATABASE_URL` to the new Neon project's **pooled** connection string (for application use; the direct string was only for restore).
4. Update `DIRECT_DATABASE_URL` to the new unpooled connection string (for migrations).
5. Trigger a re‑deploy of all affected applications via Vercel CLI:

```bash
# For each client app and platform app
vercel deploy --prod -e DATABASE_URL  # pulls from Infisical
```

---

**Step 9 – Validate Application Recovery (T+45–120 minutes)**

Run the smoke test suite against production:

```bash
pnpm smoke-test:production
```

Verify:
- [ ] Platform portal loads and displays data
- [ ] At least one client site loads and renders content
- [ ] `/api/health` returns 200 with DB ping success
- [ ] Form submission on a client site succeeds and appears in the database
- [ ] Authentication works (login, session persistence)
- [ ] Background jobs process (check Inngest dashboard for recent function runs)

---

**Step 10 – Close Incident (T+1–4 hours)**

Once all verification checks pass:

```
/incident resolve "Database restored from pg_dump backup dated YYYY-MM-DD.
Data loss window: [date of last backup] to [time of incident].
New Neon project: platform-recovery-YYYY-MM-DD.
RTO: X hours Y minutes. RPO: ~24 hours."
```

**Post‑recovery actions (within 24 hours):**
- Re‑enable nightly `pg_dump` to R2 targeting the new Neon project (update the GitHub Action cron job).
- Verify that PITR is enabled on the new project with a 7‑day window.
- Update the Neon project reference in Infisical and in platform documentation.
- Schedule a post‑mortem within 5 business days.

---

### 3.2 Scenario B – Point‑in‑Time Restore (Neon Instant PITR)

**When to use:** Accidental data deletion, bad migration, or data corruption that is detected within the PITR window (7 days on Launch plan). Neon is reachable and the database is not physically destroyed.

**RTO target:** <30 minutes  
**RPO target:** Zero data loss (restore to seconds before incident)

#### Step‑by‑Step Procedure

**Prerequisites:**
- Neon account access
- Knowledge of the incident timestamp (when the bad data was introduced)

---

**Step 1 – Declare Incident**

```
/incident declare "Neon PITR – accidental data loss"
severity: P1 (data integrity) or P2 (isolated table)
```

---

**Step 2 – Identify the Recovery Timestamp**

Determine the exact time just before the incident. For a bad migration or accidental `DELETE`, use the migration timestamp or query log. For a dropped table, identify the moment before the `DROP` was issued.

```sql
-- If you can still query the database, find recent problematic changes
SELECT query_start, query 
FROM pg_stat_activity 
WHERE query ILIKE '%DROP%' OR query ILIKE '%DELETE%';
```

---

**Step 3 – Create a Safety Backup Branch (Optional but Recommended)**

Before performing PITR, create a backup branch of the current (broken) state:

1. In the Neon Console, go to **Branches**.
2. Click **Create Branch**.
3. Name it `pre-recovery-backup-YYYY-MM-DD`.
4. Select the current root branch as the parent.

This preserves the broken state for forensic analysis.

---

**Step 4 – Perform Instant Restore**

Neon Instant Restore creates a new branch at the specified point in time, making the restored state instantly available without a traditional restore process.

1. In the Neon Console, go to **Branches**.
2. Click **Create Branch**.
3. Name it `recovery-YYYY-MM-DD`.
4. Select the affected root branch as the parent.
5. Under **Point in Time**, select the timestamp just before the incident.
6. Click **Create Branch**.

The branch is available immediately — Neon's storage engine reconstructs data at any point in the WAL history without replaying the entire log.

---

**Step 5 – Verify the Restored Data**

Connect to the recovery branch and verify:

```sql
-- Check that the dropped/affected data is present
SELECT COUNT(*) FROM <affected_table>;

-- Spot-check specific records
SELECT * FROM <affected_table> WHERE <condition> LIMIT 10;

-- Verify the timestamp is correct
SELECT NOW(); -- should be close to your recovery timestamp
```

**Note:** Instant restore is currently only supported on **root branches** (like `production` or `main`). It is not supported on branches created from a snapshot restore.

---

**Step 6 – Promote the Recovery Branch**

If the data is correct:
1. In the Neon Console, go to the **recovery-YYYY-MM-DD** branch.
2. If the branch needs to become the new root (production), you can either:
   - **Option A (preferred):** Re‑point applications to the recovery branch by updating `DATABASE_URL` in Infisical and redeploying.
   - **Option B:** If you need to reset the root branch, contact Neon Support to promote the branch.

---

**Step 7 – Validate and Close**

Run `pnpm smoke-test:production` and verify all checks pass. Close the incident with the recovery timestamp and RTO/RPO achieved.

---

### 3.3 Scenario C – Vercel Deployment Rollback

**When to use:** A bad production deployment is serving errors to users. The previous deployment was functioning correctly.

**RTO target:** <5 minutes (Instant Rollback takes effect within seconds at the routing layer)

#### Step‑by‑Step Procedure

```bash
# 1. Confirm the problem
vercel logs --environment production --status-code 5xx --since 30m

# 2. Roll back immediately (no rebuild required)
vercel rollback

# 3. Verify the rollback is in progress
vercel rollback status

# 4. Verify service is restored
vercel logs --environment production --status-code 5xx --since 5m

# 5. Identify the bad deployment
vercel list --prod
vercel inspect <bad-deployment-url>

# 6. Compare error logs between good and bad deployments
vercel logs --deployment <bad-deployment-id> --level error --expand
vercel logs --deployment <good-deployment-id> --level error --expand

# 7. Fix and re‑deploy to preview
vercel deploy
vercel curl /affected-route --deployment <preview-url>

# 8. Ship the fix to production
vercel deploy --prod
```

**Important caveats:** After a rollback, Vercel turns off auto‑assignment of production domains. New pushes to the production branch will not go live automatically. You must explicitly undo the rollback by promoting a deployment.

**Database considerations:** If the bad deployment included a migration, the database schema may no longer match the rolled‑back application code. You may need to run reverse migrations. See `docs/stack/operations/database-migration-rollback.md` (or execute the reverse SQL script stored alongside each migration).

---

### 3.4 Scenario D – DNS / Domain Failure (DNSControl Recovery)

**When to use:** DNS records are corrupted, accidentally deleted, or Cloudflare DNS is experiencing an outage.

**RTO target:** 2 hours  
**RPO target:** Zero (DNS config is Git‑versioned)

#### Step‑by‑Step Procedure

```bash
# 1. Verify the current DNS state
cd infra/dns
dnscontrol preview

# 2. Compare against the last known good commit
git log --oneline -5

# 3. If DNS records were accidentally changed, re‑push from Git
dnscontrol push

# 4. If Cloudflare DNS is down, switch to secondary provider
# (DNSControl supports 35+ providers; configure a backup provider
#  in creds.json and re‑push)
dnscontrol push --provider backup-provider

# 5. Lower TTLs temporarily for faster propagation
# Edit dnsconfig.js to set TTL(300) on critical records, then:
dnscontrol push

# 6. Verify resolution
dig api.agency-domain.com @1.1.1.1
dig client-site.com @1.1.1.1
```

**Preparation:** DNSControl supports dual DNS providers. Configure a backup provider (e.g., Route 53, Google Cloud DNS) in `infra/dns/creds.json` and add it to the `D()` declarations in `dnsconfig.js`. During a Cloudflare outage, push to the backup provider and update NS records at the registrar.

---

### 3.5 Scenario E – Full Infrastructure Rebuild from Scratch

**When to use:** Complete Hetzner infrastructure loss (all VPSes destroyed, all self‑hosted services down). This is the most extreme scenario.

**RTO target:** 24 hours  
**RPO target:** Up to 7 days for Infisical secrets; 24 hours for databases

#### Recovery Order (Dependency‑Aware)

Recovery follows a strict dependency order:

```
Hetzner VPSes
  → Coolify (control plane)
    → Infisical (secrets needed by everything else)
    → Authentik (identity needed for SSO to Grafana, etc.)
    → PostgreSQL (self‑hosted; optional if Neon is available)
    → Redis
  → Prometheus + Grafana + Loki (observability)
  → Umami (analytics)
  → Verdaccio (npm registry)
```

#### Step‑by‑Step Procedure

**Step 1 – Provision Replacement VPSes**

Using the Hetzner Cloud Console or API, recreate the four VPSes per the server map in [`infrastructure.md`](../infrastructure/infrastructure.md):

| Server | Type | IP | Purpose |
|---|---|---|---|
| `vps-primary` | CPX31 | DHCP | Coolify, Authentik, Infisical, Verdaccio |
| `vps-observability` | CPX21 | DHCP | Prometheus, Grafana, Loki, Alertmanager |
| `vps-db` | CPX31 | DHCP | PostgreSQL (self‑hosted), Redis, Umami |
| `vps-workers` | CPX21 | DHCP | Inngest workers, background runners |

Apply the standard firewall rules (Hetzner Cloud Firewall: allow 80/443 from anywhere, allow 22 from agency IP allowlist only; all other inbound denied). Enable UFW and Fail2ban on each host.

---

**Step 2 – Install and Restore Coolify**

On `vps-primary`:
```bash
# Install Coolify
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Once Coolify is running, restore from backup
# Follow the Coolify Backup and Restore guide:
# https://next.coolify.io/docs/knowledge-base/how-to/backup-restore-coolify
```

**Key restoration steps:**
1. Download the Coolify backup from Hetzner Storage Box.
2. Transfer it to the new `vps-primary`.
3. Retrieve the `APP_KEY` from the old Coolify instance's `.env` file (from 1Password vault).
4. Restore the Coolify instance using the dashboard.
5. Restore the SSH keys from the 1Password vault to `/data/coolify/ssh/keys/` so Coolify can reach the other VPSes.

---

**Step 3 – Restore Infisical**

Using Coolify, redeploy Infisical from the Git repository or Docker image. Then:

```bash
# Restore Infisical from the most recent encrypted export
# Export files are stored on Hetzner Storage Box: infisical-exports/
# Decrypt using the recovery key stored in 1Password

infisical import --projectId <project-id> \
  --file /path/to/infisical-export-2026-05-04.enc \
  --key <recovery-key>
```

After restoration, verify that all secrets are present by pulling development secrets to a local machine (`pnpm env:pull`).

---

**Step 4 – Restore Authentik**

Using Coolify, redeploy Authentik. Restore from the Coolify database backup:

```bash
# Authentik uses PostgreSQL; restore from Coolify's managed backup
# The backup file is on Hetzner Storage Box
pg_restore -v --clean -h localhost -U authentik -d authentik \
  /backups/authentik-backup-2026-05-11.dmp
```

After restoration, test SSO with a known agency account.

---

**Step 5 – Restore Self‑Hosted PostgreSQL (if needed)**

If Neon is unavailable and the fallback self‑hosted PostgreSQL must be used:

```bash
# On vps-db, restore PostgreSQL from the latest nightly pg_dump
pg_restore -v --clean -h localhost -U postgres -d postgres \
  /backups/neon-backup-2026-05-11.dmp
```

Update all `DATABASE_URL` environment variables in Infisical to point to the self‑hosted PostgreSQL instance. Redeploy all applications.

---

**Step 6 – Restore Redis**

Redis is primarily a cache; it rebuilds from scratch as applications populate it. If critical rate‑limiting data or session data must be preserved, restore from the latest AOF file:

```bash
# Copy the AOF file from backup to the Redis data directory
# Redis will replay it on startup
cp /backups/redis/appendonly.aof /var/lib/redis/appendonly.aof
systemctl restart redis
```

---

**Step 7 – Restore Observability Stack**

Prometheus, Grafana, and Loki are defined as Infrastructure as Code. Restore them by applying the configs from the Git repository:

```bash
# On vps-observability, via Coolify:
# 1. Redeploy Prometheus from infra/prometheus/prometheus.yml
# 2. Redeploy Grafana and import dashboards from infra/grafana/dashboards/
# 3. Redeploy Loki and Promtail
# 4. Configure Alertmanager routes from infra/prometheus/rules/
```

Grafana dashboard JSON files are stored in the monorepo; re‑import using the Grafana API or via the UI.

---

**Step 8 – Restore Umami and Verdaccio**

Redeploy both via Coolify from their Docker images. Umami's PostgreSQL database can be restored from the Coolify backup if analytics data continuity is required. Verdaccio packages will be re‑fetched from npmjs.org as developers publish and install.

---

**Step 9 – Full Validation**

Run the comprehensive smoke test suite:

```bash
pnpm smoke-test:production
```

Verify:
- [ ] All client sites resolve and load correctly
- [ ] Platform portal is accessible with SSO
- [ ] Secrets can be pulled from Infisical
- [ ] Form submission works end‑to‑end
- [ ] Monitoring dashboards show live data
- [ ] Alerts are firing correctly
- [ ] Background jobs are processing (Inngest dashboard)
- [ ] Database queries are scoped to correct tenants (RLS functional)

---

**Step 10 – Re‑establish Monitoring and Backups**

Once all services are running:
1. Verify Prometheus is scraping all targets.
2. Verify Grafana dashboards are populating.
3. Re‑enable the nightly `pg_dump` cron job targeting the current database.
4. Re‑enable Coolify scheduled backups.
5. Re‑enable VPS weekly snapshots.
6. Update all documentation to reflect any new IP addresses, hostnames, or connection strings.

---

### 3.6 Scenario F – Infisical Unavailability

**When to use:** Infisical is down, and applications need to be deployed or secrets need to be rotated.

**Fallback procedure:**

All secrets are also stored in Infisical's encrypted weekly exports (on Hetzner Storage Box). In an emergency:

```bash
# 1. Retrieve the latest encrypted export from Hetzner Storage Box
scp user@storage-box:/infisical-exports/infisical-export-2026-05-04.enc .

# 2. Decrypt with the recovery key (stored in 1Password)
infisical decrypt --file infisical-export-2026-05-04.enc --key <recovery-key> \
  --output secrets-plaintext.json

# 3. Inject secrets directly into Vercel via CLI
vercel env add DATABASE_URL production < secrets-plaintext.json
```

For CI/CD pipelines, add the critical secrets as GitHub Actions secrets temporarily (rotate them after Infisical is restored).

---

## 4. Communication Plan

### 4.1 Internal Communication

| Event | Channel | Frequency |
|---|---|---|
| Incident declared | `#eng-alerts` → dedicated `#incident-[date]` | Once at declaration |
| Status updates (P1) | `#incident-[date]` | Every 30 minutes |
| Status updates (P2) | `#incident-[date]` | Every 2 hours |
| Incident resolved | `#incident-[date]` + `#eng-general` | Once at resolution |
| Post‑mortem scheduled | `#eng-general` | Within 5 business days |

### 4.2 Client Communication

| Event | Channel | Timing |
|---|---|---|
| P1 incident – client‑facing outage | Status page + email to affected client contacts | Within 1 hour of declaration |
| P2 incident – significant degradation | Status page + email to affected client contacts | Within 2 hours of declaration |
| Incident resolved | Status page update + resolve email | Within 30 minutes of resolution |
| Scheduled maintenance (planned DR drills) | Email to all client contacts | 1 week before |

**Client communication template:**

```
Subject: [AGENCY] Service Incident – [Client Name] – [Date]

We are investigating a service disruption affecting [client name / service].
Impact: [brief description]
Our team is actively working to restore service.
Next update: [time, within commitment window]

For real‑time status, visit: [status page URL]
```

---

## 5. RACI Matrix

| Role | Incident Declaration | Execute Recovery | Client Communication | Post‑Mortem |
|---|---|---|---|---|
| **On‑Call Engineer (Primary)** | R, A | R, A | C | R |
| **On‑Call Engineer (Secondary)** | C | R | I | C |
| **Tech Lead** | C | C | C | A |
| **CTO / Engineering Manager** | I | I | A (for P1) | I |
| **Account Manager** | I | I | R (client‑facing) | I |
| **Compliance Officer** | I | I | C (if data breach) | C |

**R = Responsible** (does the work)  
**A = Accountable** (signs off; exactly one person)  
**C = Consulted** (provides input)  
**I = Informed** (receives updates)

---

## 6. Quarterly Restore Drill

### 6.1 Drill Schedule

Drills are conducted on the **first Wednesday of each quarter** during business hours. The Tech Lead selects one scenario at random from the recovery scenarios (A–F). The on‑call engineer at the time executes the drill.

### 6.2 Drill Procedure

1. **Pre‑drill (T‑1 week):** Announce the drill window to the team. No scenario details are shared.
2. **Drill day (T+0):** The Tech Lead declares the scenario. The on‑call engineer executes the runbook.
3. **During the drill:** The Tech Lead observes and times each step. No intervention unless safety is at risk.
4. **Post‑drill (T+1 hour):** Debrief. What went well? What was unclear? Was the RTO met?
5. **Post‑drill (T+1 week):** Update the runbook based on findings. File any corrective actions as GitHub issues.

### 6.3 Drill Report Template

```
## Quarterly DR Drill Report – Q[1-4] 2026

**Date:** [YYYY-MM-DD]
**Scenario:** [A/B/C/D/E/F]
**On‑Call Engineer:** [Name]
**Observer:** [Name]

### RTO Target vs. Actual
- Target: [X hours]
- Actual: [Y hours Z minutes]
- Met target: [Yes / No]

### RPO Target vs. Actual
- Target: [X hours]
- Actual: [Y hours]
- Met target: [Yes / No]

### Issues Encountered
1. [Issue description, step number, resolution]

### Runbook Clarity Assessment
- Steps that were clear: [list]
- Steps that caused confusion: [list]
- Missing steps: [list]

### Actions
- [ ] Update runbook step [N] to clarify [X]
- [ ] Add step for [Y]
- [ ] Fix [Z] in automation
```

---

## 7. Common Failure Modes & Troubleshooting

| Symptom | Likely Cause | Resolution |
|---|---|---|
| `pg_restore` fails with "connection pool" error | Using pooled connection string | Switch to unpooled (direct) connection string |
| `pg_restore` fails with "role does not exist" | Role missing in new Neon project | Ignore with `--no-owner` flag |
| `pg_restore` fails with "extension not available" | Missing Postgres extension | Install extension in Neon Console and re‑run |
| Backup file is 0 bytes or corrupted | `pg_dump` job failed silently | Use previous day's backup; investigate alert gap |
| Vercel rollback shows "no eligible deployments" | Only one production deployment exists | Deploy a fix from Git urgently |
| Coolify can't connect to other VPSes after restore | SSH keys not restored | Copy keys from 1Password to `/data/coolify/ssh/keys/` |
| DNS changes not propagating | High TTL on records | Lower TTL to 300 seconds; wait for expiry; verify with `dig` |
| Infisical export won't decrypt | Wrong recovery key | Verify key from 1Password; test decryption on a different machine |
| RLS policies not functioning after restore | Policies not enabled | `ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;` |
| Row counts don't match expectations | Partial restore or data growth | Accept if within 5% tolerance; investigate discrepancies >5% |

---

## 8. Key Contacts & Access

| Resource | How to Access |
|---|---|
| **Neon Support** | [Neon Discord](https://discord.gg/92vNTzKDGp) or [console.neon.tech → Support](https://console.neon.tech/app/projects?modal=support) |
| **Vercel Support** | Dashboard → Help → Contact Support (Pro plan priority) |
| **Hetzner Cloud Console** | [console.hetzner.cloud](https://console.hetzner.cloud) |
| **Cloudflare Dashboard** | [dash.cloudflare.com](https://dash.cloudflare.com) |
| **Infisical Self‑Hosted** | `https://secrets.agency-domain.com` (IP‑restricted; use VPN if outside agency) |
| **1Password Vault** | `DR Recovery Keys` vault |
| **Coolify Dashboard** | `https://coolify.agency-domain.com` (IP‑restricted) |
| **Hetzner Storage Box** | SFTP: `sftp://uXXXXX@uXXXXX.your-storagebox.de:23` |
| **R2 Bucket** | `s3://platform-backups` via Cloudflare dashboard or AWS CLI with R2 endpoint |

---

## 9. Emergency Deploy Path (CI Unavailable)

If GitHub Actions is unavailable and a critical fix must be deployed, use the documented "break glass" procedure:

```bash
# 1. Pull latest main
git pull origin main

# 2. Build locally with SLSA attestation (best effort)
pnpm build --filter=affected-app

# 3. Deploy directly via Vercel CLI
vercel deploy --prod

# 4. Verify deployment
vercel logs --environment production --since 5m
```

This path is tested quarterly during scheduled CI outage drills.

---

*Related: [infrastructure.md](../infrastructure/infrastructure.md), [database.md](../core/database.md), [deployment.md](../infrastructure/deployment.md), [ci-cd.md](../development/ci-cd.md), [client-lifecycle.md](../features/client-lifecycle.md), [governance-costs.md](./governance-costs.md)*
