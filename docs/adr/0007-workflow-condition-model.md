# ADR-007: firm-workflow Condition Model

## Context and Problem Statement

Workflows require conditional logic for branching, approvals, and automated actions. We need a standardized way to define and evaluate conditions that integrates with the event-driven architecture. What format and execution model should conditions use?

## Decision Drivers

* Expressiveness: Support complex business rules
* Performance: Fast condition evaluation
* Maintainability: Easy to read and modify
* Integration: Works with event system and sagas
* Auditability: Clear condition execution trails

## Considered Options

* JSON Schema conditions with Inngest execution
* Custom DSL with interpreter
* Code-based conditions

## Decision Outcome

Chosen option: "JSON Schema conditions with Inngest execution", because it provides standardized, declarative condition definition that integrates seamlessly with the Inngest saga engine, supports complex logic through JSON Schema, and enables audit trails through structured evaluation.

### Consequences

* Good, because declarative and versionable
* Good, because integrates with existing event system
* Good, because supports complex nested conditions
* Good, because enables condition reuse across workflows
* Neutral, because requires JSON Schema knowledge

### Confirmation

Implementation will be validated through:
- Condition evaluation performance tests
- Complex workflow simulation testing
- Integration tests with Inngest sagas
- Audit log verification

## Pros and Cons of the Options

### JSON Schema conditions with Inngest execution

* Good, because standardized and tool-supported
* Good, because integrates with saga orchestration
* Good, because enables declarative workflow design
* Neutral, because learning curve for JSON Schema
* Bad, because less expressive than custom DSL

### Custom DSL

* Good, because can be tailored to business needs
* Good, because potentially more readable
* Neutral, because requires custom parser development
* Bad, because maintenance burden
* Bad, because harder to integrate with tools

### Code-based conditions

* Good, because maximum flexibility
* Good, because leverages existing TypeScript skills
* Neutral, because can be tested and versioned
* Bad, because harder to audit and modify
* Bad, because couples conditions to deployment cycles

## More Information

Conditions will be evaluated by the firm-workflow package using JSON Schema validation. Status: accepted.