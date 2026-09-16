#!/usr/bin/env node
import { Command } from 'commander';
import { makeInitCommand } from './commands/init';
import { makePhaseCommand } from './commands/phase';
import { makeLintCommand } from './commands/lint';
import { makeSkillCommand } from './commands/skill';
import { version } from '../package.json';

const program = new Command();

program
  .name('agent-devkit')
  .description('CLI toolkit for structured AI-assisted development')
  .version(version, '-v, --version');

program.addCommand(makeInitCommand());
program.addCommand(makePhaseCommand());
program.addCommand(makeLintCommand());
program.addCommand(makeSkillCommand());

program.parse(process.argv);
