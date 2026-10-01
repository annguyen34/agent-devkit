import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { Command } from 'commander';

// chalk@5, ora@8, inquirer@9 are ESM-only and will not load under
// ts-jest's CommonJS transform. Mock them at the module boundary.
jest.mock('chalk', () => {
  const identity = (s?: unknown) => String(s ?? '');
  const proxy: unknown = new Proxy(identity, {
    get: () => proxy,
    apply: (_t, _this, args) => (args[0] === undefined ? '' : String(args[0])),
  });
  return { __esModule: true, default: proxy };
});

jest.mock('ora', () => {
  const spinner: Record<string, unknown> = { text: '' };
  spinner.start = jest.fn(() => spinner);
  spinner.stop = jest.fn(() => spinner);
  spinner.succeed = jest.fn(() => spinner);
  spinner.fail = jest.fn(() => spinner);
  spinner.info = jest.fn(() => spinner);
  return { __esModule: true, default: jest.fn(() => spinner) };
});

jest.mock('inquirer', () => ({
  __esModule: true,
  default: { prompt: jest.fn() },
}));

import inquirer from 'inquirer';
import { makeInitCommand } from '../init';

const promptMock = inquirer.prompt as unknown as jest.Mock;

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterAll(() => {
  jest.restoreAllMocks();
});

function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-devkit-init-test-'));
  // updateGitExclude only writes when .git exists; create the dir so the
  // exclude file is produced and assertions about its contents are meaningful.
  fs.ensureDirSync(path.join(dir, '.git', 'info'));
  return dir;
}

async function runInit(cwd: string, args: string[]): Promise<void> {
  const prevCwd = process.cwd();
  process.chdir(cwd);
  try {
    const program = new Command();
    program.exitOverride();
    program.addCommand(makeInitCommand());
    await program.parseAsync(['node', 'agent-devkit', 'init', ...args]);
  } finally {
    process.chdir(prevCwd);
  }
}

function readExcludeLines(cwd: string): string[] {
  const p = path.join(cwd, '.git', 'info', 'exclude');
  if (!fs.existsSync(p)) return [];
  return fs
    .readFileSync(p, 'utf-8')
    .split('\n')
    .map((l) => l.trim());
}

describe('init: root context files are user-owned', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = makeTmpDir();
    promptMock.mockReset();
    // Mock the new skill installation prompt (default to false)
    promptMock.mockResolvedValueOnce({ installSkill: false });
  });

  afterEach(() => {
    fs.removeSync(tmp);
  });

  it('does not create CLAUDE.md when claude env is selected', async () => {
    await runInit(tmp, ['-e', 'claude', '-p', 'requirements', '-d', 'docs/ai']);
    expect(fs.existsSync(path.join(tmp, 'CLAUDE.md'))).toBe(false);
  });

  it('does not create AGENTS.md when cursor env is selected', async () => {
    await runInit(tmp, ['-e', 'cursor', '-p', 'requirements', '-d', 'docs/ai']);
    expect(fs.existsSync(path.join(tmp, 'AGENTS.md'))).toBe(false);
  });

  it('does not create .github/copilot-instructions.md when github env is selected', async () => {
    await runInit(tmp, ['-e', 'github', '-p', 'requirements', '-d', 'docs/ai']);
    expect(
      fs.existsSync(path.join(tmp, '.github', 'copilot-instructions.md')),
    ).toBe(false);
  });

  it('preserves a pre-existing CLAUDE.md byte-for-byte on first init', async () => {
    const userContent = '# My own CLAUDE.md\nDo not touch.\n';
    fs.writeFileSync(path.join(tmp, 'CLAUDE.md'), userContent, 'utf-8');
    await runInit(tmp, ['-e', 'claude', '-p', 'requirements', '-d', 'docs/ai']);
    expect(fs.readFileSync(path.join(tmp, 'CLAUDE.md'), 'utf-8')).toBe(
      userContent,
    );
  });

  it('preserves a pre-existing CLAUDE.md byte-for-byte on reinit', async () => {
    const userContent = '# Custom CLAUDE.md\n';
    fs.writeFileSync(path.join(tmp, 'CLAUDE.md'), userContent, 'utf-8');

    // First run creates .agent-devkit.json so the second run hits the reinit path.
    await runInit(tmp, ['-e', 'claude', '-p', 'requirements', '-d', 'docs/ai']);

    // Second run: confirm the reinit prompt, then decline skill installation.
    promptMock
      .mockResolvedValueOnce({ proceed: true })
      .mockResolvedValueOnce({ installSkill: false });
    await runInit(tmp, ['-e', 'claude', '-p', 'requirements', '-d', 'docs/ai']);

    expect(fs.readFileSync(path.join(tmp, 'CLAUDE.md'), 'utf-8')).toBe(
      userContent,
    );
  });

  it('still scaffolds slash commands, phase docs, and config', async () => {
    await runInit(tmp, [
      '-e',
      'claude',
      '-p',
      'requirements,design',
      '-d',
      'docs/ai',
    ]);

    expect(fs.existsSync(path.join(tmp, '.agent-devkit.json'))).toBe(true);
    expect(
      fs.existsSync(path.join(tmp, 'docs/ai/requirements/README.md')),
    ).toBe(true);
    expect(fs.existsSync(path.join(tmp, 'docs/ai/design/README.md'))).toBe(
      true,
    );

    const commandsDir = path.join(tmp, '.claude', 'commands');
    expect(fs.existsSync(commandsDir)).toBe(true);
    expect(fs.readdirSync(commandsDir).length).toBeGreaterThan(0);
  });

  it('does not add root-file entries to .git/info/exclude', async () => {
    await runInit(tmp, [
      '-e',
      'claude,cursor,github',
      '-p',
      'requirements',
      '-d',
      'docs/ai',
    ]);

    const lines = readExcludeLines(tmp);

    expect(lines).not.toContain('CLAUDE.md');
    expect(lines).not.toContain('AGENTS.md');
    expect(lines).not.toContain('.github/copilot-instructions.md');

    // Sanity: other expected entries are still present.
    expect(lines).toContain('.agent-devkit.json');
    expect(lines).toContain('docs/ai/');
    expect(lines).toContain('.claude/commands/');
  });

  it('cursor commands use .mdc extension and github commands use .prompt.md extension', async () => {
    await runInit(tmp, ['-e', 'cursor,github', '-p', 'requirements', '-d', 'docs/ai']);
    expect(
      fs.existsSync(path.join(tmp, '.cursor', 'rules', 'execute-plan.mdc')),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(tmp, '.github', 'prompts', 'execute-plan.prompt.md')),
    ).toBe(true);
  });

  it('removes stale root-file entries left in .git/info/exclude by prior init versions', async () => {
    // Simulate a project that ran an older agent-devkit: CLAUDE.md, AGENTS.md,
    // and .github/copilot-instructions.md were appended to exclude.
    const excludePath = path.join(tmp, '.git', 'info', 'exclude');
    const seedContent = [
      '# pre-existing user content',
      'some-user-pattern',
      '',
      '# agent-devkit generated files',
      '.agent-devkit.json',
      'docs/ai/',
      'CLAUDE.md',
      'AGENTS.md',
      '.github/copilot-instructions.md',
      '',
    ].join('\n');
    fs.writeFileSync(excludePath, seedContent, 'utf-8');

    await runInit(tmp, [
      '-e',
      'claude,cursor,github',
      '-p',
      'requirements',
      '-d',
      'docs/ai',
    ]);

    const lines = readExcludeLines(tmp);

    // Stale root-file entries removed.
    expect(lines).not.toContain('CLAUDE.md');
    expect(lines).not.toContain('AGENTS.md');
    expect(lines).not.toContain('.github/copilot-instructions.md');

    // User's own pre-existing pattern is preserved.
    expect(lines).toContain('some-user-pattern');
  });
});

describe('init: composed command content', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = makeTmpDir();
    promptMock.mockReset();
    // Mock the new skill installation prompt (default to false)
    promptMock.mockResolvedValueOnce({ installSkill: false });
  });

  afterEach(() => {
    fs.removeSync(tmp);
  });

  it('claude commands have / prefix and correct frontmatter', async () => {
    await runInit(tmp, ['-e', 'claude', '-p', 'requirements', '-d', 'docs/ai']);
    const content = fs.readFileSync(
      path.join(tmp, '.claude', 'commands', 'execute-plan.md'),
      'utf-8',
    );
    expect(content).toContain('description: Execute the implementation plan');
    expect(content).toContain('`/execute-plan`');
    expect(content).toContain('`/writing-test`');
    expect(content).not.toContain('globs:');
    expect(content).not.toContain('agent: agent');
  });

  it('cursor commands have bare name prefix and cursor-specific frontmatter', async () => {
    await runInit(tmp, ['-e', 'cursor', '-p', 'requirements', '-d', 'docs/ai']);
    const content = fs.readFileSync(
      path.join(tmp, '.cursor', 'rules', 'execute-plan.mdc'),
      'utf-8',
    );
    expect(content).toContain('globs: []');
    expect(content).toContain('alwaysApply: false');
    expect(content).toContain('`execute-plan`');
    expect(content).not.toContain('`/execute-plan`');
    expect(content).not.toContain('`#execute-plan`');
  });

  it('github commands have # prefix and github-specific frontmatter', async () => {
    await runInit(tmp, ['-e', 'github', '-p', 'requirements', '-d', 'docs/ai']);
    const content = fs.readFileSync(
      path.join(tmp, '.github', 'prompts', 'execute-plan.prompt.md'),
      'utf-8',
    );
    expect(content).toContain('agent: agent');
    expect(content).toContain('`#execute-plan`');
    expect(content).toContain('`#writing-test`');
    expect(content).not.toContain('globs:');
  });

  it('substitutes {{docsDir}} in composed commands', async () => {
    await runInit(tmp, ['-e', 'claude', '-p', 'requirements', '-d', 'custom/docs']);
    const content = fs.readFileSync(
      path.join(tmp, '.claude', 'commands', 'execute-plan.md'),
      'utf-8',
    );
    expect(content).toContain('custom/docs/planning/');
    expect(content).not.toContain('{{docsDir}}');
  });

  it('does not leave {{cmd}} placeholders in any generated command', async () => {
    await runInit(tmp, ['-e', 'claude,cursor,github', '-p', 'requirements', '-d', 'docs/ai']);
    const commandFiles = [
      path.join(tmp, '.claude', 'commands', 'code-review.md'),
      path.join(tmp, '.cursor', 'rules', 'code-review.mdc'),
      path.join(tmp, '.github', 'prompts', 'code-review.prompt.md'),
    ];
    for (const f of commandFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toContain('{{cmd}}');
    }
  });
});
