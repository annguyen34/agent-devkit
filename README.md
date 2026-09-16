# agent-devkit

A CLI toolkit for structured AI-assisted development. Scaffolds documentation workflows and ensures consistent development practices across Claude Code, Cursor, and GitHub Copilot.

## Requirements

- Node.js >= 18.0.0

## Installation

This package is **not published to npm**. Install it directly from GitHub:

```bash
cd agent-devkit
npm install
npm run build
npm link
```

> **macOS / Linux only:** if `agent-devkit` is not recognized after linking, run `chmod +x dist/cli.js` and re-link.

**To update an existing install**, just pull and rebuild — no need to re-link:

```bash
git pull
npm run build
```

Then use `agent-devkit` from any project directory.

## Quick Start

```bash
cd my-project
agent-devkit init
```

The `init` command interactively prompts you to select:

- AI environments (Claude Code, Cursor, GitHub Copilot)
- Development phases (requirements, design, planning, testing, deployment, monitoring)

It then generates environment config files and phase documentation directories.

## Commands

### `init`

Initialize agent-devkit in a project.

```bash
agent-devkit init

# Non-interactive options
agent-devkit init --environments claude,cursor --phases requirements,design,planning
agent-devkit init --all                          # All environments and phases
agent-devkit init --docs-dir docs/ai-docs        # Custom docs directory (default: docs/ai)
```

**Generated files by environment:**

| Environment    | Files Created                                            |
| -------------- | -------------------------------------------------------- |
| Claude Code    | `.claude/commands/*.md`                                  |
| Cursor         | `.cursor/rules/workflow.mdc`, `.cursor/rules/*.mdc`      |
| GitHub Copilot | `.github/prompts/*.prompt.md`                            |

> Root context files (`CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`) are intentionally **not** generated — they are user-owned and tracked in git. If you'd like a starting point, copy the boilerplate from `templates/env/<env>/` in this repo.

### `phase`

Manage phase documentation directories.

```bash
agent-devkit phase list               # List initialized phases
agent-devkit phase add <phase>        # Add a phase (creates docs dir + template)
```

Available phases: `requirements`, `design`, `planning`, `testing`, `deployment`, `monitoring`

### `skill`

Install, list, and remove skills from git repositories. Skills extend the workflow commands available to your AI agents.

```bash
# Browse the built-in registry and select a skill to install
agent-devkit skill install

# Install a skill by name from the registry
agent-devkit skill install anthropics/skills

# Install from a git URL directly
agent-devkit skill install https://github.com/owner/repo.git

# Install into specific environments only
agent-devkit skill install anthropics/skills --env claude,cursor

# List installed skills
agent-devkit skill list

# List all skills available in the registry
agent-devkit skill registry

# Remove an installed skill
agent-devkit skill remove my-skill
```

Skills are cloned to `~/.agent-devkit/cache/` and symlinked into each environment's commands directory. Subsequent installs from the same repository pull the latest changes automatically.

The built-in registry (`registry.json`) ships with the package and maps skill names to their git URLs. Run `skill registry` to browse all available entries.

**Skill repository format:** a `skills/<skill-name>/` directory containing a `SKILL.md` file.

```
my-skills-repo/
└── skills/
    ├── code-review/
    │   └── SKILL.md
    └── security-audit/
        └── SKILL.md
```

### `lint`

Validate the workspace configuration.

```bash
agent-devkit lint
```

Checks that required documentation files and environment config files exist, and reports errors and warnings.

## Project Configuration

Running `init` creates a `.agent-devkit.json` file in the project root:

```json
{
  "version": "0.1.1",
  "environments": ["claude", "cursor", "github"],
  "phases": ["requirements", "design", "planning"],
  "docsDir": "docs/ai",
  "skills": [{ "name": "my-skill", "source": "https://github.com/owner/repo" }]
}
```

## Workflow Commands

After initialization, workflow commands are scaffolded into each environment's commands directory. These guide AI agents through structured development tasks:

| Command               | Purpose                                                                    |
| --------------------- | -------------------------------------------------------------------------- |
| `new-requirement`     | Capture a new feature requirement and scaffold all phase documents         |
| `review-requirements` | Review requirements for completeness, clarity, and testability             |
| `review-design`       | Review design documents against requirements                               |
| `execute-plan`        | Execute the implementation plan task by task                               |
| `writing-test`        | Generate a complete test suite from requirements                           |
| `code-review`         | Structured code review against requirements, design, and quality standards |

Commands are placed in the environment-specific directory and invoked via the agent's command mechanism:

| Environment    | Location            | How to invoke                 |
| -------------- | ------------------- | ----------------------------- |
| Claude Code    | `.claude/commands/` | `/new-requirement`            |
| Cursor         | `.cursor/rules/`    | `@new-requirement`            |
| GitHub Copilot | `.github/prompts/`  | Select prompt in Copilot Chat |

## Development

**Run without building** (fastest for development):

```bash
npm run dev -- init       # Run `init` command via ts-node
npm run dev -- phase list # Run any command the same way
```

**Other scripts:**

```bash
npm run build:watch       # Watch mode — recompile on save
npm run test              # Run test suite
npm run test:watch        # Watch mode for tests
npm run lint              # Run ESLint
```

## Project Structure

```
agent-devkit/
├── src/
│   ├── cli.ts                 # CLI entry point
│   ├── types.ts               # TypeScript type definitions
│   ├── commands/              # Command implementations (init, phase, lint, skill)
│   ├── lib/                   # ConfigManager, TemplateManager, SkillManager, RegistryManager
│   └── util/                  # env, git helpers
├── templates/
│   ├── phases/                # Phase documentation templates
│   └── env/
│       ├── claude/            # CLAUDE.md + commands/*.md
│       ├── cursor/            # AGENTS.md + rules/ + commands/*.mdc
│       └── github/            # copilot-instructions.md + commands/*.prompt.md
└── registry.json              # Built-in skill registry (name → git URL)
```

## Author

Nguyen Dang — annguyen34.work@gmail.com
