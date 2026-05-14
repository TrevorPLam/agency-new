# Contributing to Agency Platform Monorepo

Thank you for your interest in contributing to the Agency Platform Monorepo! We welcome contributions from the community. Please read this guide to understand how to contribute effectively.

## Development Setup

1. Fork the repository and clone it locally.
2. Install dependencies using `pnpm install`.
3. Run tests with `pnpm test`.
4. Build the project with `pnpm build`.

## Branch Naming Convention

- Use descriptive names for branches.
- Prefix with the type: `feature/`, `bugfix/`, `hotfix/`, `chore/`.
- Example: `feature/add-user-authentication`

## Pull Request Process

1. Create a pull request (PR) from your branch to the main branch.
2. Ensure all tests pass and code coverage is at least 80%.
3. Include a clear description of the changes.
4. If the changes are breaking or introduce new architecture decisions, propose an ADR (Architecture Decision Record) as per the ADR proposal process below.

## ADR Proposal Process

For significant changes or architectural decisions:

1. Create a new ADR in `docs/adr/` following the template in `docs/adr/0000-template.md`.
2. Submit it as a PR with the label `adr-proposal`.
3. The ADR will be reviewed and, if accepted, merged with status `accepted`.

## Code Style

- Follow the ESLint and Prettier configurations in the repository.
- Write tests for new features and bug fixes.
- Ensure TypeScript types are properly defined.

## Reporting Issues

- Use the issue templates in `.github/ISSUE_TEMPLATE/`.
- Provide detailed steps to reproduce bugs.

We appreciate your contributions!