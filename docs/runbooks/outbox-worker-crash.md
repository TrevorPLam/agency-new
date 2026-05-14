# Outbox Worker Crash Runbook

## Purpose
Restart and stabilize outbox processing workers after a crash.

## Symptoms
- Outbox worker processes terminate unexpectedly.
- Outbox backlog grows and delivery latency increases.

## Immediate Actions
1. Check worker process logs for crash stack traces.
2. Restart the crashed worker service.
3. Confirm whether the crash is reproducible.

## Investigation
- Review recent code deploys or config changes affecting workers.
- Verify resource exhaustion, dependency failures, or unhandled exceptions.
- Confirm which queue or job type caused the crash.

## Mitigation
- Roll back a recent deploy if the crash coincides with release.
- Apply hotfix for the underlying exception.
- Add retries or graceful failure handling if needed.

## Post-Incident
- Document root cause and fix.
- Add monitoring for the specific crash signature.
