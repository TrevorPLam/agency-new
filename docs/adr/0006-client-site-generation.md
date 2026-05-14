# ADR-006: Client Site Generation Model

## Context and Problem Statement

Client websites need to be generated dynamically based on tenant configuration and content. We must decide whether to generate sites on-demand (ephemeral) or commit generated code to repositories. This affects deployment, versioning, and performance. How should client sites be generated and hosted?

## Decision Drivers

* Performance: Fast site generation and serving
* Scalability: Handle variable client loads
* Maintainability: Easy updates and rollbacks
* Cost: Minimize hosting and compute costs
* Compliance: Support for client-specific customizations

## Considered Options

* Ephemeral generation with Redis caching
* Committed generation to git repositories
* Hybrid approach with caching layer

## Decision Outcome

Chosen option: "Ephemeral generation with Redis caching", because it provides fast, scalable site generation using Astro templates with 24-hour TTL caching, balances performance with update flexibility, and leverages existing Redis infrastructure.

### Consequences

* Good, because enables real-time customization
* Good, because scales automatically with load
* Good, because leverages existing caching infrastructure
* Good, because supports A/B testing and rapid iteration
* Bad, because cache misses require generation time

### Confirmation

Implementation will be validated through:
- Generation performance benchmarks
- Cache hit ratio monitoring
- Load testing for concurrent requests
- Update propagation testing

## Pros and Cons of the Options

### Ephemeral generation with Redis caching

* Good, because instant updates without deployment
* Good, because scales with Redis clustering
* Good, because supports dynamic personalization
* Neutral, because requires generation on cache miss
* Bad, because potential cold start delays

### Committed generation

* Good, because predictable performance
* Good, because standard deployment processes
* Neutral, because supports CDN optimization
* Bad, because slow update cycles
* Bad, because increases repository complexity

### Hybrid approach

* Good, because combines benefits of both
* Neutral, because can optimize frequently changing content
* Bad, because increases architectural complexity
* Bad, because requires synchronization logic
* Bad, because higher operational overhead

## More Information

Sites will use Astro for static generation with dynamic client-side features. Status: accepted.