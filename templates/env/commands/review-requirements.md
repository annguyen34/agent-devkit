---
description: Review all requirements documents for completeness, clarity, and testability
---

Review `{{docsDir}}/requirements/{feature-name}.md` and the project-level template to ensure structure and content alignment.

1. Summarize:
   - Core problem statement and affected users
   - Goals, non-goals, and success criteria
   - Primary user stories & critical flows
   - Constraints, assumptions, open questions
   - Any missing sections or deviations from the template
2. **Clarify and explore (loop until converged)**:
   - **Ask clarification questions** for every gap, contradiction, or ambiguity. Do not just list issues — actively ask specific questions to resolve them.
   - **Brainstorm and explore options** — For key decisions, trade-offs, or areas with multiple viable approaches, proactively brainstorm alternatives. Present options with pros/cons and trade-offs. Challenge assumptions and surface creative alternatives.
   - **Repeat** — Continue looping until the user is satisfied with the chosen approach and no open questions remain.
3. **Next Command Guidance** — If fundamentals are missing, go back to `{{cmd}}new-requirement`; otherwise continue to `{{cmd}}review-design`.
