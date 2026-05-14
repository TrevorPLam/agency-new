# ADR-001: firm-bus Engine

## Context and Problem Statement

The Agency Platform requires a robust event-driven architecture to handle asynchronous operations, sagas, and workflow orchestration. The outbox pattern is already implemented for transactional consistency, but we need a durable execution engine to process events reliably, handle retries, dead-letter queues, and cron-based scheduling. What technology should power the firm-bus package?

## Decision Drivers

* Reliability: Must guarantee at-least-once delivery and idempotent processing
* Scalability: Handle high-throughput event processing across multi-tenant environment
* Observability: Full tracing and monitoring integration with existing OpenTelemetry setup
* Cost: Minimize operational overhead and vendor lock-in
* Compliance: Support for audit trails and data residency requirements

## Considered Options

* Inngest (durable functions + Redis locking)
* Temporal (open-source workflow engine)
* Custom implementation using existing Redis + PostgreSQL

## Decision Outcome

Chosen option: "Inngest (durable functions + Redis locking)", because it provides durable execution with minimal infrastructure overhead, integrates well with our existing Redis setup, and supports the required saga patterns while maintaining cost-effectiveness.

### Consequences

* Good, because Inngest's durable functions ensure reliable execution across failures
* Good, because Redis-based locking prevents cron job conflicts in multi-instance deployments
* Good, because integrates with existing OpenTelemetry for end-to-end tracing
* Bad, because introduces a new vendor dependency (though self-hostable)
* Neutral, because requires learning Inngest's function-as-code paradigm

### Confirmation

Implementation will be validated through:
- Unit tests for saga orchestration
- Integration tests with outbox processing
- Load testing for throughput requirements
- CI gate to enforce event registry compliance

## Pros and Cons of the Options

### Inngest (durable functions + Redis locking)

* Good, because proven durability with exactly-once semantics
* Good, because Redis integration leverages existing infrastructure
* Good, because supports complex saga patterns out-of-the-box
* Neutral, because requires function deployment model
* Bad, because vendor dependency (mitigated by self-hosting option)

### Temporal

* Good, because fully open-source and self-hosted
* Good, because battle-tested in large-scale systems
* Neutral, because requires additional infrastructure (Cassandra/PostgreSQL)
* Bad, because higher operational complexity
* Bad, because steeper learning curve for team

### Custom implementation

* Good, because full control and no vendor lock-in
* Good, because can be tailored exactly to needs
* Neutral, because leverages existing Redis/PostgreSQL
* Bad, because high development and maintenance cost
* Bad, because risk of bugs in critical reliability code

## More Information

This decision enables Phase 2 feature development by providing the foundation for all asynchronous workflows. Implementation will start with outbox processing and expand to saga orchestration. Status: accepted.