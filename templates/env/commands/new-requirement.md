---
description: Capture a new feature requirement and scaffold all phase documents
---

Guide me through adding a new feature, from requirements documentation to implementation readiness.

## 1. Capture Requirement

If not already provided, ask for:

- **Feature name** — kebab-case (e.g., `user-authentication`)
- **Problem statement** — what problem it solves and who will use it
- **Key user stories** — at least 2–3 "As a … I want … so that …" statements

## 2. Create Feature Documentation Structure

Read each phase README in `{{docsDir}}/` and copy its exact content into a new feature-specific file. Do not overwrite files that already exist.

| Template (source)                    | Feature file (destination)                   |
| ------------------------------------ | -------------------------------------------- |
| `{{docsDir}}/requirements/README.md` | `{{docsDir}}/requirements/{feature-name}.md` |
| `{{docsDir}}/design/README.md`       | `{{docsDir}}/design/{feature-name}.md`       |
| `{{docsDir}}/planning/README.md`     | `{{docsDir}}/planning/{feature-name}.md`     |
| `{{docsDir}}/testing/README.md`      | `{{docsDir}}/testing/{feature-name}.md`      |

Preserve every section heading, table, code block, and placeholder exactly as it appears in the template.

## 3. Requirements Phase

Fill out `{{docsDir}}/requirements/{feature-name}.md` using the information gathered in step 1:

- **Problem Statement** — specific problem, who it affects, current workaround if any
- **Goals** — what should be true after this feature ships (replace `Goal 1`, `Goal 2` placeholders)
- **User Stories** — replace template placeholder with the actual user stories
- **Success Criteria** — at least 3 specific, testable, observable behaviors
- **Constraints** — technical and business constraints
- **Out of Scope** — what related things will NOT be done in this iteration

## 4. Design Phase

Fill out `{{docsDir}}/design/{feature-name}.md`:

- **Architecture Overview** — replace description and update the mermaid diagram to reflect actual components
- **Data Models** — replace example interface with real types/models
- **API Design** — list real endpoints or interfaces; remove placeholder row if not applicable
- **Component Design** — describe each component's responsibility, inputs, and outputs
- **Design Decisions** — document key choices and alternatives considered
- **Security Considerations** — authentication, authorization, data validation specifics

## 5. Planning Phase

Fill out `{{docsDir}}/planning/{feature-name}.md`:

- **Task Breakdown** — replace placeholder phases and tasks with real ones
- **Dependencies** — fill in the dependency table; write "None" if empty
- **Risks** — identify likelihood, impact, and mitigation for each risk

## 6. Next Command Guidance

```
✅ Feature docs scaffolded for: {name}

Next steps:
  {{cmd}}review-requirements  — validate requirements before moving to design
  {{cmd}}review-design        — after design doc is filled in
  {{cmd}}execute-plan         — once both reviews pass
```
