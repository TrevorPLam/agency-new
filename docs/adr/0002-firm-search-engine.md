# ADR-002: firm-search Engine

## Context and Problem Statement

The Agency Platform needs powerful search capabilities across documents, user data, and generated content. This includes both traditional full-text search and semantic search for AI-generated content. The search engine must support multi-tenant isolation, real-time indexing, and integration with the read-model architecture. What technology stack should power the firm-search package?

## Decision Drivers

* Multi-tenant isolation: Search results must be tenant-scoped
* Performance: Sub-second query response for large datasets
* AI integration: Support for vector similarity search
* Cost: Minimize infrastructure and operational costs
* Maintainability: Leverage existing PostgreSQL expertise

## Considered Options

* PostgreSQL (tsvector + pgvector)
* Elasticsearch (separate cluster)
* Hybrid (PostgreSQL + Elasticsearch)

## Decision Outcome

Chosen option: "PostgreSQL (tsvector + pgvector)", because it leverages our existing database infrastructure, provides excellent full-text search via tsvector, and supports semantic search through pgvector extension, all while maintaining tenant isolation through RLS.

### Consequences

* Good, because no additional infrastructure required
* Good, because pgvector enables efficient vector similarity search for AI features
* Good, because tsvector provides proven full-text search performance
* Good, because maintains data consistency with existing read models
* Bad, because may require query optimization for very large datasets

### Confirmation

Implementation will be validated through:
- Benchmark tests comparing search performance
- Accuracy tests for semantic search results
- Multi-tenant isolation verification
- Integration with firm-db read-model package

## Pros and Cons of the Options

### PostgreSQL (tsvector + pgvector)

* Good, because unified data store reduces complexity
* Good, because pgvector provides state-of-the-art vector search
* Good, because leverages existing DBA expertise
* Good, because automatic tenant isolation via RLS
* Neutral, because may need indexing strategy optimization

### Elasticsearch

* Good, because specialized for search workloads
* Good, because excellent performance and features
* Neutral, because supports vector search via plugins
* Bad, because additional infrastructure and operational complexity
* Bad, because requires ETL pipeline for tenant isolation

### Hybrid

* Good, because combines strengths of both systems
* Neutral, because can optimize each workload separately
* Bad, because doubles operational complexity
* Bad, because introduces data synchronization challenges
* Bad, because increases cost significantly

## More Information

This decision positions the platform for both traditional search and AI-powered discovery. The firm-search package will be implemented as a separate read-model service. Status: accepted.