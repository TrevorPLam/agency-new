# Database Schema & RLS Policies

**For AI coding agents.** This file defines the core database tables, multi‑tenant isolation strategy, and Row‑Level Security rules. All database changes must follow these patterns. CI validates RLS policies via `scripts/validate-rls-policies.ts`.

---

## Multi‑Tenancy Model

- **Shared schema + Row‑Level Security (RLS)** is the default for all tables.
- Tenant context is set before every query using `SET LOCAL app.current_tenant_id = '<tenantId>'` inside a transaction.
- **Never** use `SET SESSION` — it leaks context across pooled connections.

```sql
BEGIN;
SET LOCAL app.current_tenant_id = 'client-slug';
-- queries here
COMMIT;
```

---

## Core Tables

### tenants
| Column      | Type         | Description                     |
|-------------|--------------|---------------------------------|
| id          | UUID (PK)    | Primary key                     |
| slug        | TEXT (UK)    | URL‑friendly identifier         |
| name        | TEXT         | Display name                    |
| config      | JSONB        | Feature flags, settings         |
| created_at  | TIMESTAMPTZ  | Auto‑set                        |

### users
| Column     | Type         | Description                              |
|------------|--------------|------------------------------------------|
| id         | UUID (PK)    |                                          |
| tenant_id  | UUID (FK)    | Links to `tenants.id`                    |
| email      | TEXT         | Unique per tenant                        |
| role       | TEXT         | admin, editor, viewer                    |
| rls_policy |              | `tenant_id = current_setting(...)`        |

### leads
| Column     | Type         | Description                              |
|------------|--------------|------------------------------------------|
| id         | UUID (PK)    |                                          |
| tenant_id  | UUID (FK)    |                                          |
| email      | TEXT         |                                          |
| first_name | TEXT         |                                          |
| last_name  | TEXT         |                                          |
| phone      | TEXT         |                                          |
| status     | TEXT         | new, contacted, qualified, converted     |
| source     | TEXT         | Lead source (website, referral, ads)     |
| created_at | TIMESTAMPTZ  |                                          |
| updated_at | TIMESTAMPTZ  |                                          |
| rls_policy |              | `tenant_id = current_setting(...)`        |

### submissions
| Column     | Type         | Description                              |
|------------|--------------|------------------------------------------|
| id         | UUID (PK)    |                                          |
| tenant_id  | UUID (FK)    |                                          |
| form_id    | TEXT         | Slug of the form                         |
| data       | JSONB        | Validated form data                      |
| created_at | TIMESTAMPTZ  |                                          |
| rls_policy |              | `tenant_id = current_setting(...)`        |

### campaigns
| Column     | Type         | Description                              |
|------------|--------------|------------------------------------------|
| id         | UUID (PK)    |                                          |
| tenant_id  | UUID (FK)    |                                          |
| name       | TEXT         | Campaign name                            |
| type       | TEXT         | email, social, ads                       |
| status     | TEXT         | draft, active, paused, completed         |
| budget     | NUMERIC      | Campaign budget                          |
| start_date | DATE         |                                          |
| end_date   | DATE         |                                          |
| created_at | TIMESTAMPTZ  |                                          |
| rls_policy |              | `tenant_id = current_setting(...)`        |

### consent_records
| Column       | Type         | Description                              |
|--------------|--------------|------------------------------------------|
| id           | UUID (PK)    |                                          |
| tenant_id    | UUID (FK)    |                                          |
| user_id      | UUID (FK)    |                                          |
| consent_type | TEXT         | marketing, analytics, cookies            |
| granted      | BOOLEAN      | Consent granted/revoked                  |
| granted_at   | TIMESTAMPTZ  |                                          |
| revoked_at   | TIMESTAMPTZ  |                                          |
| ip_address   | INET         | For audit trail                          |
| user_agent   | TEXT         |                                          |
| rls_policy   |              | `tenant_id = current_setting(...)`        |

### audit_log
| Column       | Type         | Description                              |
|--------------|--------------|------------------------------------------|
| id           | UUID (PK)    |                                          |
| tenant_id    | UUID (FK)    |                                          |
| user_id      | UUID (FK)    |                                          |
| action       | TEXT         | Action performed                         |
| resource     | TEXT         | Resource type                            |
| resource_id  | UUID         |                                          |
| old_values   | JSONB        | Previous state                           |
| new_values   | JSONB        | New state                                |
| ip_address   | INET         |                                          |
| created_at   | TIMESTAMPTZ  |                                          |
| rls_policy   |              | `tenant_id = current_setting(...)`        |

### ai_generation_log
| Column        | Type         | Description                              |
|---------------|--------------|------------------------------------------|
| id            | UUID (PK)    |                                          |
| tenant_id     | UUID (FK)    |                                          |
| user_id       | UUID (FK)    |                                          |
| task          | TEXT         | blog‑post, meta‑description, etc.        |
| model         | TEXT         | claude‑opus‑4‑7, gpt‑5, etc.            |
| tokens_input  | INTEGER      |                                          |
| tokens_output | INTEGER      |                                          |
| cost_usd      | NUMERIC      |                                          |
| c2pa_manifest | JSONB        | C2PA compliance manifest                 |
| created_at    | TIMESTAMPTZ  |                                          |
| rls_policy    |              | `tenant_id = current_setting(...)`        |

### feature_flags
| Column       | Type         | Description                              |
|--------------|--------------|------------------------------------------|
| id           | UUID (PK)    |                                          |
| tenant_id    | UUID (FK)    |                                          |
| key          | TEXT         | Flag key                                 |
| enabled      | BOOLEAN      |                                          |
| description  | TEXT         |                                          |
| expires_at   | TIMESTAMPTZ  | Flags past this date fail CI             |
| rls_policy   |              | `tenant_id = current_setting(...)`        |

---

## RLS Enforcement Rules

- **Every new table with `tenant_id` must ship with an RLS policy in the same PR.**
- RLS policies use the pattern: `tenant_id = current_setting('app.current_tenant_id')`.
- Vector search queries must filter by `tenant_id` **before** the similarity ranking (`WHERE tenant_id = ... ORDER BY embedding <=> ...`).
- Application‑layer filtering is the primary defense; RLS is the safety net. Both are tested in CI.

---

## Automated GDPR Compliance

`pg_cron` jobs handle data retention and anonymization:
- Consent records: cleaned up after configurable retention period.
- PII: automatically pseudonymized or deleted per tenant data retention policies.
- Audit logs: rotated after 12 months (configurable).

---
