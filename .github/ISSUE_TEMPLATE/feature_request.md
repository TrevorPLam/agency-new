---
name: Feature Request
description: Suggest a new feature or enhancement
title: "[FEATURE] "
labels: ["enhancement"]
assignees: []
body:
  - type: textarea
    id: summary
    attributes:
      label: Summary
      description: A brief summary of the feature request.
      placeholder: What feature would you like to see?
    validations:
      required: true
  - type: textarea
    id: problem
    attributes:
      label: Problem
      description: Describe the problem this feature would solve.
      placeholder: Is there a problem this feature would solve? If so, describe it.
    validations:
      required: true
  - type: textarea
    id: solution
    attributes:
      label: Proposed Solution
      description: Describe the solution you'd like.
      placeholder: Describe what you want to happen.
    validations:
      required: true
  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives Considered
      description: Describe any alternative solutions or features you've considered.
  - type: textarea
    id: additional
    attributes:
      label: Additional Context
      description: Any other context or screenshots about the feature request.
