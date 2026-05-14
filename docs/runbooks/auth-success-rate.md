# Auth Success Rate Runbook

## Purpose
Recover the authentication system and reduce failed login or token issuance attempts.

## Symptoms
- Auth success rate drops below 99.9%.
- Users report login failures, expired tokens, or MFA problems.

## Immediate Actions
1. Check authentication service health and dependency connectivity.
2. Validate token issuance and validation endpoints.
3. Review recent credential or policy changes.

## Investigation
- Inspect auth provider errors and rate limit responses.
- Confirm database or cache access for session/token stores.
- Review dependent services such as identity providers, MFA, and email/SMS delivery.

## Mitigation
- Roll back auth config or provider changes if linked.
- Restart authentication service components.
- Add temporary fallback authentication path if safe.

## Post-Incident
- Document root cause, fix, and any remediation steps.
- Review auth alert thresholds for noise and sensitivity.
