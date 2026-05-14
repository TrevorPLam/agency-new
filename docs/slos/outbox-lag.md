# Outbox Lag SLO

## Objective
Ensure event delivery remains timely and avoids processing delays.

## Target
- 99.5% of outbox messages are delivered within 60 seconds.

## Measurement
- Source: outbox processing metrics and delivery timestamps.
- Calculation: percentage of outbox records consumed and published within 60 seconds of enqueue time.
- Window: 30 days.

## Error Budget
- Budget: 0.5% of outbox deliveries may exceed the 60-second target.
- Burn rate: monitored daily against the 30-day rolling window.

## Alerting
- Trigger when daily outbox lag exceeds budget for 2 of 3 consecutive days.
- Include host, queue, and backlog context.

## Owner
- Event pipeline reliability team
