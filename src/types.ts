export type EnvironmentCode = "claude" | "cursor" | "github";

export type Phase =
  | "requirements"
  | "design"
  | "planning"
  | "testing"
  | "deployment"
  | "monitoring";

export interface InstalledSkill {
  name: string;
  source: string;
}

export interface RegistrySkill {
  name: string;
  url: string;
  description?: string;
}

export interface AgentDevkitConfig {
  version: string;
  environments: EnvironmentCode[];
  phases: Phase[];
  docsDir: string;
  skills?: InstalledSkill[];
}

export interface EnvironmentDefinition {
  code: EnvironmentCode;
  displayName: string;
  /** Files/dirs to copy from templates/env/<code>/ into project root */
  rootFiles: string[];
  /** Destination dir for workflow commands (relative to project root) */
  commandsDir: string | null;
  /** File extension for generated command files (e.g. '.md', '.mdc', '.prompt.md') */
  commandExt: string;
  /** Prefix for command references inside prompts (e.g. '/', '', '#') */
  cmdRef: string;
}
