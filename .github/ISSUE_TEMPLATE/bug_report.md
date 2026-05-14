---
name: Bug Report
description: Report a bug or issue
title: "[BUG] "
labels: ["bug"]
assignees: []
body:
  - type: textarea
    id: description
    attributes:
      label: Description
      description: A clear and concise description of the bug.
      placeholder: Describe what happened.
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: Steps to Reproduce
      description: Steps to reproduce the behavior.
      placeholder: |
        1. Go to '...'
        2. Click on '...'
        3. See error
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: What you expected to happen.
    validations:
      required: true
  - type: textarea
    id: actual
    attributes:
      label: Actual Behavior
      description: What actually happened.
    validations:
      required: true
  - type: input
    id: version
    attributes:
      label: Version
      description: Version of the software where the bug occurred.
      placeholder: e.g., v1.0.0
  - type: textarea
    id: environment
    attributes:
      label: Environment
      description: Details about your environment.
      placeholder: OS, browser, etc.
  - type: textarea
    id: additional
    attributes:
      label: Additional Context
      description: Any other context about the problem.
