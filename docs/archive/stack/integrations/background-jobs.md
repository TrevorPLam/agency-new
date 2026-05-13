# Background Jobs – How We Use Inngest for Asynchronous Work

This guide covers our background job architecture, job categories, tenant fairness, and event‑driven patterns. For alternative queue systems, see the archived research.

---

## 1. Execution Platform: Inngest v4

We use **Inngest** as our primary durable execution platform. It provides step‑level durability with zero infrastructure to manage.

- **Checkpointing** (default since v4) – after each `step.run()`, Inngest stores the result. On failure, the job resumes from the failed step, not the beginning.
- **Durable Endpoints** (public beta) – bring durability directly into API handlers for long‑running requests.
- **Local Dev Server** – full production parity with a local dashboard.

---

## 2. Job Categories

| Category             | Example Jobs                                | Retry Strategy                 |
| -------------------- | ------------------------------------------- | ------------------------------- |
| Form Processing      | Validate, store, emit analytics, enqueue CRM| 5 retries, exponential backoff (base 2, max 12h delay) |
| Email Delivery       | Render template, dispatch via Resend        | 5 retries → dead letter queue   |
| CRM Sync             | Transform + call external CRM API           | 5 retries → dead letter queue   |
| Report Generation    | Aggregate data, render PDF, email           | 3 retries                       |
| AI Content           | LLM calls for blogs, ads, social            | 3 retries; long‑running         |
| Data Retention       | Pseudonymize / delete expired data          | Scheduled; no retry (alert only)|

---

## 3. Event‑Driven Choreography

Services **never** call each other directly. Instead, they emit typed events.

**Example: Form Submission Flow**
```
FormService emits form.submitted
  → EmailHandler: sends confirmation email
  → CRMHandler: syncs lead to client's CRM
  → AnalyticsHandler: records generate_lead event
```

Each handler is an independent Inngest function with its own retry policy. If the email service is down, the form submission succeeds and the email is queued.

---

## 4. Event Registry (Governance)

Every event emitted in the platform is registered in a centralized `EVENT_REGISTRY` in `@firm/api-contracts`. CI blocks any PR that emits an unregistered event name. This prevents typo‑driven incidents and ensures payload shape consistency.

```typescript
import { EVENT_REGISTRY } from 'firm-api-contracts';
import { eventType } from 'inngest';

const formSubmitted = eventType('form/submitted', {
  schema: EVENT_REGISTRY['form/submitted'],
});
```

---

## 5. Tenant‑Fair Scheduling

In a shared queue, a single high‑volume client can starve others. We prevent this with:

- **Enterprise clients:** dedicated Inngest environments or queue namespaces.
- **SMB clients:** shared queues with a `MaxConcurrentJobsPerTenant` limit of 50 jobs. A tenant cannot monopolize all workers.
- **Per‑tenant rate limiting** at job submission time, before the job enters the queue.

---

## 6. Priority Levels

| Priority    | Examples                                           | Behavior                          |
| ----------- | -------------------------------------------------- | --------------------------------- |
| HIGH        | Form submission, password reset, payment webhook   | Dedicated queue, max worker alloc |
| NORMAL      | CRM sync, email delivery, AI content               | Standard queue                    |
| LOW         | Monthly reports, bulk export                       | Limited concurrency               |
| BEST_EFFORT | Data retention, cache warming                      | Only when idle capacity           |

---

## 7. Dead Letter Queue (DLQ)

When a job exhausts all retries, it moves to a dead letter queue. The DLQ is a diagnostic tool, not a processing queue.

- The Inngest dashboard displays DLQ depth grouped by job type and tenant.
- An alert fires if DLQ depth grows beyond threshold (Alertmanager → Slack → on‑call).
- Operators can inspect payloads, fix root cause, and manually replay jobs.

---

## 8. Idempotency

Every event carries a unique `eventId`. Consumers record the ID in a deduplication store (database table with unique constraint) and skip already‑processed events. This prevents duplicate emails, CRM records, and analytics events.

---

## 9. Local Development

The Inngest Dev Server runs alongside the Next.js app. It provides:

- A local dashboard identical to production.
- Manual job triggering.
- Step‑through execution with output inspection.
- Retry simulation.

---

## 10. Cost Scaling Model

Inngest pricing is based on execution time and event volume:
- **Free tier**: 50,000 events/month, 500,000 execution seconds/month
- **Pro tier**: $0.0002 per execution second, $0.0001 per event
- **Estimated monthly cost**: $150-300 at projected volumes (10M events, 2M execution seconds)
- **Cost monitoring**: Prometheus tracks `inngest_execution_seconds_total` and `inngest_events_total` per tenant

---

## 11. Feature-Driven Event Routing (Future)

Future enhancements may include feature‑flag driven event routing:
- Conditional event handlers based on tenant feature flags
- A/B testing of different job processing strategies
- Dynamic priority adjustment based on tenant tier

This would integrate with [Feature Flags](../features/feature-flags.md) system for runtime configuration.

---

*Related: [api.md](./api.md), [email.md](./email.md), [forms.md](../features/forms.md), [ai.md](./ai.md)*