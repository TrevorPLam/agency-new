# Observability – Logging, Metrics, Tracing, and Alerting

**For AI coding agents.** This file defines the mandatory observability patterns for every service in the monorepo. For implementation details, see `docs/stack/infrastructure.md`.

---

## 1. Structured Logging (Pino → Loki)

All services **must** emit JSON logs to stdout using the shared `firm-observability` package (wraps Pino).

**Required log fields:**
- `timestamp` (ISO 8601)
- `level` (trace, debug, info, warn, error, fatal)
- `message`
- `service` (e.g., `platform-analytics`)
- `correlationId` (propagated across service boundaries)
- `tenantId` (always present for multi‑tenant services)
- `error` (serialized stack when applicable)

**Sensitive data** must be redacted via Pino serializers before any log line leaves the process. A CI test ensures no PII (emails, phone numbers, tokens) reaches stdout.

Logs are scraped by Promtail (running on every VPS) and shipped to **Grafana Loki** on `vps-observability`. Loki retention: 30 days hot, 90 days warm.

---

## 2. Prometheus Metrics

Every service **must** expose a `/metrics` endpoint on port `9090` via the `prom-client` library.

**Required metrics:**
- `http_requests_total` (method, path, status)
- `http_request_duration_seconds` (histogram, p50/p95/p99)
- `db_queries_total` (table, operation)
- `ai_tokens_used_total` (tenant_id, model, task) – for AI services
- `adapter_operation_duration_seconds` (adapter, operation) – for adapter packages

Prometheus scrapes every 15 seconds. Configuration lives in `infra/prometheus/prometheus.yml`.

---

## 3. Distributed Tracing (OpenTelemetry)

All services use **OpenTelemetry** to propagate trace context (W3C Trace Context headers). Traces are exported to Grafana Tempo.

Spans must be created for:
- External API calls (CRM, email, payment)
- Database queries (auto‑instrumented via `@prisma/instrumentation` or Drizzle tracing)
- Background job steps (Inngest step functions)

The `correlationId` from the log context is attached to every span as an attribute, enabling cross‑referencing between logs and traces.

---

## 4. Health Checks

Every application **must** expose `GET /api/health`. CI verifies this endpoint exists (Gate 15).

**Response shape:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-10T14:30:00Z",
  "checks": {
    "database": "ok",
    "queue": "ok"
  }
}
```

- **Liveness probe:** Does not check any external dependency (prevents restart cascades).
- **Readiness probe:** Checks database connectivity and downstream services.
- Return HTTP 200 within 5 seconds. Non‑200 triggers an alert.

---

## 5. Alerting Rules (Prometheus Alertmanager)

| Condition | Severity | Action |
|-----------|----------|--------|
| 5xx error rate > 5% for 5 minutes | P2 | Slack `#alerts` + PagerDuty page |
| p95 latency > 2 seconds for 10 minutes | P3 | Slack `#alerts` |
| Service down for > 1 minute | P2 | PagerDuty page |
| Database query rate > 1000/second | P4 | Log + ticket |
| AI token budget > 80% for any tenant | P3 | Slack to account manager |
| AI token budget > 90% for any tenant | P2 | Pause AI generation for that tenant |
| Disk usage > 80% on any VPS | P3 | Slack |

Alertmanager configuration is version‑controlled in `infra/prometheus/rules/alerts.yml`.

---

## 6. Synthetic Monitoring (Checkly)

Checkly runs Playwright‑based browser checks against all public‑facing apps every 5 minutes. Critical flows covered:

- Homepage load (HTTP 200, LCP < 2.5s)
- Contact form submission (successful POST)
- Authenticated flow (login → dashboard → logout)

Checkly alerts integrate with Alertmanager.

---

## 7. Grafana Dashboards as Code

All dashboards are version‑controlled as JSON files in `infra/grafana/dashboards/` and deployed via CI. Dashboards include:

- Platform overview (health of all services)
- Per‑tenant analytics and resource usage
- AI cost tracker (by model, task, tenant)
- CI/CD pipeline metrics (build times, cache hit rate)
- Adapter health (error rates, latency per provider)

---

*For infrastructure details (server layout, Prometheus targets, Loki configuration), see `docs/stack/infrastructure.md`.*