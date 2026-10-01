import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import inquirer from 'inquirer';
import { ConfigManager } from './ConfigManager';
import { getSkillPath } from '../util/env';
import {
  ensureGitInstalled,
  cloneRepository,
  isGitRepository,
  pullRepository,
  cacheDirForUrl,
} from '../util/git';
import { EnvironmentCode, InstalledSkill } from '../types';

const SKILL_CACHE_DIR = path.join(os.homedir(), '.agent-devkit', 'cache');

interface SkillChoice {
  name: string;
  description?: string;
}

interface InstallOptions {
  environments?: EnvironmentCode[];
}

export class SkillManager {
  constructor(private configManager: ConfigManager) {}

  async install(gitUrl: string, skillName?: string, options: InstallOptions = {}): Promise<void> {
    ensureGitInstalled();

    const repoPath = await this.prepareRepo(gitUrl);
    const skillNames = skillName ? [skillName] : await this.resolveSkillNames(repoPath);

    const environments = await this.resolveEnvironments(options.environments);
    if (environments.length === 0) {
      throw new Error('No skill-capable environments configured (claude, cursor, github, opencode).');
    }

    for (const name of skillNames) {
      await this.installSkill(repoPath, name, gitUrl, environments);
    }
  }

  /** Install a skill from the local skills/ directory (bundled with the CLI) */
  async installLocal(skillName: string, options: InstallOptions = {}): Promise<void> {
    // Find the package root (where skills/ lives)
    // In dev: src/lib/ -> package root = ../../
    // In built: dist/lib/ -> package root = ../../
    // When installed: node_modules/agent-devkit/dist/lib/ -> package root = ../../
    const packageRoot = path.resolve(__dirname, '../../');
    const skillsDir = path.join(packageRoot, 'skills');
    
    if (!await fs.pathExists(skillsDir)) {
      throw new Error(`Bundled skills directory not found at ${skillsDir}`);
    }
    
    // Verify the skill exists in skills/
    const skillPath = path.join(skillsDir, skillName, 'SKILL.md');
    if (!await fs.pathExists(skillPath)) {
      throw new Error(`Local skill "${skillName}" not found in skills/ directory.`);
    }

    // Read description
    let description: string | undefined;
    try {
      const content = await fs.readFile(skillPath, 'utf8');
      description = extractDescription(content);
    } catch {
      // ignore
    }

    const environments = await this.resolveEnvironments(options.environments);
    if (environments.length === 0) {
      throw new Error('No skill-capable environments configured (claude, cursor, github, opencode).');
    }

    // installSkill expects repoPath to be the parent of skills/, so pass packageRoot
    await this.installSkill(packageRoot, skillName, 'local://bundled', environments);
  }

  async list(): Promise<InstalledSkill[]> {
    const config = this.configManager.read();
    return config.skills ?? [];
  }

  async remove(skillName: string): Promise<void> {
    const config = this.configManager.read();
    if (!config.environments || config.environments.length === 0) {
      throw new Error('No .agent-devkit.json found. Run: agent-devkit init');
    }

    let removedCount = 0;
    for (const env of config.environments) {
      const skillDir = getSkillPath(env);
      if (!skillDir) continue;

      const targetPath = path.join(process.cwd(), skillDir, skillName);
      if (await fs.pathExists(targetPath)) {
        await fs.remove(targetPath);
        removedCount++;
      }
    }

    if (removedCount === 0) {
      throw new Error(`Skill "${skillName}" not found in any configured environment.`);
    }

    this.configManager.removeSkill(skillName);
  }

  private async prepareRepo(gitUrl: string): Promise<string> {
    const repoPath = cacheDirForUrl(SKILL_CACHE_DIR, gitUrl);

    if (await fs.pathExists(repoPath)) {
      if (isGitRepository(repoPath)) {
        try {
          pullRepository(repoPath);
        } catch {
          // Use cached version if pull fails
        }
      }
      return repoPath;
    }

    await fs.ensureDir(path.dirname(repoPath));
    cloneRepository(gitUrl, repoPath);
    return repoPath;
  }

  private async resolveSkillNames(repoPath: string): Promise<string[]> {
    const skills = await this.discoverSkills(repoPath);
    if (skills.length === 0) {
      throw new Error(
        'No skills found in repository. Expected a skills/ directory with subdirectories containing SKILL.md.'
      );
    }
    if (skills.length === 1) return [skills[0].name];

    const { selected } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        message: 'Select skill(s) to install:',
        choices: skills.map((s) => ({
          name: s.description ? `${s.name} — ${s.description}` : s.name,
          value: s.name,
        })),
        validate: (v: string[]) => v.length > 0 || 'Select at least one skill.',
      },
    ]);
    return selected as string[];
  }

  private async discoverSkills(repoPath: string): Promise<SkillChoice[]> {
    const skillsDir = path.join(repoPath, 'skills');
    if (!await fs.pathExists(skillsDir)) {
      return [];
    }

    const entries = await fs.readdir(skillsDir, { withFileTypes: true });
    const skills: SkillChoice[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const skillMdPath = path.join(skillsDir, entry.name, 'SKILL.md');
      if (!await fs.pathExists(skillMdPath)) continue;

      let description: string | undefined;
      try {
        const content = await fs.readFile(skillMdPath, 'utf8');
        description = extractDescription(content);
      } catch {
        // ignore
      }
      skills.push({ name: entry.name, description });
    }

    return skills.sort((a, b) => a.name.localeCompare(b.name));
  }

  private async resolveEnvironments(requested?: EnvironmentCode[]): Promise<EnvironmentCode[]> {
    const config = this.configManager.read();
    const configured: EnvironmentCode[] = config.environments ?? [];

    const envs = requested ? requested.filter((e) => configured.includes(e)) : configured;
    return envs.filter((e) => getSkillPath(e) !== undefined);
  }

  private async installSkill(
    repoPath: string,
    skillName: string,
    gitUrl: string,
    environments: EnvironmentCode[]
  ): Promise<void> {
    const skillSrcPath = path.join(repoPath, 'skills', skillName);
    if (!await fs.pathExists(skillSrcPath)) {
      throw new Error(`Skill "${skillName}" not found in repository.`);
    }
    if (!await fs.pathExists(path.join(skillSrcPath, 'SKILL.md'))) {
      throw new Error(`Invalid skill "${skillName}": missing SKILL.md.`);
    }

    for (const env of environments) {
      const skillDir = getSkillPath(env)!;
      const targetPath = path.join(process.cwd(), skillDir, skillName);

      if (await fs.pathExists(targetPath)) {
        console.log(`  → ${skillDir}/${skillName} (already exists, skipped)`);
        continue;
      }

      await fs.ensureDir(path.dirname(targetPath));
      try {
        await fs.symlink(skillSrcPath, targetPath, 'dir');
        console.log(`  → ${skillDir}/${skillName} (symlinked)`);
      } catch {
        await fs.copy(skillSrcPath, targetPath);
        console.log(`  → ${skillDir}/${skillName} (copied)`);
      }
    }

    this.configManager.addSkill({ name: skillName, source: gitUrl });
  }
}

function extractDescription(content: string): string | undefined {
  const line = content.split('\n').find((l) => l.trim() && !l.startsWith('#'));
  return line?.trim();
}
