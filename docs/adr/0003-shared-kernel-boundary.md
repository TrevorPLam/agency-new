# ADR-003: firm-types Shared Kernel Boundary

## Context and Problem Statement

The current @firm/types package mixes low-level primitives (TenantId, UserId) with domain entities (User, Tenant). This creates circular dependencies and violates layered architecture principles. We need to establish clear boundaries for the shared kernel to enable proper dependency management across all packages. How should we split the firm-types package?

## Decision Drivers

* Layered architecture compliance: Primitives in L0, domain in L1
* Dependency management: Prevent circular imports
* Type safety: Maintain branded types across layers
* Scalability: Support independent evolution of layers

## Considered Options

* Extract firm-primitives (L0) package
* Keep all in firm-types but with internal boundaries
* Split into firm-primitives and firm-domain

## Decision Outcome

Chosen option: "Extract firm-primitives (L0) package", because it cleanly separates infrastructure concerns from domain logic, enables proper layered dependencies, and allows primitives to be used across all layers without circular imports.

### Consequences

* Good, because establishes clear architectural boundaries
* Good, because prevents circular dependencies
* Good, because enables independent testing and evolution
* Good, because aligns with DDD shared kernel pattern
* Neutral, because requires migration of existing imports

### Confirmation

Implementation will be validated through:
- Dependency graph analysis (no circular imports)
- Type checking across all packages
- CI gate to enforce layer boundaries
- Migration testing for existing code

## Pros and Cons of the Options

### Extract firm-primitives (L0) package

* Good, because clean separation of concerns
* Good, because enables proper dependency flow
* Good, because supports micro-package evolution
* Neutral, because requires coordinated migration
* Bad, because increases package count

### Keep all in firm-types with internal boundaries

* Good, because minimizes package changes
* Neutral, because internal organization can enforce boundaries
* Bad, because still allows accidental cross-layer imports
* Bad, because doesn't solve circular dependency root cause
* Bad, because violates layered architecture principles

### Split into firm-primitives and firm-domain

* Good, because clear naming and purpose
* Good, because supports independent versioning
* Neutral, because similar to extract option
* Bad, because domain package name conflicts with DDD terminology
* Neutral, because requires same migration effort

## More Information

This decision is foundational for all other packages. The firm-primitives package will contain only branded IDs, enums, and basic types. Status: accepted.