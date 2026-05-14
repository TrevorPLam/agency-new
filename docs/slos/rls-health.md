# RLS Health SLO

## Objective
Keep row-level security enforcement reliable for tenant-isolated data requests.

## Target
- 99.9% of RLS-protected queries execute successfully without permission or policy violations.

## Measurement
- Source: database query telemetry and RLS enforcement error logs.
- Calculation: percentage of RLS queries that complete successfully vs. total RLS-protected query attempts.
- Window: 30 days.

## Error Budget
- Budget: 0.1% failure rate for RLS enforcement errors.
- Burn rate: monitored daily and escalated if overspend persists for 24 hours.

## Alerting
- Trigger when RLS enforcement failure rate exceeds budget for 2 of 3 consecutive days.
- Include impacted tenant segments and query types.

## Owner
- Data security and compliance team
