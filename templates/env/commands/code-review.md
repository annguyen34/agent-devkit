---
description: Perform a structured code review of recent changes against requirements, design, and quality standards
---

Perform a local code review **before** pushing changes.

## 1. Gather Context

If not already provided, ask for:

- Feature/branch description
- List of modified files
- Relevant design doc(s) — e.g., `{{docsDir}}/design/{feature-name}.md`
- Known constraints or risky areas
- Which tests have been run

Also review the latest diff via `git status` and `git diff --stat`.

## 2. Understand Design Alignment

For each design doc, summarize architectural intent and critical constraints.

## 3. File-by-File Review

For every modified file:

- Check alignment with design/requirements and flag deviations
- Spot logic issues, edge cases, and redundant code
- Flag security concerns (input validation, secrets, auth, data handling)
- Check error handling, performance, and observability
- Identify missing or outdated tests

## 4. Cross-Cutting Concerns

- Verify naming consistency and project conventions
- Confirm docs/comments updated where behavior changed
- Identify missing tests (unit, integration, E2E)
- Check for needed configuration or migration updates

## 5. Summarize Findings

Categorize each finding as **blocking**, **important**, or **nice-to-have** with: file, issue, impact, recommendation, and design reference.

## 6. Next Command Guidance

If blocking issues remain, return to `{{cmd}}execute-plan` (code fixes) or `{{cmd}}writing-test` (test gaps); if clean, proceed with push/PR workflow.
