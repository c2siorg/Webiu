// src-cli/commands/dev.ts
import concurrently from "concurrently";
import chalk2 from "chalk";
import path from "path";
import fs from "fs-extra";
import net from "net";

// src-cli/utils/banner.ts
import chalk from "chalk";
import gradient from "gradient-string";
import os from "os";
var WEBIU_ASCII = `
 \u2588\u2588\u2557    \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2557\u2588\u2588\u2557   \u2588\u2588\u2557
 \u2588\u2588\u2551    \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2551   \u2588\u2588\u2551
 \u2588\u2588\u2551 \u2588\u2557 \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551\u2588\u2588\u2551   \u2588\u2588\u2551
 \u2588\u2588\u2551\u2588\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u255D  \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2551   \u2588\u2588\u2551
 \u255A\u2588\u2588\u2588\u2554\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551\u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D
  \u255A\u2550\u2550\u255D\u255A\u2550\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2550\u255D `;
var VERSION = "1.0.5";
function printWelcomeBanner() {
  console.log(gradient(["#7B8CFF", "#00C8FF"])(WEBIU_ASCII));
  console.log(
    gradient(["#7B8CFF", "#00C8FF"])(
      "  CLI Scaffolding Engine for Webiu Community Portals"
    )
  );
  console.log("");
  const width = 64;
  const border = chalk.hex("#7B8CFF")("\u2500".repeat(width));
  const corner = chalk.hex("#7B8CFF");
  console.log(corner("\u256D") + border + corner("\u256E"));
  const row = (label, value) => {
    const visibleLen = label.length + value.length + 4;
    const pad = Math.max(0, width - visibleLen);
    console.log(
      corner("\u2502") + `  ${chalk.bold.gray(label.padEnd(16))} ${chalk.cyan(value)}` + " ".repeat(pad) + corner("\u2502")
    );
  };
  row("Version", `v${VERSION}`);
  row("CLI Package", "create-webiu");
  row("Maintainer", "Ceylon Computer Science Institute (C2SI)");
  row("Node Version", process.version);
  row("System OS", `${os.type()} ${os.arch()}`);
  console.log(corner("\u251C") + border + corner("\u2524"));
  const tipText = "\u26A1 Tip: Use \u2191 \u2193 arrows to navigate options, Enter to select";
  const tipPad = Math.max(0, width - tipText.length - 2);
  console.log(
    corner("\u2502") + `  ${chalk.yellow("\u26A1")} ${chalk.gray("Tip: Use")} ${chalk.bold.white("\u2191 \u2193")} ${chalk.gray("arrows to navigate,")} ${chalk.bold.white("Enter")} ${chalk.gray("to select")}` + " ".repeat(tipPad + 4) + corner("\u2502")
  );
  console.log(corner("\u2570") + border + corner("\u256F"));
  console.log("");
}
function printLiveSummaryCard(config) {
  const width = 64;
  const border = chalk.hex("#00C8FF")("\u2500".repeat(width));
  const corner = chalk.hex("#00C8FF");
  console.log(`
${corner("\u250C")}${border}${corner("\u2510")}`);
  console.log(`${corner("\u2502")}  ${chalk.bold.magenta("\u2699\uFE0F  LIVE CONFIGURATION SUMMARY")} ${" ".repeat(width - 34)}${corner("\u2502")}`);
  console.log(`${corner("\u251C")}${border}${corner("\u2524")}`);
  const item = (label, value, badgeColor) => {
    if (!value) return;
    const styledVal = badgeColor ? chalk.hex(badgeColor)(`\u25A0 ${value}`) : chalk.white(value);
    const visibleLen = label.length + value.length + (badgeColor ? 6 : 4);
    const pad = Math.max(0, width - visibleLen);
    console.log(`${corner("\u2502")}  ${chalk.bold.gray(label.padEnd(18))} ${styledVal}${" ".repeat(pad)}${corner("\u2502")}`);
  };
  item("Project Folder", config.projectName);
  item("Organization", config.orgName);
  item("Org Type", config.orgType);
  item("GitHub Org/User", config.githubOrg);
  item("Database Setup", config.dbStrategy);
  item("Theme Accent", config.themeAccent, config.themeAccent);
  item("Deploy Target", config.deployTarget);
  item("Admin Username", config.adminUsername);
  if (config.navbarSections && config.navbarSections.length > 0) {
    const navText = config.navbarSections.join(", ");
    const pad = Math.max(0, width - navText.length - 20);
    console.log(`${corner("\u2502")}  ${chalk.bold.gray("Navbar Sections".padEnd(18))} ${chalk.green(navText)}${" ".repeat(pad)}${corner("\u2502")}`);
  }
  console.log(`${corner("\u2514")}${border}${corner("\u2518")}
`);
}
function printFinalVictoryScreen(config) {
  console.log(gradient(["#10B981", "#00C8FF"])(`
 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  \u{1F389} WEBIU COMMUNITY PORTAL CREATED SUCCESSFULLY!
 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`));
  const width = 64;
  const border = chalk.hex("#10B981")("\u2500".repeat(width));
  const corner = chalk.hex("#10B981");
  console.log(corner("\u256D") + border + corner("\u256E"));
  const row = (label, val, colorHex) => {
    const displayVal = colorHex ? chalk.hex(colorHex)(`\u25A0 ${val}`) : chalk.cyan(val);
    const visibleLen = label.length + val.length + (colorHex ? 6 : 4);
    const pad = Math.max(0, width - visibleLen);
    console.log(corner("\u2502") + `  ${chalk.bold.gray(label.padEnd(18))} ${displayVal}` + " ".repeat(pad) + corner("\u2502"));
  };
  row("Project Name", config.projectName);
  row("Organization", config.orgName);
  row("Theme Accent", config.themeAccent, config.themeAccent);
  row("Active Navbar", `${config.navbarSections.length} sections active`);
  row("Frontend URL", "http://localhost:4200");
  row("Backend API", "http://localhost:5050");
  console.log(corner("\u251C") + border + corner("\u2524"));
  console.log(corner("\u2502") + `  ${chalk.bold.yellow("\u{1F680} QUICKSTART COMMANDS:")}${" ".repeat(width - 25)}` + corner("\u2502"));
  console.log(corner("\u2502") + `  ${chalk.gray("1.")} cd ${chalk.cyan(config.projectName)}${" ".repeat(Math.max(0, width - 8 - config.projectName.length))}` + corner("\u2502"));
  if (config.dbStrategy === "docker-postgres") {
    console.log(corner("\u2502") + `  ${chalk.gray("2.")} docker compose up -d ${chalk.gray("(Starts PostgreSQL container)")}${" ".repeat(Math.max(0, width - 53))}` + corner("\u2502"));
    console.log(corner("\u2502") + `  ${chalk.gray("3.")} webiu dev             ${chalk.gray("(Launches UI + API servers)")}${" ".repeat(Math.max(0, width - 53))}` + corner("\u2502"));
  } else {
    console.log(corner("\u2502") + `  ${chalk.gray("2.")} webiu dev             ${chalk.gray("(Launches UI + API servers)")}${" ".repeat(Math.max(0, width - 53))}` + corner("\u2502"));
  }
  console.log(corner("\u2570") + border + corner("\u256F"));
  console.log("");
}
function printCompactHeader(commandName) {
  const tag = chalk.bgHex("#7B8CFF").black(` WebiU CLI v${VERSION} `);
  const cmd = chalk.bold.cyan(commandName);
  console.log(`
${tag}  ${cmd}
`);
}

// src-cli/commands/dev.ts
function isPortReachable(port, host = "127.0.0.1", timeout = 1500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}
function parseDatabaseUrl(url) {
  try {
    const normalized = url.replace(/^postgres:\/\//, "postgresql://");
    const parsed = new URL(normalized);
    return {
      host: parsed.hostname || "localhost",
      port: parseInt(parsed.port || "5432", 10)
    };
  } catch {
    return null;
  }
}
async function devCommand() {
  printCompactHeader("webiu dev \u2014 Development Server");
  const serverDir = path.join(process.cwd(), "webiu-server");
  const uiDir = path.join(process.cwd(), "webiu-ui");
  if (!await fs.pathExists(serverDir) || !await fs.pathExists(uiDir)) {
    console.error(chalk2.red("\n  \u2718 webiu-server or webiu-ui directories not found!"));
    console.error(chalk2.yellow("  Make sure you have run `webiu init` first and are inside your project directory."));
    console.error(chalk2.yellow(`  Expected: ${chalk2.cyan(serverDir)}`));
    console.error(chalk2.yellow(`  Expected: ${chalk2.cyan(uiDir)}
`));
    process.exit(1);
  }
  const serverModules = path.join(serverDir, "node_modules");
  const uiModules = path.join(uiDir, "node_modules");
  if (!await fs.pathExists(serverModules) || !await fs.pathExists(uiModules)) {
    console.error(chalk2.red("\n  \u2718 node_modules not found in webiu-server or webiu-ui!"));
    console.error(chalk2.yellow("  Please run the following commands first:"));
    console.error(chalk2.cyan("    cd webiu-server && npm install && cd .."));
    console.error(chalk2.cyan("    cd webiu-ui && npm install && cd ..\n"));
    process.exit(1);
  }
  const envPath = path.join(process.cwd(), "webiu-server", ".env");
  let dbHost = "localhost";
  let dbPort = 5433;
  if (await fs.pathExists(envPath)) {
    const envContent = await fs.readFile(envPath, "utf-8");
    const dbUrlMatch = envContent.match(/^DATABASE_URL="?([^"\n]+)"?/m);
    if (dbUrlMatch) {
      const parsed = parseDatabaseUrl(dbUrlMatch[1]);
      if (parsed) {
        dbHost = parsed.host;
        dbPort = parsed.port;
      }
    }
  }
  console.log(chalk2.gray(`  Checking database at ${dbHost}:${dbPort}...`));
  const dbReachable = await isPortReachable(dbPort, dbHost === "localhost" ? "127.0.0.1" : dbHost);
  if (!dbReachable) {
    console.log("");
    console.log(chalk2.yellow("  \u26A0 Warning: Cannot reach the database!"));
    console.log(chalk2.gray(`  Expected PostgreSQL at ${chalk2.bold(`${dbHost}:${dbPort}`)}`));
    console.log("");
    console.log(chalk2.bold("  To fix this, start your database first:"));
    console.log(chalk2.cyan("    docker compose up -d"));
    console.log("");
    console.log(chalk2.gray("  (Continuing anyway \u2014 backend will retry the connection automatically)"));
    console.log("");
  } else {
    console.log(chalk2.green(`  \u2714 Database reachable at ${dbHost}:${dbPort}`));
  }
  console.log("");
  console.log(chalk2.gray(`  Backend API \u2192  http://localhost:5050`));
  console.log(chalk2.gray(`  Frontend UI \u2192  http://localhost:4200`));
  console.log(chalk2.gray("  Press Ctrl+C to stop all servers\n"));
  try {
    const { result } = concurrently(
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
    console.error(chalk2.red("\n  Development servers stopped unexpectedly:"), err);
  }
}
async function buildCommand() {
  printCompactHeader("webiu build \u2014 Production Build");
  const serverDir = path.join(process.cwd(), "webiu-server");
  const uiDir = path.join(process.cwd(), "webiu-ui");
  if (!await fs.pathExists(serverDir) || !await fs.pathExists(uiDir)) {
    console.error(chalk2.red("  \u2718 webiu-server or webiu-ui not found. Run `webiu init` first.\n"));
    process.exit(1);
  }
  const execa = (await import("execa")).default;
  console.log(chalk2.cyan("  Building NestJS backend..."));
  await execa("npm", ["run", "build"], { cwd: serverDir, stdio: "inherit" });
  console.log(chalk2.cyan("\n  Building Angular frontend..."));
  await execa("npm", ["run", "build"], { cwd: uiDir, stdio: "inherit" });
  console.log(chalk2.green("\n  \u2714 Build complete!\n"));
}

export {
  printWelcomeBanner,
  printLiveSummaryCard,
  printFinalVictoryScreen,
  printCompactHeader,
  devCommand,
  buildCommand
};
