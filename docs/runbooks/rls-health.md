# RLS Health Runbook

## Purpose
Investigate and recover row-level security enforcement failures.

## Symptoms
- RLS-protected queries fail or return unauthorized results.
- RLS-related errors appear in logs or audit alerts.

## Immediate Actions
1. Confirm the database policy state for affected tables.
2. Validate recent schema or permission changes.
3. Check whether RLS predicates are being applied by the database.

## Investigation
- Review database audit logs for failed or denied queries.
- Confirm that tenant context is available to the query layer.
- Verify policy definitions and whether any permission grants changed.

## Mitigation
- Roll back recent database permission or policy updates.
- Restart services that apply tenant context if misconfigured.
- Apply fixes to policy predicates if incorrect.

## Post-Incident
- Document root cause and remediation.
- Add guardrails around future RLS policy changes.
