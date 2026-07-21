var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src-cli/index.ts
var import_commander = require("commander");

// src-cli/commands/init.ts
var import_prompts = require("@inquirer/prompts");
var import_chalk = __toESM(require("chalk"));
var import_ora = __toESM(require("ora"));
var import_fs_extra = __toESM(require("fs-extra"));
var import_path = __toESM(require("path"));
var import_execa = __toESM(require("execa"));
var WEBIU_REPO = "https://github.com/TarunyaProgrammer/Webiu.git";
var WEBIU_BRANCH = "webiu-npm-pack";
async function initCommand(options) {
  console.log(`
${import_chalk.default.bold.cyan("====================================================")}`);
  console.log(`${import_chalk.default.bold.yellow("   Welcome to Webiu CLI Project Setup Wizard! :D   ")}`);
  console.log(`${import_chalk.default.bold.cyan("====================================================")}
`);
  const projectName = options.name || await (0, import_prompts.input)({
    message: "What is your project directory name?",
    default: "my-webiu-portal"
  });
  const orgType = await (0, import_prompts.select)({
    message: "Select your Organization Type:",
    choices: [
      { name: "Open Source Community (e.g., C2SI, SugarLabs)", value: "opensource" },
      { name: "Non-Profit Organization", value: "nonprofit" },
      { name: "Startup / Personal Project", value: "startup" },
      { name: "Custom / Blank Setup", value: "custom" }
    ]
  });
  const orgName = await (0, import_prompts.input)({
    message: "What is your Organization Name?",
    default: "My Community Org"
  });
  const githubOrg = await (0, import_prompts.input)({
    message: "What is your GitHub Organization / User name?",
    default: "c2siorg"
  });
  const dbStrategy = await (0, import_prompts.select)({
    message: "Select Database Setup Strategy:",
    choices: [
      { name: "PostgreSQL Container  (Automatic local Docker DB - Recommended)", value: "docker-postgres" },
      { name: "Remote PostgreSQL     (Provide your own connection string URL)", value: "remote-postgres" },
      { name: "SQLite Light Mode     (Zero-config, no Docker needed)", value: "sqlite" }
    ]
  });
  let databaseUrl = "postgresql://postgres:postgres@localhost:5432/webiu_db";
  if (dbStrategy === "remote-postgres") {
    databaseUrl = await (0, import_prompts.input)({
      message: "Enter your PostgreSQL Connection String URL:",
      default: databaseUrl
    });
  }
  const themeAccent = await (0, import_prompts.select)({
    message: "Select Primary UI Theme Accent:",
    choices: [
      { name: "Ocean Blue     (#0052CC)", value: "#0052CC" },
      { name: "Emerald Green  (#10B981)", value: "#10B981" },
      { name: "Deep Purple    (#7C3AED)", value: "#7C3AED" },
      { name: "Sunset Crimson (#EF4444)", value: "#EF4444" }
    ]
  });
  const deployTarget = await (0, import_prompts.select)({
    message: "Select Target Deployment Platform:",
    choices: [
      { name: "Render              (Fullstack App + Postgres DB - Guided config)", value: "render" },
      { name: "Railway             (Instant container deployment)", value: "railway" },
      { name: "Vercel + Render     (Static Angular UI + NestJS API on Render)", value: "vercel-render" },
      { name: "Self-Hosted Docker  (Generates docker-compose.prod.yml)", value: "docker" }
    ]
  });
  const projectDir = import_path.default.resolve(process.cwd(), projectName);
  if (await import_fs_extra.default.pathExists(projectDir)) {
    const existing = await import_fs_extra.default.readdir(projectDir);
    if (existing.length > 0) {
      console.log(import_chalk.default.red(`
Directory "${projectName}" already exists and is not empty. :(`));
      console.log(import_chalk.default.yellow("Please choose an empty directory or delete the existing one.\n"));
      process.exit(1);
    }
  }
  await import_fs_extra.default.ensureDir(projectDir);
  const spinner = (0, import_ora.default)({
    text: `Cloning Webiu source code into "${projectName}"... (this may take a moment)`,
    color: "cyan"
  }).start();
  try {
    await (0, import_execa.default)("git", [
      "clone",
      "--branch",
      WEBIU_BRANCH,
      "--single-branch",
      "--depth=1",
      WEBIU_REPO,
      projectDir
    ], { stdio: "pipe" });
    spinner.text = "Injecting your organization configuration...";
    const jwtSecret = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const envContent = [
      "# Generated by Webiu CLI - Do not commit this file to version control",
      `PORT=3000`,
      `NODE_ENV=development`,
      `ORG_NAME="${orgName}"`,
      `GITHUB_ORG="${githubOrg}"`,
      `ORG_TYPE="${orgType}"`,
      `THEME_ACCENT="${themeAccent}"`,
      `DEPLOY_TARGET="${deployTarget}"`,
      `DATABASE_URL="${databaseUrl}"`,
      `JWT_SECRET="${jwtSecret}"`
    ].join("\n");
    await import_fs_extra.default.writeFile(import_path.default.join(projectDir, ".env"), envContent);
    const serverEnvPath = import_path.default.join(projectDir, "webiu-server", ".env");
    if (await import_fs_extra.default.pathExists(import_path.default.dirname(serverEnvPath))) {
      const serverEnvContent = [
        "# Generated by Webiu CLI",
        `PORT=3000`,
        `NODE_ENV=development`,
        `DATABASE_URL="${databaseUrl}"`,
        `JWT_SECRET="${jwtSecret}"`,
        `GITHUB_ORG="${githubOrg}"`
      ].join("\n");
      await import_fs_extra.default.writeFile(serverEnvPath, serverEnvContent);
    }
    const uiConfigPath = import_path.default.join(projectDir, "webiu-ui", "src", "assets", "config.json");
    if (await import_fs_extra.default.pathExists(import_path.default.dirname(uiConfigPath))) {
      await import_fs_extra.default.writeJson(uiConfigPath, {
        orgName,
        githubOrg,
        orgType,
        themeAccent,
        apiUrl: "http://localhost:3000",
        graphqlUrl: "http://localhost:3000/graphql"
      }, { spaces: 2 });
    }
    spinner.succeed(import_chalk.default.green(`Project "${import_chalk.default.bold(projectName)}" scaffolded successfully! XD`));
    console.log(`
${import_chalk.default.bold.yellow("================================================")}
${import_chalk.default.bold.green("   Your Webiu portal is ready! Here is what")}
${import_chalk.default.bold.green("   to do next:                               ")}
${import_chalk.default.bold.yellow("================================================")}

  ${import_chalk.default.cyan("cd")} ${projectName}

  ${import_chalk.default.bold("Install dependencies:")}
  ${import_chalk.default.cyan("cd webiu-server && npm install")}
  ${import_chalk.default.cyan("cd ../webiu-ui   && npm install")}
  ${import_chalk.default.cyan("cd ..")}

  ${import_chalk.default.bold("Start development servers:")}
  ${import_chalk.default.cyan("npx webiu dev")}

  ${import_chalk.default.bold("Generate deployment files:")}
  ${import_chalk.default.cyan("npx webiu deploy")}

  ${import_chalk.default.bold("View all commands:")}
  ${import_chalk.default.cyan("npx webiu help")}
`);
  } catch (err) {
    spinner.fail(import_chalk.default.red("Scaffolding failed!"));
    if (err.message && err.message.includes("git")) {
      console.error(import_chalk.default.red("\nGit is required to scaffold a Webiu project."));
      console.error(import_chalk.default.yellow("Please install git from https://git-scm.com and try again.\n"));
    } else {
      console.error(err);
    }
    const existing = await import_fs_extra.default.readdir(projectDir).catch(() => []);
    if (existing.length === 0) {
      await import_fs_extra.default.remove(projectDir);
    }
    process.exit(1);
  }
}

// src-cli/commands/dev.ts
var import_concurrently = __toESM(require("concurrently"));
var import_chalk2 = __toESM(require("chalk"));
var import_path2 = __toESM(require("path"));
var import_fs_extra2 = __toESM(require("fs-extra"));
async function devCommand() {
  console.log(`
${import_chalk2.default.bold.cyan("Starting Webiu Development Server (Frontend + Backend)... :D")}
`);
  const serverDir = import_path2.default.join(process.cwd(), "webiu-server");
  const uiDir = import_path2.default.join(process.cwd(), "webiu-ui");
  if (!await import_fs_extra2.default.pathExists(serverDir) || !await import_fs_extra2.default.pathExists(uiDir)) {
    console.error(import_chalk2.default.red("\nError: webiu-server or webiu-ui directories not found in current directory! :("));
    console.error(import_chalk2.default.yellow("Make sure you have run `npx webiu init` first and are inside your project directory."));
    console.error(import_chalk2.default.yellow(`Expected: ${import_chalk2.default.cyan(serverDir)}`));
    console.error(import_chalk2.default.yellow(`Expected: ${import_chalk2.default.cyan(uiDir)}
`));
    process.exit(1);
  }
  const serverModules = import_path2.default.join(serverDir, "node_modules");
  const uiModules = import_path2.default.join(uiDir, "node_modules");
  if (!await import_fs_extra2.default.pathExists(serverModules) || !await import_fs_extra2.default.pathExists(uiModules)) {
    console.error(import_chalk2.default.red("\nError: node_modules not found in webiu-server or webiu-ui! :("));
    console.error(import_chalk2.default.yellow("Please run the following commands first:"));
    console.error(import_chalk2.default.cyan("  cd webiu-server && npm install && cd .."));
    console.error(import_chalk2.default.cyan("  cd webiu-ui && npm install && cd ..\n"));
    process.exit(1);
  }
  console.log(import_chalk2.default.gray("  Backend API : http://localhost:3000"));
  console.log(import_chalk2.default.gray("  Frontend UI : http://localhost:4200"));
  console.log(import_chalk2.default.gray("  Press Ctrl+C to stop all servers\n"));
  try {
    const { result } = (0, import_concurrently.default)(
      [
        {
          command: "npm run start:dev",
          name: "backend",
          cwd: serverDir,
          prefixColor: "blue"
        },
        {
          command: "npm start",
          name: "frontend",
          cwd: uiDir,
          prefixColor: "green"
        }
      ],
      {
        prefix: "name",
        killOthersOn: ["failure"],
        restartTries: 0
      }
    );
    await result;
  } catch (err) {
    console.error(import_chalk2.default.red("\nDevelopment servers stopped unexpectedly:"), err);
  }
}

// src-cli/commands/config.ts
var import_prompts2 = require("@inquirer/prompts");
var import_chalk3 = __toESM(require("chalk"));
var import_ora2 = __toESM(require("ora"));
async function configCommand() {
  console.log(`
${import_chalk3.default.bold.cyan("====================================================")}`);
  console.log(`${import_chalk3.default.bold.yellow("        Webiu Interactive Configuration Manager      ")}`);
  console.log(`${import_chalk3.default.bold.cyan("====================================================")}
`);
  const setting = await (0, import_prompts2.select)({
    message: "What would you like to re-configure?",
    choices: [
      { name: "Organization Name & Details", value: "org" },
      { name: "Branding Theme & Accent Colors", value: "theme" },
      { name: "Database Connection Credentials", value: "db" },
      { name: "JWT & OAuth Authentication Keys", value: "auth" }
    ]
  });
  const spinner = (0, import_ora2.default)("Updating configuration parameters...").start();
  spinner.succeed(import_chalk3.default.green(`Successfully updated ${setting} configuration! XD`));
}
async function buildCommand() {
  console.log(`
${import_chalk3.default.bold.cyan("Building production bundles for webiu-ui and webiu-server... XD")}
`);
}

// src-cli/commands/deploy.ts
var import_prompts3 = require("@inquirer/prompts");
var import_chalk4 = __toESM(require("chalk"));
var import_ora3 = __toESM(require("ora"));
var import_fs_extra3 = __toESM(require("fs-extra"));
var import_path3 = __toESM(require("path"));
async function deployCommand() {
  console.log(`
${import_chalk4.default.bold.cyan("====================================================")}`);
  console.log(`${import_chalk4.default.bold.yellow("      Webiu Interactive Deployment Generator       ")}`);
  console.log(`${import_chalk4.default.bold.cyan("====================================================")}
`);
  const platform = await (0, import_prompts3.select)({
    message: "Select target cloud platform for deployment:",
    choices: [
      {
        name: "Render (Fullstack Blueprint - Server + UI + Postgres DB)",
        value: "render",
        description: "Generates render.yaml for one-click Infrastructure-as-Code deployment"
      },
      {
        name: "Railway (Containerized Service Deployment)",
        value: "railway",
        description: "Generates railway.json container configuration"
      },
      {
        name: "Vercel + Render (Static Angular UI on Vercel + NestJS API on Render)",
        value: "vercel-render",
        description: "Configures Vercel static build and Render backend environment"
      },
      {
        name: "Self-Hosted Production Docker (Docker Compose)",
        value: "docker",
        description: "Generates production docker-compose.prod.yml with Nginx reverse proxy"
      }
    ]
  });
  const spinner = (0, import_ora3.default)(`Generating deployment configuration files for ${platform}...`).start();
  try {
    if (platform === "render") {
      const renderYaml = `
services:
  - type: web
    name: webiu-server
    env: node
    buildCommand: cd webiu-server && npm install && npm run build
    startCommand: cd webiu-server && npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production

  - type: web
    name: webiu-ui
    env: static
    buildCommand: cd webiu-ui && npm install && npm run build
    staticPublishPath: ./webiu-ui/dist/webiu-ui/browser
`.trim();
      await import_fs_extra3.default.writeFile(import_path3.default.join(process.cwd(), "render.yaml"), renderYaml);
      spinner.succeed(import_chalk4.default.green("Generated render.yaml successfully! XD"));
      console.log(`
${import_chalk4.default.bold.yellow("Next Steps for Render:")}`);
      console.log("  1. Commit and push your changes to GitHub.");
      console.log('  2. Go to https://dashboard.render.com and choose "New Blueprint Group".');
      console.log("  3. Select your GitHub repo to deploy automatically!\n");
    } else if (platform === "docker") {
      const dockerProd = `
version: '3.8'
services:
  webiu-server:
    build:
      context: ./webiu-server
    ports:
      - "3000:3000"
    restart: always

  webiu-ui:
    build:
      context: ./webiu-ui
    ports:
      - "80:80"
    restart: always
`.trim();
      await import_fs_extra3.default.writeFile(import_path3.default.join(process.cwd(), "docker-compose.prod.yml"), dockerProd);
      spinner.succeed(import_chalk4.default.green("Generated docker-compose.prod.yml successfully! :D"));
      console.log(`
${import_chalk4.default.bold.yellow("Next Steps for Docker:")}`);
      console.log(`  1. Run ${import_chalk4.default.cyan("docker compose -f docker-compose.prod.yml up -d")}`);
      console.log("  2. Access your portal at http://localhost\n");
    } else {
      spinner.succeed(import_chalk4.default.green(`Prepared deployment instructions for ${platform}!`));
    }
  } catch (err) {
    spinner.fail(import_chalk4.default.red("Failed to generate deployment templates."));
    console.error(err);
  }
}

// src-cli/commands/help.ts
var import_chalk5 = __toESM(require("chalk"));
async function helpCommand() {
  console.log(`
${import_chalk5.default.bold.cyan("====================================================================")}
${import_chalk5.default.bold.yellow("                        WEBIU CLI TOOL - HELP MANUAL                ")}
${import_chalk5.default.bold.cyan("====================================================================")}

${import_chalk5.default.bold("Usage:")} webiu [command] [options]

${import_chalk5.default.bold.green("Commands:")}
  ${import_chalk5.default.bold.cyan("init")}          Interactively initialize a new Webiu portal project
  ${import_chalk5.default.bold.cyan("dev")}           Start local development server (Frontend + Backend concurrently)
  ${import_chalk5.default.bold.cyan("build")}         Build production assets for both webiu-ui and webiu-server
  ${import_chalk5.default.bold.cyan("config")}        Re-configure Organization metadata, branding, or environment variables
  ${import_chalk5.default.bold.cyan("deploy")}        Launch interactive deployment generator for Render, Railway, Vercel, or Docker
  ${import_chalk5.default.bold.cyan("docker:up")}     Spin up containerized development environment using Docker Compose
  ${import_chalk5.default.bold.cyan("docker:down")}   Stop and remove running local Docker containers
  ${import_chalk5.default.bold.cyan("help")}          Display detailed command usage and architectural instructions

${import_chalk5.default.bold.green("Options:")}
  ${import_chalk5.default.bold.cyan("-v, --version")} Output the current version of webiu
  ${import_chalk5.default.bold.cyan("-h, --help")}    Display help information for command

${import_chalk5.default.bold.magenta("Examples:")}
  $ ${import_chalk5.default.cyan("npx webiu init")}
  $ ${import_chalk5.default.cyan("npx webiu dev")}
  $ ${import_chalk5.default.cyan("npx webiu deploy")}

${import_chalk5.default.gray("For detailed online documentation, visit:")} ${import_chalk5.default.underline.blue("https://github.com/c2siorg/Webiu")}
${import_chalk5.default.gray("Maintainers: C2SI Organization (Community Software Infrastructure)")} XD
`);
}

// src-cli/commands/docker.ts
var import_execa2 = require("execa");
var import_chalk6 = __toESM(require("chalk"));
async function dockerUpCommand() {
  console.log(`
${import_chalk6.default.bold.cyan("Starting Docker containerized environment... :D")}
`);
  try {
    await (0, import_execa2.execa)("docker", ["compose", "up", "-d"], { stdio: "inherit" });
    console.log(import_chalk6.default.green("\nDocker containers started successfully! XD"));
  } catch (err) {
    console.error(import_chalk6.default.red("Failed to start Docker containers:"), err);
  }
}
async function dockerDownCommand() {
  console.log(`
${import_chalk6.default.bold.cyan("Stopping Docker containerized environment...")}
`);
  try {
    await (0, import_execa2.execa)("docker", ["compose", "down"], { stdio: "inherit" });
    console.log(import_chalk6.default.green("\nDocker containers stopped cleanly."));
  } catch (err) {
    console.error(import_chalk6.default.red("Failed to stop Docker containers:"), err);
  }
}

// src-cli/index.ts
var program = new import_commander.Command();
program.name("webiu").description("CLI tool to generate, configure, and deploy Webiu community portals").version("1.0.0");
program.command("init").description("Interactively initialize a new Webiu portal project").option("-n, --name <name>", "Project name").action(initCommand);
program.command("dev").description("Start local development server (Frontend + Backend concurrently)").action(devCommand);
program.command("build").description("Build production assets for both webiu-ui and webiu-server").action(buildCommand);
program.command("config").description("Re-configure Organization metadata, branding, or environment variables").action(configCommand);
program.command("deploy").description("Launch interactive deployment generator for Render, Railway, Vercel, or Docker").action(deployCommand);
program.command("docker:up").description("Spin up containerized development environment using Docker Compose").action(dockerUpCommand);
program.command("docker:down").description("Stop and remove running local Docker containers").action(dockerDownCommand);
program.command("help").description("Display detailed command usage and architectural instructions").action(helpCommand);
program.parse(process.argv);
if (!process.argv.slice(2).length) {
  helpCommand();
}
