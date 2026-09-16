import fs from 'fs-extra';
import path from 'path';
import { AgentDevkitConfig, EnvironmentCode, InstalledSkill, Phase } from '../types';

const CONFIG_FILE = '.agent-devkit.json';
const CURRENT_VERSION = '0.1.0';

const DEFAULT_CONFIG: AgentDevkitConfig = {
  version: CURRENT_VERSION,
  environments: [],
  phases: [],
  docsDir: 'docs/ai',
};

export class ConfigManager {
  private configPath: string;

  constructor(cwd: string = process.cwd()) {
    this.configPath = path.join(cwd, CONFIG_FILE);
  }

  exists(): boolean {
    return fs.existsSync(this.configPath);
  }

  read(): AgentDevkitConfig {
    if (!this.exists()) {
      return { ...DEFAULT_CONFIG };
    }
    const raw = fs.readJSONSync(this.configPath) as Partial<AgentDevkitConfig>;
    return { ...DEFAULT_CONFIG, ...raw };
  }

  write(config: AgentDevkitConfig): void {
    fs.writeJSONSync(this.configPath, config, { spaces: 2 });
  }

  addEnvironment(env: EnvironmentCode): void {
    const config = this.read();
    if (!config.environments.includes(env)) {
      config.environments.push(env);
      this.write(config);
    }
  }

  addPhase(phase: Phase): void {
    const config = this.read();
    if (!config.phases.includes(phase)) {
      config.phases.push(phase);
      this.write(config);
    }
  }

  addSkill(skill: InstalledSkill): void {
    const config = this.read();
    if (!config.skills) config.skills = [];
    const exists = config.skills.some((s) => s.name === skill.name && s.source === skill.source);
    if (!exists) {
      config.skills.push(skill);
      this.write(config);
    }
  }

  removeSkill(skillName: string): void {
    const config = this.read();
    if (!config.skills) return;
    config.skills = config.skills.filter((s) => s.name !== skillName);
    this.write(config);
  }
}
