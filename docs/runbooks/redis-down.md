# Redis Down Runbook

## Purpose
Recover from Redis unavailability affecting caching, sessions, or queues.

## Symptoms
- Redis connection failures or timeouts.
- Dependent services show cache or session errors.

## Immediate Actions
1. Check Redis instance health and connection status.
2. Confirm whether failover or cluster events occurred.
3. Identify any network or permission issues.

## Investigation
- Review Redis metrics for memory, CPU, and client connection counts.
- Check replication and persistence status.
- Confirm whether maintenance or infrastructure changes occurred.

## Mitigation
- Restart Redis nodes or fail over to a healthy replica.
- Update connection configuration if endpoints changed.
- Apply temporary cache bypass if safe.

## Post-Incident
- Document cause and any infrastructure change.
- Review Redis alert thresholds and failover readiness.
