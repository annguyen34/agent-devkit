# GitHub Copilot Instructions

## Project Context

This project uses structured AI-assisted development with phase documentation in `{{docsDir}}/`.

## Documentation Structure

Reference these docs for context when suggesting code:

- `{{docsDir}}/requirements/` — What we're building and why
- `{{docsDir}}/design/` — Architecture and design decisions
- `{{docsDir}}/planning/` — Task breakdown and priorities
- `{{docsDir}}/testing/` — Testing strategy

## Code Standards

- Prefer self-documenting code with meaningful variable and function names
- Add inline comments only for non-obvious logic (the WHY, not the WHAT)
- Keep functions focused on a single responsibility
- Validate inputs at system boundaries; trust internal invariants

## Testing Standards

- Write tests alongside implementation
- Cover critical paths at 100%; aim for 80%+ overall
- Prefer real dependencies over mocks where practical

## Suggestions Guidelines

When suggesting code completions:

1. Align with patterns already established in the codebase
2. Prefer existing utilities over new implementations
3. Flag potential security issues (injection, validation, secrets)
4. Suggest adding tests when implementing new logic
