# AI Stack – How We Use AI Models and Track Costs

**Last updated: May 2026**  
*This document covers our AI model integration, cost tracking, brand voice, and compliance requirements.*

---

## 1. LLM Gateway and Model Routing

**`firm-ai-core`** routes requests to the optimal model based on task requirements:

| Task Type | Primary Model | Fallback | Use Case |
|---|---|---|---|
| Complex reasoning | Claude Opus 4.7 | GPT-5 | Strategic analysis, creative writing |
| General purpose | GPT-5 | Gemini 3.1 Pro | Content generation, summarization |
| Fast responses | GPT-5 Nano | Claude Haiku | Real-time chat, quick completions |
| Code generation | Claude Opus 4.7 | GPT-5 | Complex refactoring, architecture |

Gemini 3.1 Pro is used as a fallback for general-purpose tasks due to its strong performance in handling nuanced language and context-dependent queries. This choice is justified by its ability to provide accurate and informative responses, making it an ideal secondary option when GPT-5 is not available.

Model selection is automatic based on task complexity, latency requirements, and cost constraints.

---

## 2. Structured Output

All AI responses use **Vercel AI SDK `Output.json()`** with Zod schemas:

```typescript
import { generateObject } from 'ai';
import { z } from 'zod';

const schema = z.object({
  title: z.string(),
  summary: z.string(),
  actionItems: z.array(z.string()),
});

const { object } = await generateObject({
  model: aiRouter.getModel('summarization'),
  schema,
  prompt: 'Summarize this meeting transcript...',
});
```

This ensures type-safe, validated responses that integrate seamlessly with our TypeScript codebase.

---

## 3. Brand Voice and Personalization

**`firm-ai-brand-voice`** stores per-client brand profiles:

- **Voice characteristics**: Formal/casual tone, vocabulary preferences
- **Industry context**: Healthcare, finance, SaaS, etc.
- **Compliance requirements**: HIPAA, SOX, GDPR restrictions

### C2PA Manifest Generation
- **Implementation**: Generated at content creation time via `c2pa-node` package
- **Storage**: C2PA manifests stored alongside content record in database
- **Compliance**: Required for EU AI Act Art. 50 compliance (deadline Dec 2, 2026)

Brand voice is automatically applied to all AI-generated content for each tenant.

---

## 4. Cost Tracking and Attribution

### Unified Cost Tracking Strategy

We use **three complementary tracking channels** with clear division of responsibility:

#### 4.1 Prometheus Metrics (Real-time Alerting)
- **Metric**: `ai_tokens_used_total` 
- **Output moderation**: Call OpenAI Moderation API (or equivalent) before content is saved; flag scores >0.5 for manual review
- **Reconciliation**: Prometheus for real‑time alerts, `ai_generation_log` for billing; discrepancy >1% triggers on‑call
- **Thresholds**: 80% warning, 90% critical, 100% circuit breaker
- **Retention**: 30 days
- **Update**: Incremented at the point the DB log is written

#### 4.2 Database Log (Billing Source of Truth)
- **Table**: `ai_generation_log`
- **Purpose**: Per-request audit trail and client billing
- **Fields**: `tenantId`, `model`, `task`, `tokens`, `cost_cents`, `timestamp`
- **Retention**: Indefinite
- **Authority**: Single source of truth for billing and compliance

#### 4.3 Vercel AI Gateway (Operational Visibility)
- **Performance testing**: See [lead-performance.md](../features/lead-performance.md) for AI endpoint latency SLIs
- **Usage**: Model distribution, performance monitoring
- **Not used for**: Billing or compliance auditing

### Reconciliation Process

The `ai_tokens_used_total` Prometheus metric is **incremented when the DB log is written**, ensuring synchronization by construction. A weekly reconciliation query compares Prometheus aggregates against `SUM(cost_cents)` from the DB log and alerts on discrepancies >1%.

---

## 5. Compliance and Watermarking

All AI-generated content includes:

- **C2PA Manifests**: EU AI Act Article 50 compliance
- **Disclosure Labels**: Non-removable "AI-generated" markers
- **Audit Trail**: Full provenance tracking in `ai_generation_log`
- **Data Minimization**: Only necessary prompts stored, no PII in logs

---

## 6. Rate Limiting and Fair Use

Per-tenant rate limiting prevents abuse and ensures fair resource allocation:

- **Token quotas**: Configurable per tenant plan
- **Burst capacity**: Temporary overages for legitimate spikes
- **Graceful degradation**: Fallback to smaller models when limits approached
- **Alerting**: Automatic notifications when quotas exceeded

---

## 7. Monitoring and Observability

AI-specific monitoring includes:

- **Latency tracking**: Time to first token, tokens per second
- **Quality metrics**: Human feedback integration, automated scoring
- **Cost attribution**: Per-client, per-model, per-task breakdowns
- **Error tracking**: Failure rates, retry patterns, fallback usage

---

## 8. Development Guidelines

### Model Selection Rules
1. **Start small**: Use Nano/Haiku for prototyping
2. **Scale up**: Move to Opus/GPT-5 for production-critical tasks
3. **Consider cost**: Balance quality vs. token cost
4. **Test fallbacks**: Ensure graceful degradation

### Prompt Engineering Standards
- **Structured prompts**: Use consistent templates
- **Context management**: Limit context window usage
- **Safety first**: Include safety constraints in prompts
- **Testing**: Validate outputs with automated tests

---

*Related: [governance-costs.md](../operations/governance-costs.md), [infrastructure.md](../infrastructure/infrastructure.md), [database.md](../core/database.md)*
