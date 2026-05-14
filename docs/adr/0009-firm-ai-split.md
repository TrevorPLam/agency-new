# ADR-009: firm-ai Split Boundary

## Context and Problem Statement

AI functionality spans multiple concerns: routing requests, metering usage, content moderation, and API integration. The EU AI Act (deadline Dec 2, 2026) requires human oversight for high-risk AI systems. How should we architect the firm-ai package to ensure compliance while maintaining clean boundaries?

## Decision Drivers

* Compliance: Meet EU AI Act requirements for human oversight
* Security: Isolate API keys and external AI services
* Maintainability: Clear separation of concerns
* Scalability: Independent scaling of components
* Auditability: Complete traceability of AI decisions

## Considered Options

* Core package (routing, metering, moderation) + Adapters (API calls)
* Monolithic AI package
* External AI service integration

## Decision Outcome

Chosen option: "Core package (routing, metering, moderation) + Adapters (API calls)", because it enables clean separation between business logic and external integrations, supports required human approval workflows, and ensures compliance with regulatory requirements while maintaining architectural flexibility.

### Consequences

* Good, because enables regulatory compliance
* Good, because isolates external API dependencies
* Good, because supports human-in-the-loop workflows
* Good, because enables independent testing and scaling
* Neutral, because requires careful interface design

### Confirmation

Implementation will be validated through:
- Compliance audit against EU AI Act requirements
- Security testing for API key isolation
- Human approval workflow testing
- Performance testing for routing and metering

## Pros and Cons of the Options

### Core + Adapters split

* Good, because supports regulatory compliance
* Good, because clean architectural boundaries
* Good, because enables human oversight integration
* Good, because isolates external dependencies
* Neutral, because requires coordination between packages

### Monolithic package

* Good, because simpler deployment
* Neutral, because unified codebase
* Bad, because mixes business and infrastructure concerns
* Bad, because harder to achieve compliance isolation
* Bad, because couples AI routing to specific providers

### External service

* Good, because offloads operational complexity
* Neutral, because can be compliant if designed properly
* Bad, because increases vendor dependency
* Bad, because harder to customize routing logic
* Bad, because potential data residency issues

## More Information

All AI-generated content will require human approval before delivery. Status: accepted.