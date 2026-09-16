import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { ConfigManager } from '../lib/ConfigManager';
import { SkillManager } from '../lib/SkillManager';
import { RegistryManager } from '../lib/RegistryManager';
import { EnvironmentCode } from '../types';

function isGitUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('git@');
}

export function makeSkillCommand(): Command {
  const cmd = new Command('skill');
  cmd.description('Manage skills installed from git repositories');

  cmd
    .command('install [git-url-or-name]')
    .description('Install a skill by name (registry lookup) or git URL')
    .option('-e, --env <envs>', 'Comma-separated environments to install into (e.g. claude,cursor)')
    .action(async (arg: string | undefined, options) => {
      const cwd = process.cwd();
      const configManager = new ConfigManager(cwd);

      if (!configManager.exists()) {
        console.error(chalk.red('No .agent-devkit.json found. Run: agent-devkit init'));
        process.exit(1);
      }

      const environments = options.env
        ? (options.env.split(',').map((e: string) => e.trim()) as EnvironmentCode[])
        : undefined;

      const skillManager = new SkillManager(configManager);

      let gitUrl: string;

      if (!arg) {
        let skills;
        try {
          skills = await new RegistryManager().fetchSkills();
        } catch (err: any) {
          console.error(chalk.red(err.message));
          process.exit(1);
        }

        if (skills.length === 0) {
          console.log(chalk.yellow('No skills available in registry.'));
          process.exit(0);
        }

        const { selectedUrl } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedUrl',
            message: 'Select a skill to install:',
            choices: skills.map((s) => ({
              name: s.description ? `${s.name} — ${s.description}` : s.name,
              value: s.url,
            })),
          },
        ]);
        gitUrl = selectedUrl as string;
      } else if (isGitUrl(arg)) {
        gitUrl = arg;
      } else {
        let skills;
        try {
          skills = await new RegistryManager().fetchSkills();
        } catch (err: any) {
          console.error(chalk.red(err.message));
          process.exit(1);
        }

        const skill = skills.find((s) => s.name === arg);
        if (!skill) {
          console.error(chalk.red(`Skill "${arg}" not found in registry.`));
          if (skills.length > 0) {
            console.log(chalk.yellow('\nAvailable skills:'));
            for (const s of skills) {
              console.log(`  ${chalk.cyan(s.name)}${s.description ? `  — ${s.description}` : ''}`);
            }
          }
          process.exit(1);
        }

        gitUrl = skill.url;
      }

      const spinner = ora('Installing skill...').start();
      try {
        await skillManager.install(gitUrl, undefined, { environments });
        spinner.stop();
        console.log('');
        console.log(chalk.green('Skill installed successfully.'));
      } catch (err: any) {
        spinner.fail(chalk.red('Install failed'));
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  cmd
    .command('list')
    .description('List installed skills')
    .action(async () => {
      const cwd = process.cwd();
      const configManager = new ConfigManager(cwd);

      if (!configManager.exists()) {
        console.error(chalk.red('No .agent-devkit.json found. Run: agent-devkit init'));
        process.exit(1);
      }

      const skillManager = new SkillManager(configManager);

      try {
        const skills = await skillManager.list();
        if (skills.length === 0) {
          console.log(chalk.gray('No skills installed. Use: agent-devkit skill install [name or git-url]'));
          return;
        }

        console.log(chalk.bold('Installed skills:'));
        for (const skill of skills) {
          console.log(`  ${chalk.cyan(skill.name)}  ${chalk.gray(skill.source)}`);
        }
      } catch (err: any) {
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  cmd
    .command('registry')
    .description('List available skills from the registry')
    .action(async () => {
      const registry = new RegistryManager();
      const spinner = ora('Fetching registry...').start();
      let skills;
      try {
        skills = await registry.fetchSkills();
        spinner.stop();
      } catch (err: any) {
        spinner.fail(chalk.red('Failed to fetch registry'));
        console.error(chalk.red(err.message));
        process.exit(1);
      }

      if (skills.length === 0) {
        console.log(chalk.yellow('No skills available in registry.'));
        return;
      }

      console.log(chalk.bold(`Available skills (${skills.length}):`));
      for (const s of skills) {
        console.log(`  ${chalk.cyan(s.name)}${s.description ? `  — ${s.description}` : ''}`);
      }
    });

  cmd
    .command('remove <skill-name>')
    .description('Remove an installed skill')
    .action(async (skillName: string) => {
      const cwd = process.cwd();
      const configManager = new ConfigManager(cwd);

      if (!configManager.exists()) {
        console.error(chalk.red('No .agent-devkit.json found. Run: agent-devkit init'));
        process.exit(1);
      }

      const skillManager = new SkillManager(configManager);

      try {
        await skillManager.remove(skillName);
        console.log(chalk.green(`Skill "${skillName}" removed.`));
      } catch (err: any) {
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  return cmd;
}
