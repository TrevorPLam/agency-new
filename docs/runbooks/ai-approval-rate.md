# AI Approval Rate Runbook

## Purpose
Recover AI approval workflows after failures or outages.

## Symptoms
- AI approval success rate drops below 99%.
- Approval workflows stall or return errors.

## Immediate Actions
1. Check AI service connectivity and model call health.
2. Verify whether downstream approval processing is available.
3. Review recent changes to AI workflow configuration.

## Investigation
- Inspect model response times, error codes, and rejection rates.
- Confirm that approval payloads are valid and complete.
- Check fallback behavior and retry logic.

## Mitigation
- Restart AI workflow workers or services if stalled.
- Apply a temporary fallback approval path if safe.
- Disable problematic model variants until the issue is fixed.

## Post-Incident
- Document cause and remediation.
- Adjust model validation and monitoring as needed.
