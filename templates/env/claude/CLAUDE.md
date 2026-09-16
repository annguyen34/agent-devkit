# AI Development Rules

## Project Context

This project uses structured AI-assisted development. Phase documentation is in `{{docsDir}}/`.

## Documentation Structure

- `{{docsDir}}/requirements/` — Problem understanding and requirements
- `{{docsDir}}/design/` — System architecture and design decisions (include mermaid diagrams)
- `{{docsDir}}/planning/` — Task breakdown and project planning
- `{{docsDir}}/testing/` — Testing strategy and test cases

## Development Workflow

1. Review phase documentation in `{{docsDir}}/` before implementing
2. For new features, start with `/new-requirement`
3. Keep docs updated as the project evolves
4. Reference planning doc for task priorities

## Code Standards

- Write clear, self-documenting code with meaningful names
- Add comments only when the WHY is non-obvious
- No speculative features — implement only what is required
- Validate at system boundaries; trust internal code

## Testing

- Write tests alongside implementation
- Target 80%+ coverage; 100% on critical paths
- Use `/writing-test` to generate tests

## Key Commands

- `/new-requirement` — Start a new feature from requirements
- `/review-requirements` — Review requirements documentation
- `/review-design` — Review design documentation
- `/execute-plan` — Execute implementation plan interactively
- `/writing-test` — Generate tests for a feature
- `/code-review` — Structured code review
