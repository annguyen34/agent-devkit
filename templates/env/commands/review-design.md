---
description: Review design documents for completeness, accuracy, and alignment with requirements
---

Review the design documentation in `{{docsDir}}/design/{feature-name}.md` (and the project-level README if relevant).

1. Summarize:
   - Architecture overview (ensure mermaid diagram is present and accurate)
   - Key components and their responsibilities
   - Technology choices and rationale
   - Data models and relationships
   - API/interface contracts (inputs, outputs, auth)
   - Major design decisions and trade-offs
   - Non-functional requirements that must be preserved
2. **Clarify and explore (loop until converged)**:
   - **Ask clarification questions** for every gap, inconsistency, or misalignment between requirements and design. Do not just list issues — actively ask specific questions to resolve them.
   - **Brainstorm and explore options** — For key architecture decisions, trade-offs, or areas with multiple viable approaches, proactively brainstorm alternatives. Present options with pros/cons and trade-offs. Challenge assumptions and surface creative alternatives.
   - **Repeat** — Continue looping until the user is satisfied with the chosen approach and no open questions remain.
3. **Next Command Guidance** — If requirements gaps are found, return to `{{cmd}}review-requirements`; if design is sound, continue to `{{cmd}}execute-plan`.
