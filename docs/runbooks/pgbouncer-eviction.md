# PgBouncer Eviction Runbook

## Purpose
Recover database connectivity after PgBouncer eviction or connection pool exhaustion.

## Symptoms
- Connection rejections or timeouts from PgBouncer.
- Application database errors and degraded query performance.

## Immediate Actions
1. Check PgBouncer pool status and active connection counts.
2. Confirm whether recent traffic spikes or config changes occurred.
3. Identify affected services and connection sources.

## Investigation
- Review PgBouncer logs for eviction, overflow, or saturation events.
- Verify database host availability and connection limits.
- Inspect application connection settings and max pool values.

## Mitigation
- Restart PgBouncer if it is stuck or unhealthy.
- Increase connection limits temporarily while preserving database stability.
- Optimize clients to use connection pooling correctly.

## Post-Incident
- Document cause and any tuning changes.
- Adjust connection pool config and alerting thresholds.
