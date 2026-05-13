# Load & Performance Testing Strategy – How We Validate Performance in This Monorepo

**Created: May 2026**
*This guide covers our performance testing philosophy, tools, test types, service-level objectives, performance budgets, CI enforcement, dashboards, and alerting. For tool comparisons, see the archived research.*

---

## 1. Philosophy

**Performance is a feature, not an afterthought.** In a multi-tenant marketing platform where every client site competes for search rankings and conversions, page speed directly impacts revenue. Our performance testing strategy rests on four principles:

| Principle | What It Means |
|---|---|
| **Shift-left** | Performance is tested during development, not after deployment to production. Load tests run on every PR that modifies API endpoints, database queries, or shared packages. |
| **SLO-driven** | We define explicit Service Level Objectives for every critical user journey. Tests codify these SLOs as pass/fail thresholds, and the build fails if thresholds are breached. |
| **Realistic workloads** | Test scripts model actual user behavior — not synthetic edge cases. Think times match real user cadences. Workload distributions reflect production traffic patterns (80% browsing, 20% converting). |
| **Single test, multiple uses** | The same k6 scripts validate performance during development, gate PRs in CI, and then become synthetic monitors in production — one script, three environments, zero duplication. |

The market context reinforces this: in 2026, 62% of origins achieve "good" on all three Core Web Vitals, and pages loading over 3 seconds see 40% higher bounce rates. Performance is no longer a differentiator — it's table stakes.

---

## 2. Tools

### 2.1 Primary: k6 by Grafana Labs

**k6** is our primary load testing tool. It was chosen because:

- **Code-first in JavaScript ES6** — the same language the team already knows. No GUI, no XML, no learning curve.
- **Thresholds as pass/fail gates** — SLOs are expressed directly in test scripts. If a threshold is breached, k6 exits with a non-zero code, and CI fails the build.
- **Efficient resource usage** — a single mid-range machine can simulate tens of thousands of virtual users. The Go runtime is dramatically more resource-efficient than JVM-based tools like JMeter.
- **Native CI/CD integration** — designed for DevOps workflows with JSON output, Prometheus remote write, and GitHub Actions integration.
- **Multiple protocols** — HTTP, gRPC, WebSocket, and browser-based testing are all supported natively.

**Version:** k6 v1.6.1 (stable) with v2.0.0-rc1 available for migration testing. The platform currently targets v1.6.x. Migration to v2.0.0 will be evaluated after the final release stabilizes.

### 2.2 Complementary Tools

| Tool | Purpose | Integration |
|---|---|---|
| **Playwright 1.59** | E2E performance assertions (page load metrics, bundle size) | Used in existing E2E test suite; `page.metrics()` and PerformanceObserver for Core Web Vitals |
| **Lighthouse CI** | Lab-based performance audits and budget enforcement | Integrated into CI pipeline; budgets defined in `lighthouserc.js` |
| **Vercel Speed Insights** | Real-user monitoring (RUM) — Real Experience Score from actual devices | Built into Vercel Pro; data feeds Grafana dashboards |
| **OpenTelemetry (Tempo)** | Distributed tracing for bottleneck analysis during load tests | Correlates k6 results with server-side traces |
| **Prometheus + Grafana** | Metrics collection, dashboard visualization, alerting | k6 streams results to Prometheus; dashboards in `infra/grafana/dashboards/` |

### 2.3 Synthetic Monitoring (Production)

The same k6 scripts used for load testing in CI are reused as synthetic monitors in production via **Grafana Cloud Synthetic Monitoring** (or self-hosted Checkly for critical client-facing flows). This ensures continuous validation of performance from geographically distributed locations, not just during PR cycles.

---

## 3. Test Types & Execution Profiles

Every critical user journey is tested at four levels of intensity. The table below defines when each type runs and what it validates.

| Test Type | Purpose | Duration | VU Count | When It Runs | Pass/Fail? |
|---|---|---|---|---|---|
| **Smoke** | Verify basic functionality under minimal load; catch obvious regressions | 2 minutes | 5–10 VUs | Every PR (perf-sensitive) | ✅ Blocks merge |
| **Load** | Validate system meets latency/throughput targets under expected peak traffic | 15 minutes | Peak VUs (per-service) | Weekly; pre‑launch; after major changes | ✅ Blocks release |
| **Stress** | Find breaking point — at what traffic level does the system degrade? | Variable (ramp until failure) | Incremental | Before major marketing campaigns; quarterly | ❌ Informational (identifies ceiling) |
| **Spike** | Validate recovery from sudden traffic surge (e.g., viral campaign) | 5 minutes | 3× peak VUs in 30 seconds | Before campaigns; after autoscaling changes | ⚠️ Warns (investigate if system doesn't recover) |
| **Soak** | Detect memory leaks, connection pool exhaustion, gradual degradation | 2–6 hours | 70% of peak VUs | Monthly; after infrastructure changes | ❌ Informational (trend analysis) |

**Ramping strategy for load tests** (most common CI gate):

```
Stages:
  0–2 min:  Ramp from 0 → 50 VUs (gradual traffic increase)
  2–7 min:  Hold at 50 VUs (sustained normal load)
  7–9 min:  Ramp from 50 → 200 VUs (peak load)
  9–14 min: Hold at 200 VUs (sustained peak)
  14–16 min: Ramp down to 0 VUs (cooldown)
```

This mimics real traffic — gradual morning ramp-up, sustained business hours, a lunchtime peak, then evening decline.

---

## 4. Service Level Objectives (SLOs)

### 4.1 SLI → SLO Framework

| Service Level Indicator (SLI) | Service Level Objective (SLO) | Measurement Window | Rationale |
|---|---|---|---|
| **Availability** (% of requests returning non‑5xx) | 99.9% | 30 days | Industry standard for SaaS; 43.2 minutes allowed downtime per month |
| **Latency (p95)** | <500 ms | 30 days | Covers 95% of users; p99 tracked but not gated |
| **Latency (p99)** | <1 second | 30 days | Worst-acceptable experience; alert if exceeded consistently |
| **Throughput** | >100 requests/second sustained | Per test | Ensures system can handle projected peak traffic |
| **Error rate** | <0.5% of all requests | 30 days | Tighter than availability alone; catches degraded responses |
| **LCP (marketing pages)** | <2.5 seconds (p75) | 28 days | Google Core Web Vital; impacts SEO ranking |
| **INP (interactive pages)** | <200 ms (p75) | 28 days | Google Core Web Vital; measures responsiveness |
| **CLS (all pages)** | <0.1 (p75) | 28 days | Google Core Web Vital; measures visual stability |

### 4.2 k6 Thresholds (SLOs as Code)

Thresholds in k6 codify SLOs directly into load test scripts. When a threshold is breached, k6 exits with a non-zero code, which fails the CI pipeline.

```javascript
// tests/load/api-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up
    { duration: '5m', target: 50 },   // Sustained normal
    { duration: '3m', target: 200 },  // Ramp to peak
    { duration: '5m', target: 200 },  // Sustained peak
    { duration: '2m', target: 0 },    // Ramp down
  ],

  // ── SLOs codified as thresholds ──────────────────
  thresholds: {
    // Latency SLIs
    http_req_duration: [
      'p(95)<500',    // p95 must be under 500ms (latency SLO)
      'p(99)<1000',   // p99 must be under 1s
      'avg<300',      // average under 300ms
    ],

    // Availability SLI (error rate)
    http_req_failed: [
      'rate<0.005',   // Less than 0.5% of requests can fail
    ],

    // Throughput SLI
    http_reqs: [
      'rate>100',     // Must sustain at least 100 req/s
    ],

    // API‑specific checks must pass
    checks: [
      'rate>0.99',    // At least 99% of checks must pass
    ],
  },
};

export default function () {
  const res = http.get(`${__ENV.TARGET_URL}/api/health`);
  check(res, { 'health is 200': (r) => r.status === 200 });

  sleep(1); // Realistic think time between requests
}
```

### 4.3 Error Budget & Burn Rate

Error budget is the amount of unreliability the SLO allows:

```
Error Budget = 100% - SLO Target
For 99.9% availability: Error Budget = 0.1%
Over 30 days: 43.2 minutes of allowed downtime
```

Burn rate indicates how fast the error budget is being consumed. Fast burn (consuming 2% of budget in 1 hour) triggers immediate alerts. This is tracked in the Grafana SLO dashboard (see § 7).

---

## 5. Performance Budgets

Performance budgets are numerical limits that prevent performance regressions from reaching production. They are enforced at two levels: build-time (Lighthouse CI) and commit-time (bundle analysis).

### 5.1 Budget Definitions

| Metric | Marketing / SEO Pages | Authenticated Dashboards | Rationale |
|---|---|---|---|
| **Total page weight** | ≤800 KB | ≤1.5 MB | Balances rich media with load speed on mobile |
| **JavaScript** | ≤300 KB | ≤500 KB | Keeps parse/compile time low; critical on mid-range devices |
| **CSS** | ≤100 KB | ≤150 KB | Prevents stylesheet bloat |
| **Images** | ≤400 KB total per page | ≤600 KB total | Next.js `<Image>` handles optimization automatically |
| **HTTP requests** | ≤30 | ≤50 | Fewer requests = faster page on high-latency connections |
| **LCP (p75)** | ≤1.5 seconds | ≤2.5 seconds | Marketing pages are SEO‑critical; dashboards have higher tolerance |
| **INP (p75)** | ≤200 ms | ≤200 ms | Responsiveness matters equally everywhere |
| **CLS (p75)** | ≤0.1 | ≤0.1 | Visual stability is a Core Web Vital for all pages |

These budgets align with industry practice — marketing sites need tighter budgets because they face real users on mobile, while authenticated dashboards (behind login, on desktop) can tolerate heavier pages.

### 5.2 Enforcement

**Lighthouse CI** runs on every PR and enforces these budgets. The config is version-controlled:

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',          // Homepage
        'http://localhost:3000/blog',       // Blog index
        'http://localhost:3000/contact',    // Contact page
      ],
      numberOfRuns: 3, // Median of 3 runs reduces noise
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.90 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'interactive': ['error', { maxNumericValue: 3000 }],
        'total-byte-weight': ['error', { maxNumericValue: 800000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

**CI behavior:** If Lighthouse CI detects a budget regression, it fails the build. The failure message includes the specific metric that regressed and the before/after values, so developers can identify the cause immediately.

### 5.3 Bundle Analysis

**`next experimental-analyze`** (Turbopack-native) runs during the build step and generates a bundle report. This is not a gate — it's diagnostic. If a bundle is approaching budget limits, the analyzer output is attached to the PR as a comment for reviewer visibility.

---

## 6. CI/CD Integration

### 6.1 When Performance Tests Run

| Pipeline Stage | Test Type | Trigger | Blocks Merge? |
|---|---|---|---|
| **PR (perf‑sensitive paths)** | Smoke test | Changes to `packages/firm-api/`, `packages/firm-db/`, `apps/*/api/`, `infra/*` | ✅ Yes |
| **PR (all other paths)** | Lighthouse CI (budgets) | Every PR | ✅ Yes (budgets only) |
| **Weekly (Saturday 03:00 UTC)** | Full Load test | Scheduled | ❌ Alerts on‑call if thresholds breached |
| **Pre‑launch (client onboarding)** | Load + Spike | Manual trigger | ✅ Yes (must pass before launch gates) |
| **Quarterly** | Stress + Soak | Scheduled | ❌ Informational; results discussed in reliability review |

### 6.2 GitHub Actions Integration

```yaml
# .github/workflows/performance.yml
name: Performance Tests
on:
  pull_request:
    paths:
      - 'packages/firm-api/**'
      - 'packages/firm-db/**'
      - 'apps/**/api/**'
      - 'infra/**'
  schedule:
    - cron: '0 3 * * 6'  # Weekly: Saturday 03:00 UTC

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<commit-sha>
      - name: Install k6
        uses: grafana/setup-k6-action@v2
      - name: Smoke test (PR)
        if: github.event_name == 'pull_request'
        run: |
          k6 run \
            --env TARGET_URL=${{ steps.deploy.outputs.preview-url }} \
            --out json=results-smoke.json \
            tests/load/smoke-test.js
      - name: Load test (weekly)
        if: github.event_name == 'schedule'
        run: |
          k6 run \
            --env TARGET_URL=https://production-api.agency-domain.com \
            --out json=results-load.json \
            --out experimental-prometheus-rw \
            tests/load/load-test.js
      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: k6-results
          path: results-*.json
      - name: Notify on failure
        if: failure()
        uses: slackapi/slack-github-action@v2
        with:
          channel-id: eng-alerts
          slack-message: "Load test failed. Thresholds breached. Check run: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
```

### 6.3 Selective Execution via Turborepo

Performance tests are integrated into Turborepo's dependency graph. When a PR only touches documentation or content, no performance tests run — saving CI minutes and cost.

```jsonc
// turbo.json (excerpt)
{
  "tasks": {
    "perf:smoke": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "tests/load/**", "infra/**"],
      "outputs": ["results-*.json"]
    }
  }
}
```

---

## 7. Dashboards as Code

### 7.1 Performance Test Results Dashboard

A Grafana dashboard in `infra/grafana/dashboards/performance-tests.json` displays:

| Panel | Metric | Purpose |
|---|---|---|
| **p95 latency over time** | `http_req_duration` (p95) | Trend of response times across test runs; identify gradual degradation |
| **Error rate under load** | `http_req_failed` rate | Correlation between load level and error rate |
| **Throughput vs VUs** | `http_reqs` rate + `vus` | Does throughput scale linearly with virtual users? |
| **Test history** | All thresholds over time | Per‑test pass/fail history |
| **Bottleneck heatmap** | OTel spans by service | Which service contributes most to latency at each load level |

### 7.2 SLO Dashboard

A separate dashboard tracks live SLO compliance from production traffic:

| Panel | PromQL Query |
|---|---|
| **Availability SLI (30d)** | `sum(rate(http_requests_total{status!~"5.."}[30d])) / sum(rate(http_requests_total[30d]))` |
| **Error budget remaining** | `((SLI - SLO_target) / (1 - SLO_target)) * 100` |
| **Burn rate (1h)** | `(1 - SLI_1h) / (1 - SLO_target)` — alerts if >14.4 (consumes 2% budget in 1h) |

This dashboard is defined as code and imported into Grafana via the Grafana API during CI.

---

## 8. Correlating Load Tests with Server-Side Telemetry

During load tests, k6 results are correlated with server-side OpenTelemetry traces exported to Grafana Tempo. This enables **bottleneck identification**: when p95 latency spikes at 200 VUs, the trace view shows whether the bottleneck is in the database query, the LLM call to `firm-ai-core`, or an upstream CRM API sync.

**Integration flow:**
```
k6 sends HTTP requests → app instruments with OTel → traces exported to Tempo
                     → metrics scraped by Prometheus → dashboards in Grafana
                     → logs shipped to Loki via Promtail
```

A single k6 `test_run_id` is passed as a header (`X-Test-Run-ID`) and propagated through the entire trace. In the Grafana dashboard, selecting a test run filters traces and logs to that specific run, isolating the behavior from other traffic.

---

## 9. Multi-Tenant Performance Considerations

### 9.1 Per-Tenant Isolation Under Load

Performance tests must verify that one tenant's traffic spike does not degrade another tenant's experience. Our test scripts include:

- **Tenant-fairness scenarios:** 80% of VUs simulate one high-volume tenant; 20% simulate a low-volume tenant. SLOs must be met for both groups.
- **Rate-limit validation:** Scripts fire requests exceeding the per-tenant rate limit and verify that Arcjet returns 429 without affecting other tenants.
- **Database isolation:** Concurrent load across tenants must not cause RLS policy evaluation to introduce measurable latency.

### 9.2 Client-Specific Performance Budgets

Enterprise-tier clients may negotiate tighter performance budgets (e.g., LCP < 1.0s for a luxury brand). These are defined in the client's `lighthouserc.js` override and enforced during that client's CI build matrix. See `docs/stack/deployment.md` § 7 for the multi-client CI matrix.

---

## 10. Test Data & Realistic Workloads

### 10.1 Workload Modeling

Performance tests must reflect real user behavior, not synthetic worst-cases. We model workloads from production analytics:

- **Browse:Search:Convert ratio** = 80:15:5 (typical marketing site)
- **Think time** = 3–8 seconds between page views (modeled as `sleep(random(3,8))` in k6)
- **Device mix** = 60% mobile, 30% desktop, 10% tablet (affects bandwidth simulation)
- **Geographic distribution** = Mirrors actual client traffic (EU-heavy for GDPR clients, distributed for global clients)

### 10.2 Test Data Management

Test data for load scripts is versioned alongside the scripts:

```
tests/load/
├── scripts/
│   ├── smoke-test.js
│   ├── load-test.js
│   ├── stress-test.js
│   ├── spike-test.js
│   └── soak-test.js
├── data/
│   ├── test-users.csv          # Realistic user profiles (not production data)
│   ├── test-leads.csv          # Sample lead submission data
│   └── test-queries.json       # Search query distribution
└── config/
    ├── thresholds.json         # Shared threshold definitions
    └── environments.json       # Per-environment target URLs and credentials
```

**Data generation:** Test data is synthetic — generated from realistic distributions but containing zero production user data. This avoids GDPR complications while maintaining statistical validity.

---

## 11. Alerting on Performance Regression

| Alert | Condition | Severity | Action |
|---|---|---|---|
| **Smoke test failed** | CI build fails on PR | N/A (blocks merge) | Developer fixes before merge |
| **Load test thresholds breached** | Weekly test fails | P3 | Ticket created; investigated within 1 business day |
| **Error budget burn rate >14.4** | Consuming 2% of budget in 1 hour | P2 | Immediate investigation; on‑call paged |
| **Error budget exhausted** | Budget at 0% | P1 | Feature deploys frozen until reliability restored |
| **p95 latency >2× baseline** | Sustained for >1 hour in production | P2 | Root cause analysis; correlate with recent deploy |
| **Cost-per-request spike** | Infrastructure cost per 1,000 requests >2× baseline | P3 | Investigate query inefficiency or external API cost |

Alerts are configured in `infra/prometheus/rules/performance.yml` and routed through Alertmanager (P1→PagerDuty, P2→Slack `#eng-alerts`, P3→ticket).

---

## 12. Quick Reference

| Task | How |
|---|---|
| **Run a smoke test locally** | `k6 run tests/load/smoke-test.js` |
| **Run a full load test locally** | `k6 run -e TARGET_URL=http://localhost:3000 tests/load/load-test.js` |
| **Add a new test scenario** | Create `tests/load/scripts/<name>-test.js`; add to `turbo.json` |
| **Add a new performance budget** | Update `lighthouserc.js` and `budget.json`; run `pnpm lighthouse:assert` |
| **View test results dashboard** | Grafana → Dashboards → Performance Test Results |
| **View production SLOs** | Grafana → Dashboards → Platform SLO Overview |
| **Debug a failed load test** | Find the `test_run_id` in k6 output → filter Tempo traces → identify bottleneck service |
| **Run client-specific performance tests** | `k6 run -e TARGET_URL=https://client-acme.com tests/load/load-test.js` |

---

## 13. Roadmap

| Timeline | Capability | Status |
|---|---|---|
| **Q2 2026** | Integrate k6 smoke tests into CI for all API-changing PRs | In development |
| **Q3 2026** | Automated performance regression detection: PR comment with before/after comparison | Planned |
| **Q3 2026** | Per-client SLO dashboards (client-visible health metrics) | Planned |
| **Q4 2026** | Canary deployment performance validation: k6 runs against canary before full rollout | Planned |
| **Q1 2027** | AI-assisted bottleneck analysis: correlate k6 results with OTel traces automatically | Research |

---

*Related: [ci-cd.md](../development/ci-cd.md), [infrastructure.md](../infrastructure/infrastructure.md), [client-lifecycle.md](./client-lifecycle.md), [deployment.md](../infrastructure/deployment.md), [database.md](../core/database.md), [frontend.md](../core/frontend.md), [api.md](../integrations/api.md)*