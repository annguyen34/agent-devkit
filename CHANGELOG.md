# Changelog

## Unreleased

### Changed (breaking)

- `agent-devkit init` no longer creates root agent context files (`CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`). These files are now treated as user-owned and should be authored and versioned by the project. Slash commands, phase docs, and `.agent-devkit.json` are still scaffolded as before.
- `.git/info/exclude` no longer lists the root context files. On every init run, stale root-file entries left by prior init versions are also removed automatically so the user-owned files become visible to `git status` after upgrading.

### Migration

- If you relied on init to scaffold a starter `CLAUDE.md` (or `AGENTS.md` / `.github/copilot-instructions.md`), copy the boilerplate from `templates/env/<env>/` in this repo into your project root.
