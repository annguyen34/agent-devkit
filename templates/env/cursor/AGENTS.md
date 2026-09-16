# AI Development Rules

## Project Context

This project uses structured AI-assisted development. Phase documentation is in `{{docsDir}}/`.

## Documentation Structure

- `{{docsDir}}/requirements/` — Problem understanding and requirements
- `{{docsDir}}/design/` — System architecture and design decisions (include mermaid diagrams)
- `{{docsDir}}/planning/` — Task breakdown and project planning
- `{{docsDir}}/testing/` — Testing strategy and test cases

## Development Workflow

1. Review `{{docsDir}}/` before implementing any feature
2. For new features, create documentation in each phase directory first
3. Update phase docs when requirements or design changes
4. Reference planning doc for task breakdown and priorities

## Code Standards

- Write clear, self-documenting code with meaningful names
- Add comments only when the WHY is non-obvious
- No speculative features or premature abstractions
- Validate at system boundaries; trust internal code

## Testing

- Write tests alongside implementation
- Target 80%+ coverage on critical paths
- Run tests before considering any task complete

## Available Commands

Use these Cursor commands for structured work:

- `new-requirement` — Create a new feature requirement
- `review-requirements` — Review requirements documentation
- `review-design` — Review design documentation
- `execute-plan` — Execute implementation plan
- `writing-test` — Generate tests
- `code-review` — Structured code review
