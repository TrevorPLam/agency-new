# ADR-008: Template Engine Choice

## Context and Problem Statement

The platform needs to generate templated content across multiple channels: email, SMS, and PDF documents. We require a consistent templating language that supports variable substitution, conditional logic, and loops. What template engine should be used across all channels?

## Decision Drivers

* Consistency: Same syntax across all output formats
* Security: Prevent code injection vulnerabilities
* Performance: Fast rendering for high-volume generation
* Features: Support for complex logic and formatting
* Ecosystem: Good library support and community

## Considered Options

* Liquid (single language for all channels)
* Handlebars (JavaScript native)
* Multiple engines per channel

## Decision Outcome

Chosen option: "Liquid (single language for all channels)", because it provides a secure, sandboxed templating language that works consistently across email, SMS, and PDF generation, has excellent performance characteristics, and enables template reuse across channels.

### Consequences

* Good, because single language reduces complexity
* Good, because secure by design (no code execution)
* Good, because excellent performance for text generation
* Good, because supports complex conditional logic
* Neutral, because requires learning Liquid syntax

### Confirmation

Implementation will be validated through:
- Rendering performance benchmarks
- Security testing for injection prevention
- Multi-channel output verification
- Template complexity testing

## Pros and Cons of the Options

### Liquid

* Good, because secure sandboxed execution
* Good, because consistent across all channels
* Good, because fast rendering performance
* Good, because rich feature set for templates
* Neutral, because syntax learning curve

### Handlebars

* Good, because JavaScript ecosystem integration
* Good, because familiar syntax for developers
* Neutral, because good performance
* Bad, because security concerns with helpers
* Bad, because different engines needed for PDF

### Multiple engines per channel

* Good, because can optimize each channel
* Neutral, because uses best tool for each job
* Bad, because increases maintenance complexity
* Bad, because template authors need multiple syntaxes
* Bad, because harder to share templates

## More Information

Templates will be stored in the database and rendered by the firm-templates package. Status: accepted.