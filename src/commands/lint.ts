import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { ConfigManager } from '../lib/ConfigManager';
import { ENVIRONMENT_DEFINITIONS } from '../util/env';

interface LintIssue {
  level: 'error' | 'warn';
  message: string;
}

export function makeLintCommand(): Command {
  const cmd = new Command('lint');
  cmd.description('Validate the workspace agent-devkit configuration');

  cmd.action(() => {
    const cwd = process.cwd();
    const configManager = new ConfigManager(cwd);
    const issues: LintIssue[] = [];

    // Check config exists
    if (!configManager.exists()) {
      console.error(chalk.red('✗ No .agent-devkit.json found. Run `agent-devkit init` first.'));
      process.exit(1);
    }

    const config = configManager.read();

    // Check phases have README files
    for (const phase of config.phases) {
      const readmePath = path.join(cwd, config.docsDir, phase, 'README.md');
      if (!fs.existsSync(readmePath)) {
        issues.push({
          level: 'error',
          message: `Phase "${phase}" missing docs: ${config.docsDir}/${phase}/README.md`,
        });
      }
    }

    // Check agent config files exist
    for (const envCode of config.environments) {
      const envDef = ENVIRONMENT_DEFINITIONS.find((e) => e.code === envCode);
      if (!envDef) {
        issues.push({ level: 'warn', message: `Unknown environment "${envCode}" in config` });
        continue;
      }

      for (const rootFile of envDef.rootFiles) {
        const filePath = path.join(cwd, rootFile);
        if (!fs.existsSync(filePath)) {
          issues.push({
            level: 'warn',
            message: `${envDef.displayName} config file missing: ${rootFile}`,
          });
        }
      }
    }

    // Report
    if (issues.length === 0) {
      console.log(chalk.green('✓ Workspace looks good!'));
      console.log(chalk.gray(`  Environments: ${config.environments.join(', ')}`));
      console.log(chalk.gray(`  Phases: ${config.phases.join(', ')}`));
      console.log(chalk.gray(`  Docs dir: ${config.docsDir}`));
      return;
    }

    const errors = issues.filter((i) => i.level === 'error');
    const warnings = issues.filter((i) => i.level === 'warn');

    for (const issue of warnings) {
      console.log(chalk.yellow(`⚠  ${issue.message}`));
    }
    for (const issue of errors) {
      console.log(chalk.red(`✗  ${issue.message}`));
    }

    if (errors.length > 0) {
      console.log('');
      console.log(chalk.red(`Found ${errors.length} error(s) and ${warnings.length} warning(s).`));
      process.exit(1);
    } else {
      console.log('');
      console.log(chalk.yellow(`Found ${warnings.length} warning(s).`));
    }
  });

  return cmd;
}
