# API P95 Latency Runbook

## Purpose
Respond to elevated API latency and restore performance.

## Symptoms
- API P95 latency exceeds 250ms.
- User-facing requests slow or time out.

## Immediate Actions
1. Check service health dashboards for the API layer.
2. Confirm whether the issue is isolated to a specific endpoint or region.
3. Identify recent deploys, config changes, or traffic shifts.

## Investigation
- Review application metrics for CPU, memory, and request queue depth.
- Examine database query latency and external dependency response times.
- Check error rates for retry storms or throttling.

## Mitigation
- Roll back a recent deploy if latency increase coincides with release.
- Scale application instances or adjust throttling rules temporarily.
- Disable non-critical background tasks during the incident.

## Post-Incident
- Document root cause and action items.
- Tune request routing or caching if needed.
- Adjust alert thresholds if false positives were detected.
