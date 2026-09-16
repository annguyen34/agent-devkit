import fs from 'fs-extra';
import path from 'path';

export class TemplateManager {
  private templatesDir: string;

  constructor() {
    // In production: templates sit next to dist/ at package root
    // In dev (ts-node): templates sit at project root
    const packageRoot = path.resolve(__dirname, '..', '..');
    this.templatesDir = path.join(packageRoot, 'templates');
  }

  /** Copy a single template file to destination, substituting {{docsDir}} */
  copyFile(templateRelPath: string, destAbsPath: string, vars: Record<string, string> = {}): void {
    const src = path.join(this.templatesDir, templateRelPath);
    if (!fs.existsSync(src)) {
      throw new Error(`Template not found: ${templateRelPath}`);
    }
    fs.ensureDirSync(path.dirname(destAbsPath));
    let content = fs.readFileSync(src, 'utf-8');
    for (const [key, value] of Object.entries(vars)) {
      content = content.replaceAll(`{{${key}}}`, value);
    }
    fs.writeFileSync(destAbsPath, content, 'utf-8');
  }

  /** Copy all files from a template directory to a destination directory */
  copyDir(templateRelDir: string, destAbsDir: string, vars: Record<string, string> = {}): void {
    const src = path.join(this.templatesDir, templateRelDir);
    if (!fs.existsSync(src)) return;
    fs.ensureDirSync(destAbsDir);
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(destAbsDir, entry.name);
      if (entry.isDirectory()) {
        this.copyDir(path.join(templateRelDir, entry.name), destPath, vars);
      } else {
        let content = fs.readFileSync(srcPath, 'utf-8');
        for (const [key, value] of Object.entries(vars)) {
          content = content.replaceAll(`{{${key}}}`, value);
        }
        fs.writeFileSync(destPath, content, 'utf-8');
      }
    }
  }

  /**
   * Compose an env-specific command file from a shared body template and an
   * env-specific header fragment, then write it to destAbsPath.
   *
   * The shared body at templates/env/commands/{commandName}.md must begin with
   * YAML frontmatter containing a `description:` field. That description is
   * extracted and injected into templates/env/{envCode}/meta.md (which contains
   * a `{{description}}` placeholder). The header and body are concatenated, then
   * all vars (including `cmd` for the command-reference prefix and `docsDir`)
   * are substituted before writing.
   */
  composeCommand(
    envCode: string,
    commandName: string,
    destAbsPath: string,
    vars: Record<string, string> = {},
  ): void {
    const sharedPath = path.join(this.templatesDir, 'env', 'commands', `${commandName}.md`);
    if (!fs.existsSync(sharedPath)) {
      throw new Error(`Shared command template not found: ${commandName}`);
    }
    const sharedContent = fs.readFileSync(sharedPath, 'utf-8');

    const fmMatch = sharedContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!fmMatch) {
      throw new Error(`Missing frontmatter in shared command template: ${commandName}`);
    }
    const descMatch = fmMatch[1].match(/^description:\s*(.+)$/m);
    if (!descMatch) {
      throw new Error(`Missing description field in shared command template: ${commandName}`);
    }
    const description = descMatch[1].trim();
    const body = fmMatch[2];

    const metaPath = path.join(this.templatesDir, 'env', envCode, 'meta.md');
    if (!fs.existsSync(metaPath)) {
      throw new Error(`Env meta template not found for environment: ${envCode}`);
    }
    const metaContent = fs.readFileSync(metaPath, 'utf-8').replaceAll('{{description}}', description);

    let content = metaContent + body;
    for (const [key, value] of Object.entries(vars)) {
      content = content.replaceAll(`{{${key}}}`, value);
    }

    fs.ensureDirSync(path.dirname(destAbsPath));
    fs.writeFileSync(destAbsPath, content, 'utf-8');
  }

  templateExists(relPath: string): boolean {
    return fs.existsSync(path.join(this.templatesDir, relPath));
  }

  getTemplatesDir(): string {
    return this.templatesDir;
  }
}
