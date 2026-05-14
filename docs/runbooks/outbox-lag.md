# Outbox Lag Runbook

## Purpose
Restore timely outbox processing and delivery.

## Symptoms
- Outbox messages are queued for longer than 60 seconds.
- Delivery backlog increases rapidly.

## Immediate Actions
1. Check outbox consumer health and queue lengths.
2. Confirm whether worker processes are running and not stalled.
3. Review logs for transient delivery failures or throttling.

## Investigation
- Inspect downstream system availability and rate limits.
- Verify database locks or migration activity affecting outbox reads.
- Evaluate message size and serialization performance.

## Mitigation
- Restart stuck outbox workers.
- Increase consumer parallelism for transient spikes.
- Apply retry/backoff changes if external calls are failing.

## Post-Incident
- Document the cause and fix.
- Add circuit-breaker or backpressure protections if needed.
