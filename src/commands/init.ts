import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import path from "path";
import fs from "fs-extra";
import { ConfigManager } from "../lib/ConfigManager";
import { TemplateManager } from "../lib/TemplateManager";
import { ENVIRONMENT_DEFINITIONS } from "../util/env";
import { EnvironmentCode, Phase } from "../types";

function updateGitExclude(cwd: string, entries: string[]): void {
  const excludePath = path.join(cwd, ".git", "info", "exclude");
  if (!fs.existsSync(path.join(cwd, ".git"))) return;
  fs.ensureDirSync(path.dirname(excludePath));
  const existing = fs.existsSync(excludePath)
    ? fs.readFileSync(excludePath, "utf8")
    : "";
  const lines = existing.split("\n");
  const toAdd = entries.filter((e) => !lines.some((l) => l.trim() === e));
  if (toAdd.length === 0) return;
  const section = ["", "# agent-devkit generated files", ...toAdd].join("\n");
  fs.writeFileSync(
    excludePath,
    existing.endsWith("\n") || existing === ""
      ? existing + section + "\n"
      : existing + section + "\n",
  );
}

// Removes specific entries from .git/info/exclude — used to clean up stale
// lines written by prior init versions (e.g. CLAUDE.md was excluded back when
// init scaffolded it; now that root context files are user-owned, leaving the
// exclude entry would hide the user's file from `git status`).
function removeFromGitExclude(cwd: string, entries: string[]): void {
  const excludePath = path.join(cwd, ".git", "info", "exclude");
  if (!fs.existsSync(excludePath)) return;
  const removeSet = new Set(entries);
  const existing = fs.readFileSync(excludePath, "utf8");
  const lines = existing.split("\n");
  const filtered = lines.filter((l) => !removeSet.has(l.trim()));
  if (filtered.length === lines.length) return;
  fs.writeFileSync(excludePath, filtered.join("\n"));
}

const ALL_PHASES: Phase[] = [
  "requirements",
  "design",
  "planning",
  "testing",
  "deployment",
  "monitoring",
];

export function makeInitCommand(): Command {
  const cmd = new Command("init");
  cmd.description("Initialize agent-devkit in the current project");

  cmd
    .option(
      "-e, --environments <envs>",
      "Comma-separated list of environments (claude,cursor,github,opencode)",
    )
    .option("-p, --phases <phases>", "Comma-separated list of phases")
    .option("-a, --all", "Initialize all available phases")
    .option("-d, --docs-dir <dir>", "Documentation directory", "docs/ai")
    .action(async (options) => {
      const cwd = process.cwd();
      const configManager = new ConfigManager(cwd);
      const templateManager = new TemplateManager();

      let isReinit = false;
      if (configManager.exists()) {
        const { proceed } = await inquirer.prompt([
          {
            type: "confirm",
            name: "proceed",
            message: chalk.yellow(
              ".agent-devkit.json already exists. Re-initialize?",
            ),
            default: false,
          },
        ]);
        if (!proceed) {
          console.log(chalk.gray("Aborted."));
          return;
        }
        isReinit = true;
      }

      // Resolve environments
      let selectedEnvs: EnvironmentCode[];
      if (options.environments) {
        selectedEnvs = options.environments
          .split(",")
          .map((e: string) => e.trim()) as EnvironmentCode[];
      } else {
        const { envs } = await inquirer.prompt([
          {
            type: "checkbox",
            name: "envs",
            message: "Select AI agents to configure:",
            choices: ENVIRONMENT_DEFINITIONS.map((e) => ({
              name: e.displayName,
              value: e.code,
              checked: true,
            })),
            validate: (selected: EnvironmentCode[]) =>
              selected.length > 0 ? true : "Select at least one agent.",
          },
        ]);
        selectedEnvs = envs as EnvironmentCode[];
      }

      // Resolve phases
      let selectedPhases: Phase[];
      if (options.all) {
        selectedPhases = [...ALL_PHASES];
      } else if (options.phases) {
        selectedPhases = options.phases
          .split(",")
          .map((p: string) => p.trim()) as Phase[];
      } else {
        const { phases } = await inquirer.prompt([
          {
            type: "checkbox",
            name: "phases",
            message: "Select development phases to scaffold:",
            choices: ALL_PHASES.map((p) => ({
              name: p,
              value: p,
              checked: [
                "requirements",
                "design",
                "planning",
                "testing",
              ].includes(p),
            })),
          },
        ]);
        selectedPhases = phases as Phase[];
      }

      // Resolve docs dir
      const { docsDir } = options.docsDir
        ? { docsDir: options.docsDir }
        : await inquirer.prompt([
            {
              type: "input",
              name: "docsDir",
              message: "Documentation directory:",
              default: "docs/ai",
            },
          ]);

      const spinner = ora("Setting up agent-devkit...").start();
      const vars = { docsDir };

      try {
        // Scaffold phase docs
        for (const phase of selectedPhases) {
          const destDir = path.join(cwd, docsDir, phase);
          fs.ensureDirSync(destDir);
          const destFile = path.join(destDir, "README.md");
          if (isReinit || !fs.existsSync(destFile)) {
            templateManager.copyFile(`phases/${phase}.md`, destFile, vars);
          }
        }

        // Setup each agent environment
        for (const envCode of selectedEnvs) {
          const envDef = ENVIRONMENT_DEFINITIONS.find(
            (e) => e.code === envCode,
          );
          if (!envDef) continue;

          // Root context files (CLAUDE.md, AGENTS.md, copilot-instructions.md)
          // are intentionally NOT scaffolded — they are user-owned. Templates
          // remain at templates/env/<env>/ for manual reference.

          // Copy rules (cursor only)
          const rulesTemplatePath = `env/${envCode}/rules`;
          if (templateManager.templateExists(rulesTemplatePath)) {
            const rulesDir =
              envCode === "cursor" ? path.join(cwd, ".cursor", "rules") : null;
            if (rulesDir) {
              templateManager.copyDir(rulesTemplatePath, rulesDir, vars);
            }
          }

          // Compose and install workflow commands from shared bodies + env header
          if (envDef.commandsDir) {
            const commandsDestDir = path.join(cwd, envDef.commandsDir);
            const sharedCommandsDir = path.join(
              templateManager.getTemplatesDir(),
              "env",
              "commands",
            );
            if (fs.existsSync(sharedCommandsDir)) {
              fs.ensureDirSync(commandsDestDir);
              const commandNames = fs
                .readdirSync(sharedCommandsDir)
                .filter((f) => f.endsWith(".md"))
                .map((f) => path.basename(f, ".md"));
              for (const name of commandNames) {
                const destFile = path.join(
                  commandsDestDir,
                  `${name}${envDef.commandExt}`,
                );
                if (isReinit || !fs.existsSync(destFile)) {
                  templateManager.composeCommand(envCode, name, destFile, {
                    ...vars,
                    cmd: envDef.cmdRef,
                  });
                }
              }
            }
          }
        }

        // Write config
        configManager.write({
          version: "0.1.0",
          environments: selectedEnvs,
          phases: selectedPhases,
          docsDir,
        });

        // Clean up stale root-file entries written by prior init versions.
        // Root context files are user-owned now and must be tracked by git.
        const staleRootEntries = ENVIRONMENT_DEFINITIONS.flatMap(
          (e) => e.rootFiles,
        );
        removeFromGitExclude(cwd, staleRootEntries);

        // Update .gitignore to prevent generated files from appearing as git changes
        const gitignoreEntries = [".agent-devkit.json", `${docsDir}/`];
        for (const envCode of selectedEnvs) {
          const envDef = ENVIRONMENT_DEFINITIONS.find(
            (e) => e.code === envCode,
          );
          if (!envDef) continue;
          if (envDef.commandsDir)
            gitignoreEntries.push(`${envDef.commandsDir}/`);
          if (envCode === "cursor") gitignoreEntries.push(".cursor/rules/");
        }
        updateGitExclude(cwd, gitignoreEntries);

        spinner.succeed(chalk.green("agent-devkit initialized successfully!"));
        console.log("");
        console.log(chalk.bold("What was set up:"));
        console.log(
          `  ${chalk.cyan("Docs:")} ${docsDir}/ (${selectedPhases.join(", ")})`,
        );
        console.log(`  ${chalk.cyan("Agents:")} ${selectedEnvs.join(", ")}`);
        console.log(`  ${chalk.cyan("Config:")} .agent-devkit.json`);
        console.log("");
        console.log(
          chalk.gray("Run `agent-devkit --help` to see available commands."),
        );
      } catch (err) {
        spinner.fail(chalk.red("Initialization failed"));
        console.error(err);
        process.exit(1);
      }
    });

  return cmd;
}
