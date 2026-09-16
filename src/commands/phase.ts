import { Command } from "commander";
import chalk from "chalk";
import path from "path";
import fs from "fs-extra";
import { ConfigManager } from "../lib/ConfigManager";
import { TemplateManager } from "../lib/TemplateManager";
import { Phase } from "../types";

const ALL_PHASES: Phase[] = [
  "requirements",
  "design",
  "planning",
  "testing",
  "deployment",
  "monitoring",
];

export function makePhaseCommand(): Command {
  const cmd = new Command("phase");
  cmd.description("Manage phase documentation");

  cmd
    .command("add <phase>")
    .description("Add a phase documentation directory")
    .action((phase: string) => {
      if (!ALL_PHASES.includes(phase as Phase)) {
        console.error(
          chalk.red(
            `Unknown phase "${phase}". Valid phases: ${ALL_PHASES.join(", ")}`,
          ),
        );
        process.exit(1);
      }

      const cwd = process.cwd();
      const configManager = new ConfigManager(cwd);
      const templateManager = new TemplateManager();

      if (!configManager.exists()) {
        console.error(
          chalk.red(
            "No .agent-devkit.json found. Run `agent-devkit init` first.",
          ),
        );
        process.exit(1);
      }

      const config = configManager.read();
      const docsDir = config.docsDir;
      const vars = { docsDir };

      const destDir = path.join(cwd, docsDir, phase);
      const destFile = path.join(destDir, "README.md");

      if (fs.existsSync(destFile)) {
        console.log(
          chalk.yellow(
            `Phase "${phase}" already exists at ${docsDir}/${phase}/README.md`,
          ),
        );
        return;
      }

      fs.ensureDirSync(destDir);
      templateManager.copyFile(`phases/${phase}.md`, destFile, vars);
      configManager.addPhase(phase as Phase);

      console.log(
        chalk.green(
          `✓ Phase "${phase}" added at ${docsDir}/${phase}/README.md`,
        ),
      );
    });

  cmd
    .command("list")
    .description("List initialized phases")
    .action(() => {
      const configManager = new ConfigManager(process.cwd());
      if (!configManager.exists()) {
        console.error(
          chalk.red(
            "No .agent-devkit.json found. Run `agent-devkit init` first.",
          ),
        );
        process.exit(1);
      }
      const config = configManager.read();
      if (config.phases.length === 0) {
        console.log(chalk.gray("No phases initialized."));
        return;
      }
      console.log(chalk.bold("Initialized phases:"));
      for (const phase of config.phases) {
        const phasePath = path.join(
          process.cwd(),
          config.docsDir,
          phase,
          "README.md",
        );
        const exists = fs.existsSync(phasePath);
        const icon = exists ? chalk.green("✓") : chalk.red("✗");
        console.log(`  ${icon} ${phase}`);
      }
    });

  return cmd;
}
