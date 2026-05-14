---
name: ADR Proposal
description: Propose a new Architectural Decision Record
title: "[ADR] "
labels: ["adr"]
assignees: []
body:
  - type: textarea
    id: title
    attributes:
      label: ADR Title
      description: The title of the proposed ADR.
      placeholder: e.g., Choose a database technology
    validations:
      required: true
  - type: textarea
    id: context
    attributes:
      label: Context
      description: Describe the context and forces at play.
      placeholder: What is the issue we are trying to solve?
    validations:
      required: true
  - type: textarea
    id: decision
    attributes:
      label: Proposed Decision
      description: What is the proposed decision?
      placeholder: What is the change that we're proposing?
    validations:
      required: true
  - type: textarea
    id: consequences
    attributes:
      label: Consequences
      description: What becomes easier or more difficult to do because of this change?
      placeholder: What are the positive and negative consequences?
    validations:
      required: true
  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives Considered
      description: What other options were considered?
  - type: textarea
    id: additional
    attributes:
      label: Additional Context
      description: Any other context or references.
