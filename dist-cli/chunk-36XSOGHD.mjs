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
var WEBIU_BIG_ASCII = `
\u2588\u2588\u2557    \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2557\u2588\u2588\u2557   \u2588\u2588\u2557
\u2588\u2588\u2551    \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2551   \u2588\u2588\u2551
\u2588\u2588\u2551 \u2588\u2557 \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551\u2588\u2588\u2551   \u2588\u2588\u2551
\u2588\u2588\u2551\u2588\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u255D  \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2551   \u2588\u2588\u2551
\u255A\u2588\u2588\u2588\u2554\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551\u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D
 \u255A\u2550\u2550\u255D\u255A\u2550\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2550\u255D `;
var VERSION = "2.0.1";
function visibleLength(str) {
  return str.replace(/\u001b\[[0-9;]*m/g, "").length;
}
function printWelcomeBanner() {
  console.log(gradient(["#7B8CFF", "#00C8FF", "#10B981"])(WEBIU_BIG_ASCII));
  console.log(
    gradient(["#7B8CFF", "#00C8FF"])(
      "  \u26A1 CLI Scaffolding Engine for Webiu Community Portals"
    )
  );
  console.log("");
  const rows = [
    ["Version", `v${VERSION}`],
    ["CLI Package", "create-webiu"],
    ["Maintainer", "Ceylon Computer Science Institute (C2SI)"],
    ["Node Version", process.version],
    ["System OS", `${os.type()} ${os.arch()}`]
  ];
  let maxContentLen = 0;
  for (const [label, val] of rows) {
    const len = label.length + val.length + 6;
    if (len > maxContentLen) maxContentLen = len;
  }
  const width = Math.max(72, maxContentLen + 4);
  const border = chalk.hex("#7B8CFF")("\u2550".repeat(width));
  const corner = chalk.hex("#7B8CFF");
  console.log(corner("\u2554") + border + corner("\u2557"));
  for (const [label, val] of rows) {
    const leftText = `  ${chalk.bold.gray(label.padEnd(16))} ${chalk.cyan(val)}`;
    const padCount = width - visibleLength(leftText);
    console.log(corner("\u2551") + leftText + " ".repeat(Math.max(0, padCount)) + corner("\u2551"));
  }
  const divider = chalk.hex("#7B8CFF")("\u2500".repeat(width));
  console.log(corner("\u255F") + divider + corner("\u2562"));
  const tipLeft = `  ${chalk.yellow("\u26A1")} ${chalk.gray("Tip: Use")} ${chalk.bold.white("\u2191 \u2193")} ${chalk.gray("arrows to navigate,")} ${chalk.bold.white("Space")} ${chalk.gray("to toggle,")} ${chalk.bold.white("Enter")} ${chalk.gray("to confirm")}`;
  const tipPad = width - visibleLength(tipLeft);
  console.log(corner("\u2551") + tipLeft + " ".repeat(Math.max(0, tipPad)) + corner("\u2551"));
  console.log(corner("\u255A") + border + corner("\u255D"));
  console.log("");
}
function printLiveSummaryCard(config) {
  const items = [
    ["Project Folder", config.projectName, void 0],
    ["Organization", config.orgName, void 0],
    ["Org Type", config.orgType, void 0],
    ["GitHub Org/User", config.githubOrg, void 0],
    ["Database Setup", config.dbStrategy, void 0],
    ["Theme Accent", config.themeAccent, config.themeAccent],
    ["Deploy Target", config.deployTarget, void 0],
    ["Admin Username", config.adminUsername, void 0]
  ];
  if (config.navbarSections && config.navbarSections.length > 0) {
    items.push(["Navbar Sections", config.navbarSections.join(", "), void 0]);
  }
  let maxContentLen = 34;
  for (const [label, val, hex] of items) {
    if (!val) continue;
    const len = label.length + val.length + (hex ? 6 : 4);
    if (len > maxContentLen) maxContentLen = len;
  }
  const width = Math.max(72, maxContentLen + 4);
  const border = chalk.hex("#00C8FF")("\u2550".repeat(width));
  const corner = chalk.hex("#00C8FF");
  console.log(`
${corner("\u2554")}${border}${corner("\u2557")}`);
  const headerText = `  ${chalk.bold.magenta("\u2699\uFE0F   LIVE CONFIGURATION SUMMARY")}`;
  const headerPad = width - visibleLength(headerText);
  console.log(`${corner("\u2551")}${headerText}${" ".repeat(Math.max(0, headerPad))}${corner("\u2551")}`);
  console.log(`${corner("\u255F")}${chalk.hex("#00C8FF")("\u2500".repeat(width))}${corner("\u2562")}`);
  for (const [label, val, badgeColor] of items) {
    if (!val) continue;
    const valText = badgeColor ? chalk.hex(badgeColor)(`\u25A0 ${val}`) : chalk.white(val);
    const leftText = `  ${chalk.bold.gray(label.padEnd(18))} ${valText}`;
    const pad = width - visibleLength(leftText);
    console.log(`${corner("\u2551")}${leftText}${" ".repeat(Math.max(0, pad))}${corner("\u2551")}`);
  }
  console.log(`${corner("\u255A")}${border}${corner("\u255D")}
`);
}
function printFinalVictoryScreen(config) {
  console.log(gradient(["#10B981", "#00C8FF"])(`
 \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  \u{1F389} WEBIU COMMUNITY PORTAL CREATED SUCCESSFULLY!
 \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550`));
  const items = [
    ["Project Name", config.projectName, void 0],
    ["Organization", config.orgName, void 0],
    ["Theme Accent", config.themeAccent, config.themeAccent],
    ["Active Navbar", `${config.navbarSections.length} sections active (${config.navbarSections.join(", ")})`, void 0],
    ["Frontend UI", "http://localhost:4200", void 0],
    ["Backend API", "http://localhost:5050", void 0]
  ];
  let maxLen = 50;
  for (const [label, val, hex] of items) {
    const len = label.length + val.length + (hex ? 6 : 4);
    if (len > maxLen) maxLen = len;
  }
  const width = Math.max(72, maxLen + 4);
  const border = chalk.hex("#10B981")("\u2550".repeat(width));
  const corner = chalk.hex("#10B981");
  console.log(corner("\u2554") + border + corner("\u2557"));
  for (const [label, val, colorHex] of items) {
    const displayVal = colorHex ? chalk.hex(colorHex)(`\u25A0 ${val}`) : chalk.cyan(val);
    const leftText = `  ${chalk.bold.gray(label.padEnd(18))} ${displayVal}`;
    const pad = width - visibleLength(leftText);
    console.log(corner("\u2551") + leftText + " ".repeat(Math.max(0, pad)) + corner("\u2551"));
  }
  console.log(corner("\u255F") + chalk.hex("#10B981")("\u2500".repeat(width)) + corner("\u2562"));
  const headerText = `  ${chalk.bold.yellow("\u{1F680} NEXT STEPS TO GET STARTED:")}`;
  console.log(corner("\u2551") + headerText + " ".repeat(Math.max(0, width - visibleLength(headerText))) + corner("\u2551"));
  const cmd1 = `  ${chalk.gray("1.")} cd ${chalk.cyan(config.projectName)}`;
  console.log(corner("\u2551") + cmd1 + " ".repeat(Math.max(0, width - visibleLength(cmd1))) + corner("\u2551"));
  if (config.dbStrategy === "docker-postgres") {
    const cmd2 = `  ${chalk.gray("2.")} docker compose up -d ${chalk.gray("(Starts PostgreSQL container)")}`;
    console.log(corner("\u2551") + cmd2 + " ".repeat(Math.max(0, width - visibleLength(cmd2))) + corner("\u2551"));
    const cmd3 = `  ${chalk.gray("3.")} webiu dev             ${chalk.gray("(Launches UI + API servers)")}`;
    console.log(corner("\u2551") + cmd3 + " ".repeat(Math.max(0, width - visibleLength(cmd3))) + corner("\u2551"));
  } else {
    const cmd2 = `  ${chalk.gray("2.")} webiu dev             ${chalk.gray("(Launches UI + API servers)")}`;
    console.log(corner("\u2551") + cmd2 + " ".repeat(Math.max(0, width - visibleLength(cmd2))) + corner("\u2551"));
  }
  console.log(corner("\u255A") + border + corner("\u255D"));
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
