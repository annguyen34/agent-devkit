import fs from 'fs-extra';
import path from 'path';
import { RegistrySkill } from '../types';

const REGISTRY_PATH = path.join(__dirname, '../../registry.json');

interface RegistryFile {
  skills: RegistrySkill[];
}

export class RegistryManager {
  async fetchSkills(): Promise<RegistrySkill[]> {
    if (!await fs.pathExists(REGISTRY_PATH)) {
      throw new Error(`Registry file not found: ${REGISTRY_PATH}`);
    }
    const data = await fs.readJson(REGISTRY_PATH) as RegistryFile;
    return data.skills ?? [];
  }

  async findSkill(name: string): Promise<RegistrySkill | undefined> {
    const skills = await this.fetchSkills();
    return skills.find((s) => s.name === name);
  }
}
