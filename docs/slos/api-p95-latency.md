# API P95 Latency SLO

## Objective
Keep API response times fast and predictable for end users.

## Target
- 95th percentile API latency ≤ 250ms over a rolling 30-day window.

## Measurement
- Source: application request telemetry for production API endpoints.
- Calculation: 95th percentile of request duration for successful and user-facing HTTP requests.
- Window: 30 days.

## Error Budget
- Budget: 5% of requests may exceed the 250ms target.
- Burn rate: measured daily against the 30-day rolling window.

## Alerting
- Trigger when 3 consecutive daily measurements exceed the error budget.
- Pager/team escalation: on sustained budget burn above 50% for 24 hours.

## Owner
- Platform reliability team
