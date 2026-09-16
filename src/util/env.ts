import { EnvironmentCode, EnvironmentDefinition } from '../types';

export const ENVIRONMENT_DEFINITIONS: EnvironmentDefinition[] = [
  {
    code: 'claude',
    displayName: 'Claude Code',
    rootFiles: ['CLAUDE.md'],
    commandsDir: '.claude/commands',
    commandExt: '.md',
    cmdRef: '/',
  },
  {
    code: 'cursor',
    displayName: 'Cursor',
    rootFiles: ['AGENTS.md'],
    commandsDir: '.cursor/rules',
    commandExt: '.mdc',
    cmdRef: '',
  },
  {
    code: 'github',
    displayName: 'GitHub Copilot',
    rootFiles: ['.github/copilot-instructions.md'],
    commandsDir: '.github/prompts',
    commandExt: '.prompt.md',
    cmdRef: '#',
  },
];

export function getEnvironmentDef(code: string): EnvironmentDefinition | undefined {
  return ENVIRONMENT_DEFINITIONS.find((e) => e.code === code);
}

/** Returns the commands directory for a given environment, or undefined if not skill-capable. */
export function getSkillPath(code: EnvironmentCode): string | undefined {
  const def = getEnvironmentDef(code);
  return def?.commandsDir ?? undefined;
}
