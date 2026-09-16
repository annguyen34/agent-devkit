---
description: Generate a complete test suite for a feature based on requirements and implementation
---

Review `{{docsDir}}/testing/{feature-name}.md` and ensure it mirrors the base template before writing tests.

## 1. Gather Context

If not already provided, ask for:

- Feature name/branch
- Summary of changes — link to design & requirements docs
- Target environment
- Existing test suites
- Any flaky or slow tests to avoid

## 2. Analyze Testing Template

- Identify required sections from `{{docsDir}}/testing/{feature-name}.md`
- Confirm success criteria and edge cases from requirements & design docs
- Note available mocks/stubs/fixtures

## 3. Unit Tests (aim for 100% coverage)

For each module/function:

- List behavior scenarios (happy path, edge cases, error handling)
- Generate test cases with assertions using existing utilities/mocks
- Highlight missing branches preventing full coverage

## 4. Integration Tests

- Identify critical cross-component flows
- Define setup/teardown steps
- Test cases for interaction boundaries, data contracts, and failure modes

## 5. Coverage Strategy

- Recommend coverage tooling commands
- Call out files/functions still needing coverage
- Suggest additional tests if <100%

## 6. Update Documentation

- Summarize tests added or still missing
- Update `{{docsDir}}/testing/{feature-name}.md` with links to test files and results
- Flag deferred tests as follow-up tasks

## 7. Next Command Guidance

If tests expose design issues, return to `{{cmd}}review-design`; otherwise continue to `{{cmd}}code-review`.
