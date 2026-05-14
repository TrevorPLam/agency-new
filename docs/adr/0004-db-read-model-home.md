# ADR-004: firm-db Read-Model Home

## Context and Problem Statement

The current @firm/db package contains both write model (normalized schema) and read model concerns. For optimal query performance and CQRS implementation, we need to separate read models from the transactional write database. Where should read models be hosted and how should they be maintained?

## Decision Drivers

* Performance: Read models optimized for query patterns
* Consistency: Eventual consistency with write model
* Scalability: Ability to scale reads independently
* Maintainability: Clear separation of concerns
* Cost: Minimize infrastructure complexity

## Considered Options

* Separate PostgreSQL database for reads
* Materialized views in same database
* Redis cache with PostgreSQL backing

## Decision Outcome

Chosen option: "Materialized views in same database", because it provides read optimization while maintaining transactional consistency, leverages existing PostgreSQL infrastructure, and simplifies operational complexity compared to separate databases.

### Consequences

* Good, because maintains ACID consistency with writes
* Good, because leverages existing DBA expertise
* Good, because reduces infrastructure costs
* Good, because supports complex aggregations efficiently
* Bad, because materialized views can impact write performance

### Confirmation

Implementation will be validated through:
- Performance benchmarks for read queries
- Consistency tests between write and read models
- CI validation of view definitions
- Monitoring of refresh performance impact

## Pros and Cons of the Options

### Materialized views in same database

* Good, because automatic consistency with base tables
* Good, because no additional infrastructure
* Good, because supports complex transformations
* Neutral, because refresh can be scheduled or on-demand
* Bad, because concurrent refreshes can lock tables

### Separate PostgreSQL database

* Good, because complete read scaling independence
* Good, because no impact on write performance
* Neutral, because requires replication setup
* Bad, because increases operational complexity
* Bad, because potential consistency lag

### Redis cache with PostgreSQL backing

* Good, because excellent read performance
* Good, because scales horizontally
* Neutral, because supports complex data structures
* Bad, because cache invalidation complexity
* Bad, because not suitable for complex aggregations

## More Information

Read models will be implemented in a separate firm-db-read package with automated refresh triggers. Status: accepted.