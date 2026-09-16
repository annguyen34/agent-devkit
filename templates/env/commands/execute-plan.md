---
description: Execute the implementation plan task by task with confirmation at each step
---

Help me work through a feature plan one task at a time.

## 1. Gather Context

If not already provided, ask for:

- **Feature name** — kebab-case (e.g., `user-authentication`)
- **Brief feature/branch description**
- **Planning doc path** — default `{{docsDir}}/planning/{feature-name}.md`
- **Supporting docs** — design, requirements

## 2. Load & Present Plan

Read the planning doc and parse task lists (headings + checkboxes). Present an ordered task queue grouped by section, with status: `todo`, `in-progress`, `done`, `blocked`.

## 3. Interactive Task Execution

For each task in order:

- Display context and full task description
- Reference relevant design/requirements docs
- Offer to outline sub-steps before starting
- After work, prompt for status update (`done`, `in-progress`, `blocked`, `skipped`) with short notes
- If blocked, record the blocker and move to a "Blocked" list

## 4. Update Planning Doc

After each completed or status-changed task, update `{{docsDir}}/planning/{feature-name}.md` to keep it accurate.

## 5. Session Summary

Produce a summary:

- **Completed** — tasks finished this session
- **In Progress** — tasks started, with next steps
- **Blocked** — tasks blocked, with blockers
- **Skipped/Deferred** — tasks intentionally skipped
- **New Tasks** — tasks discovered during implementation

## 6. Next Command Guidance

Continue `{{cmd}}execute-plan` until plan completion; then run `{{cmd}}writing-test` and `{{cmd}}code-review`.
