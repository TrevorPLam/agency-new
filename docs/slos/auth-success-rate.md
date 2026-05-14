# Auth Success Rate SLO

## Objective
Maintain reliable authentication flow across the platform.

## Target
- 99.9% successful user authentications over a rolling 30-day window.

## Measurement
- Source: auth service success/failure telemetry for login, token refresh, and MFA flows.
- Calculation: successful auth completions divided by total auth attempts.
- Window: 30 days.

## Error Budget
- Budget: 0.1% auth failure rate.
- Burn rate: tracked daily, with an escalation threshold when failures exceed 50% of the budget for 24 hours.

## Alerting
- Trigger when auth failure rate exceeds 0.1% for 3 consecutive days.
- Include error class, user-facing impact, and affected auth flow.

## Owner
- Identity and access team
