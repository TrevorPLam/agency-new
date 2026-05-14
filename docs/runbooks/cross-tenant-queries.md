# Cross-Tenant Queries Runbook

## Purpose
Respond immediately to any detected cross-tenant data access.

## Symptoms
- Cross-tenant query audit alerts fire.
- Tenant isolation violations are detected in logs.

## Immediate Actions
1. Pause the affected query surface if possible.
2. Notify security and platform teams immediately.
3. Gather evidence from the audit trail and request logs.

## Investigation
- Identify the failing query and tenant context used.
- Confirm whether the violation is caused by code, policy, or configuration.
- Check whether data access controls were bypassed or misapplied.

## Mitigation
- Revoke any temporary access that enabled the violation.
- Fix the query parameters or tenant scoping logic.
- Restore correct tenant isolation policies.

## Post-Incident
- Perform a security review for similar patterns.
- Document the incident and tighten policy enforcement.
