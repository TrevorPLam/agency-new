# ADR-005: Application Grouping

## Context and Problem Statement

The platform currently plans ~22 feature applications, which creates deployment and operational complexity. We need to group these into 3-5 logical applications that share common domains, deployment cycles, and scaling requirements. How should we organize the application architecture?

## Decision Drivers

* Deployment efficiency: Minimize deployment frequency and complexity
* Domain cohesion: Group related features together
* Scaling requirements: Align with expected load patterns
* Team organization: Support independent development teams
* Operational simplicity: Reduce infrastructure overhead

## Considered Options

* 4 applications: Admin, Marketing Hub, Sales/CRM, Service Delivery
* 3 applications: Core, Client-Facing, Operations
* Monolithic application

## Decision Outcome

Chosen option: "4 applications: Admin, Marketing Hub, Sales/CRM, Service Delivery", because it balances domain cohesion with operational simplicity, supports independent scaling of high-traffic areas, and aligns with business capabilities while keeping deployment complexity manageable.

### Consequences

* Good, because groups related business capabilities
* Good, because enables independent scaling of Marketing Hub
* Good, because supports focused development teams
* Good, because reduces deployment coordination overhead
* Neutral, because requires careful API design between apps

### Confirmation

Implementation will be validated through:
- Domain analysis of feature dependencies
- Load testing projections for each group
- API contract stability testing
- Deployment pipeline efficiency metrics

## Pros and Cons of the Options

### 4 applications

* Good, because balances cohesion and separation
* Good, because supports business domain alignment
* Good, because enables targeted scaling
* Neutral, because moderate deployment complexity
* Bad, because requires inter-app communication design

### 3 applications

* Good, because minimizes deployment overhead
* Good, because simpler operational model
* Neutral, because broader domain scope per app
* Bad, because may create scaling bottlenecks
* Bad, because larger blast radius for deployments

### Monolithic

* Good, because simplest deployment model
* Good, because no inter-app communication issues
* Neutral, because single scaling unit
* Bad, because hinders independent feature development
* Bad, because increases complexity for large teams

## More Information

Applications will be deployed as separate Next.js applications with shared packages. Status: accepted.