
# Database – How We Use PostgreSQL and Drizzle in This Monorepo

This guide covers our database engine, ORM, multi‑tenancy isolation, connection pooling, branching, and vector search. For alternative databases or ORMs, see the archived research.

---

## 1. Engine: PostgreSQL 18 (Neon)

We use **Neon** (serverless PostgreSQL) for all transactional and analytical data. PostgreSQL 18 brings native UUIDv7, redesigned async I/O, and OAuth 2.0 authentication.

**Key Extensions:**
- `pgvector` – vector similarity search (embeddings)
- `pgvectorscale` – StreamingDiskANN index (for >10M vectors)
- `pg_cron` – scheduled database jobs (content publishing, data retention)
- `TimescaleDB` – hypertables and columnar compression for marketing analytics

---

## 2. ORM: Drizzle (Default)

**Drizzle ORM** is our primary data access layer. It is edge‑ready (~7.4 KB gzipped) and provides a SQL‑like query builder with full type safety.

- Schemas are defined in TypeScript (`packages/firm-db/src/schema/`).
- Migrations are managed with `drizzle-kit` and stored in `packages/firm-db/drizzle/migrations/`.
- **Prisma Usage Policy:** Drizzle is the default ORM for all applications. Prisma is allowed only when its specific tooling (Prisma Studio for data exploration, Prisma Accelerate for connection pooling in non‑Neon environments, or Prisma Migrate for complex migration scenarios) provides demonstrable value that outweighs the bundle‑size cost. Any package that imports Prisma must document the specific rationale in its README and be approved by the architecture team. For detailed criteria and approval process, see [ORM Guidelines](./orm-guidelines.md).

---

## 3. Multi‑Tenant Isolation

All client data is stored in a **shared schema** with **Row‑Level Security (RLS)** .

### Critical Rule: `SET LOCAL` Inside a Transaction

```
BEGIN;
SET LOCAL app.current_tenant_id = 'client-slug';
-- all queries here
COMMIT;
```

**Never** use `SET SESSION` — it leaks tenant context across pooled connections. Even read‑only queries must run inside a transaction.

### `setTenantContext()` Helper (Mandatory)

The `@firm/auth` package provides a helper function that **must be used** for all database queries:

```typescript
// @firm/auth – server‑side export
import { sql } from 'drizzle-orm';

export async function setTenantContext(
  tenantId: string,
  db: DrizzleDB
): Promise<void> {
  await db.execute(sql`SET LOCAL app.current_tenant_id = ${tenantId}`);
}
```

Usage:
```typescript
await db.transaction(async (tx) => {
  await setTenantContext(tenantId, tx);
  // all queries within this transaction are scoped to tenantId
  const leads = await tx.select().from(leadsTable);
});
```

### RLS Policy Example

```sql
CREATE POLICY tenant_isolation ON leads
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id'));
```

Every table with `tenant_id` must have an RLS policy. CI enforces this (`scripts/validate-rls-policies.ts`).

---

## 4. Connection Pooling

Connection pooling is **mandatory** in serverless environments. We use Neon’s built‑in PgBouncer (pooled connection URL) for all application queries. Direct connections are used only for migrations and seeding.

Without pooling, 500 concurrent invocations produce a 38% error rate.

---

## 5. Database Branching (Preview Environments)

Neon’s copy‑on‑write branching provides isolated preview databases for every PR.

- CI creates a Neon branch on PR open, runs migrations, and links it to the Vercel preview deployment.
- Branches are deleted automatically on PR close (via GitHub Action).
- **Orphan branch cleanup:** A scheduled job deletes Neon branches without corresponding open PRs.

---

## 6. Vector Search (`pgvector` + `pgvectorscale`)

All AI‑powered semantic search uses PostgreSQL’s vector capabilities.

- Embeddings are stored in a `vector(${process.env.EMBEDDING_DIMENSION || 1536})` column (configurable dimension, defaults to OpenAI `text-embedding-3-large`).
- For workloads under a few million vectors, we use **pgvector HNSW** index.
- For larger workloads, we switch to **pgvectorscale StreamingDiskANN** (up to 50M vectors at 99% recall).
- **Hybrid search:** Vector similarity is combined with full‑text search using Reciprocal Rank Fusion (RRF) — all inside PostgreSQL.

#### pgvector Index Maintenance
- **REINDEX schedule**: Run `REINDEX CONCURRENTLY` on vector indexes every 100k new rows or monthly, whichever comes first
- **Recall vs. Speed trade‑off**: Higher `m` parameter in HNSW improves recall but increases memory usage and build time
- **Monitoring**: Track index size and query performance via Prometheus metrics `vector_index_size_bytes` and `vector_query_latency_seconds`

---

## 7. Marketing Analytics (TimescaleDB)

High‑volume marketing data (page‑views, ad impressions, email opens) is stored in TimescaleDB **hypertables** with automated partitioning. Continuous aggregates provide real‑time roll‑ups. Columnar compression reduces storage by 90%+.

#### Continuous Aggregate Refresh Policies
- **Real‑time aggregates**: Refresh every 5 minutes for dashboard metrics (page views, conversions)
- **Hourly aggregates**: Refresh every hour for cost attribution and campaign performance
- **Daily aggregates**: Refresh at 2 AM UTC for historical reporting and trend analysis
- **Compression**: Automatically compress data older than 7 days using columnar compression
- **Retention**: Raw data retained for 90 days, aggregated data for 2 years

---

## 8. Scheduled Jobs (`pg_cron`)

We use `pg_cron` for tasks that run inside the database without external schedulers:

- Content publication scheduling
- Lead score recalculation
- Materialized view refresh (analytics dashboards)
- GDPR data retention/anonymization

---

## 9. Backup Strategy

- **Neon automated backup** is the primary recovery mechanism.
- **Nightly `pg_dump`** is taken and uploaded to Cloudflare R2 (encrypted) for additional redundancy.
- **Quarterly restore drills** are performed and documented in `docs/runbooks/database-restore.md`.

---

*Related: [auth.md](../integrations/auth.md), [background-jobs.md](../integrations/background-jobs.md), [infrastructure.md](../infrastructure/infrastructure.md), [governance-costs.md](../operations/governance-costs.md)*