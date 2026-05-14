# AI Approval Rate SLO

## Objective
Ensure AI-driven recommendations and approvals meet reliability expectations.

## Target
- 99% approval decisions are successfully processed and actionable.

## Measurement
- Source: AI workflow telemetry and approval outcome logs.
- Calculation: successful AI approval completions divided by total AI approval attempts.
- Window: 30 days.

## Error Budget
- Budget: 1% failure rate for AI approval workflows.
- Burn rate: tracked daily with escalation when budget overspend exceeds 24 hours.

## Alerting
- Trigger when AI approval failure rate exceeds 1% for 2 of 3 consecutive days.
- Include workflow name, model call status, and end-user impact.

## Owner
- AI operations and workflow reliability team
