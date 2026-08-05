var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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

// src-cli/constants.ts
var VERSION, WEBIU_REPO, WEBIU_BRANCH, ALL_NAVBAR_SECTIONS;
var init_constants = __esm({
  "src-cli/constants.ts"() {
    VERSION = "2.0.1";
    WEBIU_REPO = "https://github.com/TarunyaProgrammer/Webiu.git";
    WEBIU_BRANCH = "webiu-npm-pack";
    ALL_NAVBAR_SECTIONS = [
      { name: "\u{1F3E0} Home          (always included)", value: "home", disabled: true },
      { name: "\u{1F4C1} Projects", value: "projects", checked: true },
      { name: "\u{1F4F0} Publications", value: "publications", checked: true },
      { name: "\u{1F465} Contributors", value: "contributors", checked: true },
      { name: "\u{1F310} Community", value: "community", checked: true },
      { name: "\u{1F4BC} Opportunities", value: "opportunities", checked: true },
      { name: "\u{1F393} GSoC (Google Summer of Code)", value: "gsoc", checked: true }
    ];
  }
});

// src-cli/utils/banner.ts
function visibleLength(str) {
  return str.replace(/\u001b\[[0-9;]*m/g, "").length;
}
function printWelcomeBanner() {
  console.log((0, import_gradient_string.default)(["#7B8CFF", "#00C8FF", "#10B981"])(WEBIU_BIG_ASCII));
  console.log(
    (0, import_gradient_string.default)(["#7B8CFF", "#00C8FF"])(
      "  \u26A1 CLI Scaffolding Engine for Webiu Community Portals"
    )
  );
  console.log("");
  const rows = [
    ["Version", `v${VERSION}`],
    ["CLI Package", "create-webiu"],
    ["Maintainer", "Ceylon Computer Science Institute (C2SI)"],
    ["Node Version", process.version],
    ["System OS", `${import_os.default.type()} ${import_os.default.arch()}`]
  ];
  let maxContentLen = 0;
  for (const [label, val] of rows) {
    const len = label.length + val.length + 6;
    if (len > maxContentLen) maxContentLen = len;
  }
  const width = Math.max(72, maxContentLen + 4);
  const border = import_chalk.default.hex("#7B8CFF")("\u2550".repeat(width));
  const corner = import_chalk.default.hex("#7B8CFF");
  console.log(corner("\u2554") + border + corner("\u2557"));
  for (const [label, val] of rows) {
    const leftText = `  ${import_chalk.default.bold.gray(label.padEnd(16))} ${import_chalk.default.cyan(val)}`;
    const padCount = width - visibleLength(leftText);
    console.log(corner("\u2551") + leftText + " ".repeat(Math.max(0, padCount)) + corner("\u2551"));
  }
  const divider = import_chalk.default.hex("#7B8CFF")("\u2500".repeat(width));
  console.log(corner("\u255F") + divider + corner("\u2562"));
  const tipLeft = `  ${import_chalk.default.yellow("\u26A1")} ${import_chalk.default.gray("Tip: Use")} ${import_chalk.default.bold.white("\u2191 \u2193")} ${import_chalk.default.gray("arrows to navigate,")} ${import_chalk.default.bold.white("Space")} ${import_chalk.default.gray("to toggle,")} ${import_chalk.default.bold.white("Enter")} ${import_chalk.default.gray("to confirm")}`;
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
  const border = import_chalk.default.hex("#00C8FF")("\u2550".repeat(width));
  const corner = import_chalk.default.hex("#00C8FF");
  console.log(`
${corner("\u2554")}${border}${corner("\u2557")}`);
  const headerText = `  ${import_chalk.default.bold.magenta("\u2699\uFE0F   LIVE CONFIGURATION SUMMARY")}`;
  const headerPad = width - visibleLength(headerText);
  console.log(`${corner("\u2551")}${headerText}${" ".repeat(Math.max(0, headerPad))}${corner("\u2551")}`);
  console.log(`${corner("\u255F")}${import_chalk.default.hex("#00C8FF")("\u2500".repeat(width))}${corner("\u2562")}`);
  for (const [label, val, badgeColor] of items) {
    if (!val) continue;
    const valText = badgeColor ? import_chalk.default.hex(badgeColor)(`\u25A0 ${val}`) : import_chalk.default.white(val);
    const leftText = `  ${import_chalk.default.bold.gray(label.padEnd(18))} ${valText}`;
    const pad = width - visibleLength(leftText);
    console.log(`${corner("\u2551")}${leftText}${" ".repeat(Math.max(0, pad))}${corner("\u2551")}`);
  }
  console.log(`${corner("\u255A")}${border}${corner("\u255D")}
`);
}
function printFinalVictoryScreen(config) {
  console.log((0, import_gradient_string.default)(["#10B981", "#00C8FF"])(`
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
  const border = import_chalk.default.hex("#10B981")("\u2550".repeat(width));
  const corner = import_chalk.default.hex("#10B981");
  console.log(corner("\u2554") + border + corner("\u2557"));
  for (const [label, val, colorHex] of items) {
    const displayVal = colorHex ? import_chalk.default.hex(colorHex)(`\u25A0 ${val}`) : import_chalk.default.cyan(val);
    const leftText = `  ${import_chalk.default.bold.gray(label.padEnd(18))} ${displayVal}`;
    const pad = width - visibleLength(leftText);
    console.log(corner("\u2551") + leftText + " ".repeat(Math.max(0, pad)) + corner("\u2551"));
  }
  console.log(corner("\u255F") + import_chalk.default.hex("#10B981")("\u2500".repeat(width)) + corner("\u2562"));
  const headerText = `  ${import_chalk.default.bold.yellow("\u{1F680} NEXT STEPS TO GET STARTED:")}`;
  console.log(corner("\u2551") + headerText + " ".repeat(Math.max(0, width - visibleLength(headerText))) + corner("\u2551"));
  const cmd1 = `  ${import_chalk.default.gray("1.")} cd ${import_chalk.default.cyan(config.projectName)}`;
  console.log(corner("\u2551") + cmd1 + " ".repeat(Math.max(0, width - visibleLength(cmd1))) + corner("\u2551"));
  if (config.dbStrategy === "docker-postgres") {
    const cmd2 = `  ${import_chalk.default.gray("2.")} docker compose up -d ${import_chalk.default.gray("(Starts PostgreSQL container)")}`;
    console.log(corner("\u2551") + cmd2 + " ".repeat(Math.max(0, width - visibleLength(cmd2))) + corner("\u2551"));
    const cmd3 = `  ${import_chalk.default.gray("3.")} webiu dev             ${import_chalk.default.gray("(Launches UI + API servers)")}`;
    console.log(corner("\u2551") + cmd3 + " ".repeat(Math.max(0, width - visibleLength(cmd3))) + corner("\u2551"));
  } else {
    const cmd2 = `  ${import_chalk.default.gray("2.")} webiu dev             ${import_chalk.default.gray("(Launches UI + API servers)")}`;
    console.log(corner("\u2551") + cmd2 + " ".repeat(Math.max(0, width - visibleLength(cmd2))) + corner("\u2551"));
  }
  console.log(corner("\u255A") + border + corner("\u255D"));
  console.log("");
}
function printCompactHeader(commandName) {
  const tag = import_chalk.default.bgHex("#7B8CFF").black(` WebiU CLI v${VERSION} `);
  const cmd = import_chalk.default.bold.cyan(commandName);
  console.log(`
${tag}  ${cmd}
`);
}
var import_chalk, import_gradient_string, import_os, WEBIU_BIG_ASCII;
var init_banner = __esm({
  "src-cli/utils/banner.ts"() {
    import_chalk = __toESM(require("chalk"));
    import_gradient_string = __toESM(require("gradient-string"));
    import_os = __toESM(require("os"));
    init_constants();
    WEBIU_BIG_ASCII = `
\u2588\u2588\u2557    \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2557\u2588\u2588\u2557   \u2588\u2588\u2557
\u2588\u2588\u2551    \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2551   \u2588\u2588\u2551
\u2588\u2588\u2551 \u2588\u2557 \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551\u2588\u2588\u2551   \u2588\u2588\u2551
\u2588\u2588\u2551\u2588\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u255D  \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2551   \u2588\u2588\u2551
\u255A\u2588\u2588\u2588\u2554\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551\u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D
 \u255A\u2550\u2550\u255D\u255A\u2550\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2550\u255D `;
  }
});

// src-cli/commands/dev.ts
var dev_exports = {};
__export(dev_exports, {
  buildCommand: () => buildCommand,
  devCommand: () => devCommand
});
function isPortReachable(port, host = "127.0.0.1", timeout = 1500) {
  return new Promise((resolve) => {
    const socket = new import_net.default.Socket();
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
  const serverDir = import_path.default.join(process.cwd(), "webiu-server");
  const uiDir = import_path.default.join(process.cwd(), "webiu-ui");
  if (!await import_fs_extra.default.pathExists(serverDir) || !await import_fs_extra.default.pathExists(uiDir)) {
    console.error(import_chalk2.default.red("\n  \u2718 webiu-server or webiu-ui directories not found!"));
    console.error(import_chalk2.default.yellow("  Make sure you have run `webiu init` first and are inside your project directory."));
    console.error(import_chalk2.default.yellow(`  Expected: ${import_chalk2.default.cyan(serverDir)}`));
    console.error(import_chalk2.default.yellow(`  Expected: ${import_chalk2.default.cyan(uiDir)}
`));
    process.exit(1);
  }
  const serverModules = import_path.default.join(serverDir, "node_modules");
  const uiModules = import_path.default.join(uiDir, "node_modules");
  if (!await import_fs_extra.default.pathExists(serverModules) || !await import_fs_extra.default.pathExists(uiModules)) {
    console.error(import_chalk2.default.red("\n  \u2718 node_modules not found in webiu-server or webiu-ui!"));
    console.error(import_chalk2.default.yellow("  Please run the following commands first:"));
    console.error(import_chalk2.default.cyan("    cd webiu-server && npm install && cd .."));
    console.error(import_chalk2.default.cyan("    cd webiu-ui && npm install && cd ..\n"));
    process.exit(1);
  }
  const envPath = import_path.default.join(process.cwd(), "webiu-server", ".env");
  let dbHost = "localhost";
  let dbPort = 5433;
  if (await import_fs_extra.default.pathExists(envPath)) {
    const envContent = await import_fs_extra.default.readFile(envPath, "utf-8");
    const dbUrlMatch = envContent.match(/^DATABASE_URL="?([^"\n]+)"?/m);
    if (dbUrlMatch) {
      const parsed = parseDatabaseUrl(dbUrlMatch[1]);
      if (parsed) {
        dbHost = parsed.host;
        dbPort = parsed.port;
      }
    }
  }
  console.log(import_chalk2.default.gray(`  Checking database at ${dbHost}:${dbPort}...`));
  const dbReachable = await isPortReachable(dbPort, dbHost === "localhost" ? "127.0.0.1" : dbHost);
  if (!dbReachable) {
    console.log("");
    console.log(import_chalk2.default.yellow("  \u26A0 Warning: Cannot reach the database!"));
    console.log(import_chalk2.default.gray(`  Expected PostgreSQL at ${import_chalk2.default.bold(`${dbHost}:${dbPort}`)}`));
    console.log("");
    console.log(import_chalk2.default.bold("  To fix this, start your database first:"));
    console.log(import_chalk2.default.cyan("    docker compose up -d"));
    console.log("");
    console.log(import_chalk2.default.gray("  (Continuing anyway \u2014 backend will retry the connection automatically)"));
    console.log("");
  } else {
    console.log(import_chalk2.default.green(`  \u2714 Database reachable at ${dbHost}:${dbPort}`));
  }
  console.log("");
  console.log(import_chalk2.default.gray(`  Backend API \u2192  http://localhost:5050`));
  console.log(import_chalk2.default.gray(`  Frontend UI \u2192  http://localhost:4200`));
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
    console.error(import_chalk2.default.red("\n  Development servers stopped unexpectedly:"), err);
  }
}
async function buildCommand() {
  printCompactHeader("webiu build \u2014 Production Build");
  const serverDir = import_path.default.join(process.cwd(), "webiu-server");
  const uiDir = import_path.default.join(process.cwd(), "webiu-ui");
  if (!await import_fs_extra.default.pathExists(serverDir) || !await import_fs_extra.default.pathExists(uiDir)) {
    console.error(import_chalk2.default.red("  \u2718 webiu-server or webiu-ui not found. Run `webiu init` first.\n"));
    process.exit(1);
  }
  const execa3 = (await import("execa")).default;
  console.log(import_chalk2.default.cyan("  Building NestJS backend..."));
  await execa3("npm", ["run", "build"], { cwd: serverDir, stdio: "inherit" });
  console.log(import_chalk2.default.cyan("\n  Building Angular frontend..."));
  await execa3("npm", ["run", "build"], { cwd: uiDir, stdio: "inherit" });
  console.log(import_chalk2.default.green("\n  \u2714 Build complete!\n"));
}
var import_concurrently, import_chalk2, import_path, import_fs_extra, import_net;
var init_dev = __esm({
  "src-cli/commands/dev.ts"() {
    import_concurrently = __toESM(require("concurrently"));
    import_chalk2 = __toESM(require("chalk"));
    import_path = __toESM(require("path"));
    import_fs_extra = __toESM(require("fs-extra"));
    import_net = __toESM(require("net"));
    init_banner();
  }
});

// src-cli/index.ts
var import_commander = require("commander");
var import_chalk8 = __toESM(require("chalk"));

// src-cli/commands/init.ts
var import_prompts = require("@inquirer/prompts");
var import_chalk3 = __toESM(require("chalk"));
var import_ora = __toESM(require("ora"));
var import_fs_extra2 = __toESM(require("fs-extra"));
var import_path2 = __toESM(require("path"));
var import_crypto = __toESM(require("crypto"));
var import_execa = __toESM(require("execa"));
init_banner();
init_constants();
async function initCommand(options) {
  printWelcomeBanner();
  console.log(`${import_chalk3.default.bold.cyan("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501")}`);
  console.log(`${import_chalk3.default.bold.yellow("  \u{1F680} Project Setup Wizard \u2014 Answer a few questions to begin")}`);
  console.log(`${import_chalk3.default.bold.cyan("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501")}
`);
  const summary = {};
  const projectName = options.name || await (0, import_prompts.input)({
    message: "What is your project directory name?",
    default: "my-webiu-portal"
  });
  const normalizedPath = import_path2.default.normalize(projectName);
  if (normalizedPath.startsWith("..") || import_path2.default.isAbsolute(projectName) || /[\\/]/.test(projectName)) {
    console.error(import_chalk3.default.red("\n  \u2718 Invalid project directory name. Path traversal characters (/, \\, ..) are not allowed."));
    console.error(import_chalk3.default.yellow('  Please provide a simple directory name (e.g. "my-webiu-portal").\n'));
    process.exit(1);
  }
  summary.projectName = projectName;
  printLiveSummaryCard(summary);
  const orgName = await (0, import_prompts.input)({
    message: "What is your Organization Name?",
    default: "My Community Org"
  });
  summary.orgName = orgName;
  printLiveSummaryCard(summary);
  const orgType = await (0, import_prompts.select)({
    message: "Select your Organization Type:",
    choices: [
      { name: "Open Source Community (e.g., C2SI, SugarLabs)", value: "opensource" },
      { name: "Non-Profit Organization", value: "nonprofit" },
      { name: "Startup / Personal Project", value: "startup" },
      { name: "Custom / Blank Setup", value: "custom" }
    ]
  });
  summary.orgType = orgType;
  printLiveSummaryCard(summary);
  const githubOrg = await (0, import_prompts.input)({
    message: "What is your GitHub Organization / User name?",
    default: "c2siorg"
  });
  summary.githubOrg = githubOrg;
  printLiveSummaryCard(summary);
  const dbStrategy = await (0, import_prompts.select)({
    message: "Select Database Setup Strategy:",
    choices: [
      { name: "PostgreSQL Container  (Automatic local Docker DB - Recommended)", value: "docker-postgres" },
      { name: "Remote PostgreSQL     (Provide your own connection string URL)", value: "remote-postgres" }
    ]
  });
  summary.dbStrategy = dbStrategy;
  printLiveSummaryCard(summary);
  let databaseUrl = "postgresql://postgres:postgres@localhost:5433/webiu_db";
  if (dbStrategy === "remote-postgres") {
    databaseUrl = await (0, import_prompts.input)({
      message: "Enter your PostgreSQL Connection String URL:",
      default: databaseUrl
    });
  }
  const themeAccent = await (0, import_prompts.select)({
    message: "Select Primary UI Theme Accent Color:",
    choices: [
      { name: `${import_chalk3.default.hex("#0052CC")("\u25A0")} Ocean Blue      (#0052CC)`, value: "#0052CC" },
      { name: `${import_chalk3.default.hex("#10B981")("\u25A0")} Emerald Green   (#10B981)`, value: "#10B981" },
      { name: `${import_chalk3.default.hex("#7C3AED")("\u25A0")} Deep Purple      (#7C3AED)`, value: "#7C3AED" },
      { name: `${import_chalk3.default.hex("#EF4444")("\u25A0")} Sunset Crimson   (#EF4444)`, value: "#EF4444" },
      { name: `${import_chalk3.default.hex("#F59E0B")("\u25A0")} Amber Gold       (#F59E0B)`, value: "#F59E0B" },
      { name: `${import_chalk3.default.hex("#EC4899")("\u25A0")} Rose Pink        (#EC4899)`, value: "#EC4899" }
    ]
  });
  summary.themeAccent = themeAccent;
  printLiveSummaryCard(summary);
  const deployTarget = await (0, import_prompts.select)({
    message: "Select Target Deployment Platform:",
    choices: [
      { name: "Render              (Fullstack App + Postgres DB - Guided config)", value: "render" },
      { name: "Railway             (Instant container deployment)", value: "railway" },
      { name: "Vercel + Render     (Static Angular UI + NestJS API on Render)", value: "vercel-render" },
      { name: "Self-Hosted Docker  (Generates docker-compose.prod.yml)", value: "docker" }
    ]
  });
  summary.deployTarget = deployTarget;
  printLiveSummaryCard(summary);
  console.log(`
${import_chalk3.default.bold.gray("\u2500\u2500 Admin Account Setup \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500")}
`);
  const adminUsername = await (0, import_prompts.input)({
    message: "Admin dashboard username:",
    default: "admin"
  });
  summary.adminUsername = adminUsername;
  printLiveSummaryCard(summary);
  const adminPassword = await (0, import_prompts.password)({
    message: "Admin dashboard password (min 8 characters):",
    validate: (val) => val.length >= 8 ? true : "Password must be at least 8 characters."
  });
  console.log(`
${import_chalk3.default.bold.gray("\u2500\u2500 Portal Navigation \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500")}
`);
  const selectedSections = await (0, import_prompts.checkbox)({
    message: "Which sections do you want in your portal's navbar?",
    choices: ALL_NAVBAR_SECTIONS,
    instructions: import_chalk3.default.gray("  Space to toggle \xB7 A to select all \xB7 Enter to confirm")
  });
  const navbarSections = ["home", ...selectedSections.filter((s) => s !== "home")];
  summary.navbarSections = navbarSections;
  printLiveSummaryCard(summary);
  const projectDir = import_path2.default.resolve(process.cwd(), projectName);
  if (await import_fs_extra2.default.pathExists(projectDir)) {
    const existing = await import_fs_extra2.default.readdir(projectDir);
    if (existing.length > 0) {
      console.log(import_chalk3.default.red(`
  \u2718 Directory "${projectName}" already exists and is not empty.`));
      console.log(import_chalk3.default.yellow("  Please choose an empty directory or delete the existing one.\n"));
      process.exit(1);
    }
  }
  await import_fs_extra2.default.ensureDir(projectDir);
  console.log("");
  const spinner = (0, import_ora.default)({
    text: `Cloning Webiu source code into "${import_chalk3.default.cyan(projectName)}"...`,
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
    spinner.text = "Injecting organization configuration...";
    const jwtSecret = import_crypto.default.randomBytes(32).toString("hex");
    const rootEnvContent = [
      "# Generated by Webiu CLI \u2014 Do not commit this file to version control",
      `PORT=5050`,
      `NODE_ENV=development`,
      `ORG_NAME="${orgName}"`,
      `GITHUB_ORG_NAME="${githubOrg}"`,
      `ORG_TYPE="${orgType}"`,
      `THEME_ACCENT="${themeAccent}"`,
      `DEPLOY_TARGET="${deployTarget}"`,
      `DATABASE_URL="${databaseUrl}"`,
      `JWT_SECRET="${jwtSecret}"`,
      `ADMIN_USERNAME="${adminUsername}"`,
      `ADMIN_PASSWORD="${adminPassword}"`
    ].join("\n");
    await import_fs_extra2.default.writeFile(import_path2.default.join(projectDir, ".env"), rootEnvContent);
    const serverEnvPath = import_path2.default.join(projectDir, "webiu-server", ".env");
    if (await import_fs_extra2.default.pathExists(import_path2.default.dirname(serverEnvPath))) {
      const serverEnvContent = [
        "# Generated by Webiu CLI",
        `PORT=5050`,
        `NODE_ENV=development`,
        `DATABASE_URL="${databaseUrl}"`,
        `DATABASE_SSL=false`,
        `JWT_SECRET="${jwtSecret}"`,
        `GITHUB_ORG_NAME="${githubOrg}"`,
        `ADMIN_USERNAME="${adminUsername}"`,
        `ADMIN_PASSWORD="${adminPassword}"`,
        `ORG_NAME="${orgName}"`,
        `THEME_ACCENT="${themeAccent}"`,
        `FRONTEND_BASE_URL=http://localhost:4200`,
        `BACKEND_BASE_URL=http://localhost:5050`,
        `COOKIE_SAMESITE=lax`,
        `COOKIE_SECURE=false`
      ].join("\n");
      await import_fs_extra2.default.writeFile(serverEnvPath, serverEnvContent);
    }
    spinner.text = "Configuring Angular frontend...";
    const envTsPath = import_path2.default.join(projectDir, "webiu-ui", "src", "environments", "environment.ts");
    if (await import_fs_extra2.default.pathExists(envTsPath)) {
      const envTsContent = `export const environment = {
  production: false,
  serverUrl: 'http://localhost:5050',
};
`;
      await import_fs_extra2.default.writeFile(envTsPath, envTsContent);
    }
    const uiConfigPath = import_path2.default.join(projectDir, "webiu-ui", "src", "assets", "config.json");
    if (await import_fs_extra2.default.pathExists(import_path2.default.dirname(uiConfigPath))) {
      await import_fs_extra2.default.writeJson(uiConfigPath, {
        orgName,
        githubOrg,
        orgType,
        themeAccent,
        navbarSections,
        apiUrl: "http://localhost:5050",
        graphqlUrl: "http://localhost:5050/graphql"
      }, { spaces: 2 });
    }
    const targetUiDir = import_path2.default.join(projectDir, "webiu-ui", "src", "app");
    if (await import_fs_extra2.default.pathExists(targetUiDir)) {
      const appConfigServicePath = import_path2.default.join(targetUiDir, "services", "app-config.service.ts");
      if (await import_fs_extra2.default.pathExists(import_path2.default.dirname(appConfigServicePath))) {
        const appConfigCode = `import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay, catchError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

export interface AppConfig {
  orgName: string;
  githubOrg: string;
  orgType: string;
  themeAccent: string;
  navbarSections: string[];
  apiUrl: string;
  graphqlUrl: string;
}

const DEFAULT_CONFIG: AppConfig = {
  orgName: '${orgName}',
  githubOrg: '${githubOrg}',
  orgType: '${orgType}',
  themeAccent: '${themeAccent}',
  navbarSections: ${JSON.stringify(navbarSections)},
  apiUrl: 'http://localhost:5050',
  graphqlUrl: 'http://localhost:5050/graphql',
};

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private config$: Observable<AppConfig> | null = null;

  getConfig(): Observable<AppConfig> {
    if (!this.config$) {
      this.config$ = this.http
        .get<AppConfig>('/assets/config.json')
        .pipe(
          catchError(() => of(DEFAULT_CONFIG)),
          shareReplay(1),
        );
    }
    return this.config$!;
  }

  applyTheme(config: AppConfig): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const accent = config.themeAccent || DEFAULT_CONFIG.themeAccent;
    const accentDim = \`\${accent}26\`;
    const accentGlow = \`0 0 24px \${accent}40\`;
    const root = document.documentElement.style;
    root.setProperty('--theme-accent', accent);
    root.setProperty('--theme-accent-dim', accentDim);
    root.setProperty('--theme-accent-glow', accentGlow);
    root.setProperty('--accent-purple', accent);
    root.setProperty('--accent-purple-dim', accentDim);
    root.setProperty('--primary-color', accent);
    root.setProperty('--hover-color', accent);
    root.setProperty('--arrow-stroke-color', accent);
    root.setProperty('--publications-card-border-link', accent);
    root.setProperty('--profile-username-color', accent);
  }
}
`;
        await import_fs_extra2.default.writeFile(appConfigServicePath, appConfigCode);
      }
      const navbarTsPath = import_path2.default.join(targetUiDir, "components", "navbar", "navbar.component.ts");
      if (await import_fs_extra2.default.pathExists(navbarTsPath)) {
        let navTs = await import_fs_extra2.default.readFile(navbarTsPath, "utf-8");
        if (!navTs.includes("AppConfigService")) {
          navTs = navTs.replace(
            /import { SearchService } from '\.\.\/\.\.\/services\/search\.service';/,
            `import { SearchService } from '../../services/search.service';
import { AppConfigService } from '../../services/app-config.service';`
          );
          navTs = navTs.replace(
            /private searchService = inject\(SearchService\);/,
            `private searchService = inject(SearchService);
  private appConfigService = inject(AppConfigService);`
          );
          const navSectionsLogic = `
  showProjects = ${navbarSections.includes("projects")};
  showPublications = ${navbarSections.includes("publications")};
  showContributors = ${navbarSections.includes("contributors")};
  showCommunity = ${navbarSections.includes("community")};
  showOpportunities = ${navbarSections.includes("opportunities")};
  showGsoc = ${navbarSections.includes("gsoc")};
`;
          navTs = navTs.replace(/isSunVisible = true;/, `isSunVisible = true;
${navSectionsLogic}`);
          const initSub = `
    this.appConfigService.getConfig().subscribe({
      next: (config: import('../../services/app-config.service').AppConfig) => {
        if (config.navbarSections && config.navbarSections.length > 0) {
          const s = config.navbarSections;
          this.showProjects      = s.includes('projects');
          this.showPublications  = s.includes('publications');
          this.showContributors  = s.includes('contributors');
          this.showCommunity     = s.includes('community');
          this.showOpportunities = s.includes('opportunities');
          this.showGsoc          = s.includes('gsoc');
        }
      },
    });
`;
          navTs = navTs.replace(/ngOnInit\(\): void \{/, `ngOnInit(): void {${initSub}`);
          await import_fs_extra2.default.writeFile(navbarTsPath, navTs);
        }
      }
      const navbarHtmlPath = import_path2.default.join(targetUiDir, "components", "navbar", "navbar.component.html");
      if (await import_fs_extra2.default.pathExists(navbarHtmlPath)) {
        let navHtml = await import_fs_extra2.default.readFile(navbarHtmlPath, "utf-8");
        if (!navHtml.includes("@if (showProjects)")) {
          navHtml = navHtml.replace(
            /(<a\s+class="navbar__menu__items"\s+\[routerLink\]="\['\/projects'\]"[\s\S]*?<\/a>)/,
            `@if (showProjects) {
      $1
    }`
          );
          navHtml = navHtml.replace(
            /(<a\s+class="navbar__menu__items"\s+\[routerLink\]="\['\/publications'\]"[\s\S]*?<\/a>)/,
            `@if (showPublications) {
      $1
    }`
          );
          navHtml = navHtml.replace(
            /(<a\s+class="navbar__menu__items"\s+\[routerLink\]="\['\/contributors'\]"[\s\S]*?<\/a>)/,
            `@if (showContributors) {
      $1
    }`
          );
          navHtml = navHtml.replace(
            /(<a\s+class="navbar__menu__items"\s+\[routerLink\]="\['\/community'\]"[\s\S]*?<\/a>)/,
            `@if (showCommunity) {
      $1
    }`
          );
          navHtml = navHtml.replace(
            /(<a\s+class="navbar__menu__items"\s+\[routerLink\]="\['\/opportunities'\]"[\s\S]*?<\/a>)/,
            `@if (showOpportunities) {
      $1
    }`
          );
          navHtml = navHtml.replace(
            /@if \(showIdeasPage\) \{/,
            `@if (showGsoc && showIdeasPage) {`
          );
          await import_fs_extra2.default.writeFile(navbarHtmlPath, navHtml);
        }
      }
      const heroNoiseTsPath = import_path2.default.join(targetUiDir, "components", "hero-noise-background", "hero-noise-background.component.ts");
      if (await import_fs_extra2.default.pathExists(heroNoiseTsPath)) {
        let heroTs = await import_fs_extra2.default.readFile(heroNoiseTsPath, "utf-8");
        heroTs = heroTs.replace(
          /this\.ambientLight\.color\.setHex\(0x4c1d95\);[\s\S]*?this\.light4\.color\.setHex\(0xd946ef\);/,
          `const computedStyle = getComputedStyle(document.documentElement);
      const accentStr = computedStyle.getPropertyValue('--theme-accent').trim() || '${themeAccent}';
      const themeAccentColor = new THREE.Color(accentStr);
      this.material.color.copy(themeAccentColor);
      this.ambientLight.color.copy(themeAccentColor);
      this.ambientLight.intensity = 1.2;
      this.light1.color.copy(themeAccentColor);
      this.light2.color.copy(themeAccentColor);
      this.light3.color.setHex(0x10b981);
      this.light4.color.copy(themeAccentColor);`
        );
        await import_fs_extra2.default.writeFile(heroNoiseTsPath, heroTs);
      }
      const appCompTsPath = import_path2.default.join(targetUiDir, "app.component.ts");
      if (await import_fs_extra2.default.pathExists(appCompTsPath)) {
        let appTs = await import_fs_extra2.default.readFile(appCompTsPath, "utf-8");
        if (!appTs.includes("AppConfigService")) {
          appTs = appTs.replace(
            /import { SettingsService } from '\.\/services\/settings\.service';/,
            `import { SettingsService } from './services/settings.service';
import { AppConfigService } from './services/app-config.service';`
          );
          appTs = appTs.replace(
            /private settingsService = inject\(SettingsService\);/,
            `private settingsService = inject(SettingsService);
  private appConfigService = inject(AppConfigService);`
          );
          const appInitLogic = `
    this.appConfigService.getConfig().subscribe({
      next: (config: import('./services/app-config.service').AppConfig) => {
        this.appConfigService.applyTheme(config);
        if (config.orgName && config.orgName !== 'WebiU') {
          this.titleService.setTitle(\`\${config.orgName} \u2014 Community Portal\`);
        }
      },
    });
`;
          appTs = appTs.replace(/ngOnInit\(\): void \{/, `ngOnInit(): void {${appInitLogic}`);
          await import_fs_extra2.default.writeFile(appCompTsPath, appTs);
        }
      }
    }
    const indexHtmlPath = import_path2.default.join(projectDir, "webiu-ui", "src", "index.html");
    if (await import_fs_extra2.default.pathExists(indexHtmlPath)) {
      let indexHtml = await import_fs_extra2.default.readFile(indexHtmlPath, "utf-8");
      indexHtml = indexHtml.replace(
        /<title>.*?<\/title>/,
        `<title>${orgName} \u2014 Community Portal</title>`
      );
      indexHtml = indexHtml.replace(
        /content="WebiU — Open Source Intelligence Platform"/g,
        `content="${orgName} \u2014 Community Portal"`
      );
      indexHtml = indexHtml.replace(
        /content="Discover repositories, contributors, research publications, and community activity from C2SI\."/,
        `content="Discover projects, contributors, publications, and community activity from ${orgName}."`
      );
      await import_fs_extra2.default.writeFile(indexHtmlPath, indexHtml);
    }
    const manifestPath = import_path2.default.join(projectDir, "webiu-ui", "src", "manifest.webmanifest");
    if (await import_fs_extra2.default.pathExists(manifestPath)) {
      const manifest = await import_fs_extra2.default.readJson(manifestPath);
      manifest.name = `${orgName} Community Portal`;
      manifest.short_name = orgName;
      await import_fs_extra2.default.writeJson(manifestPath, manifest, { spaces: 2 });
    }
    const stylesPath = import_path2.default.join(projectDir, "webiu-ui", "src", "styles.scss");
    if (await import_fs_extra2.default.pathExists(stylesPath)) {
      let stylesContent = await import_fs_extra2.default.readFile(stylesPath, "utf-8");
      stylesContent = stylesContent.replace(
        /--theme-accent:\s*#[0-9A-Fa-f]{6};/,
        `--theme-accent:       ${themeAccent};`
      );
      stylesContent = stylesContent.replace(
        /--theme-accent-dim:\s*rgba\(.*?\);/,
        `--theme-accent-dim:   ${themeAccent}26;`
      );
      stylesContent = stylesContent.replace(
        /--theme-accent-glow:\s*.*?;/,
        `--theme-accent-glow:  0 0 24px ${themeAccent}40;`
      );
      await import_fs_extra2.default.writeFile(stylesPath, stylesContent);
    }
    const homepagePath = import_path2.default.join(projectDir, "webiu-ui", "src", "app", "page", "homepage", "homepage.component.html");
    if (await import_fs_extra2.default.pathExists(homepagePath)) {
      let homepageHtml = await import_fs_extra2.default.readFile(homepagePath, "utf-8");
      const words = orgName.toUpperCase().split(/\s+/).filter(Boolean);
      const midpoint = Math.ceil(words.length / 2);
      const row1Words = words.slice(0, midpoint);
      const row2Words = words.slice(midpoint);
      const buildWordSpan = (word, idx, isDim = false) => `<span class="hero-word hero-word--${idx + 1}${isDim ? " hero-word--dim" : ""}">${word}</span>`;
      const row1Html = row1Words.map((w, i) => buildWordSpan(w, i)).join("\n          ");
      const row2Html = row2Words.map(
        (w, i) => buildWordSpan(w, row1Words.length + i, i === row2Words.length - 1)
      ).join("\n          ");
      const newHeroTitle = `<h1 class="hero-title" appRevealOnScroll [immediate]="true" direction="center">
        <div class="hero-title-row">
          ${row1Html}
        </div>${row2Words.length > 0 ? `
        <div class="hero-title-row">
          ${row2Html}
        </div>` : ""}
        <span class="hero-handwritten-note">
          <svg class="handwritten-arrow" width="34" height="24" viewBox="0 0 34 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 23C8.5 19 18.5 10 27 1M27 1H17M27 1V9" stroke="var(--arrow-stroke-color)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Open Science Lab
        </span>
      </h1>`;
      homepageHtml = homepageHtml.replace(
        /<h1 class="hero-title"[\s\S]*?<\/h1>/,
        newHeroTitle
      );
      await import_fs_extra2.default.writeFile(homepagePath, homepageHtml);
    }
    spinner.succeed(import_chalk3.default.green(`  \u2714 Project ${import_chalk3.default.bold.cyan(`"${projectName}"`)} scaffolded successfully!`));
    printFinalVictoryScreen({
      projectName,
      orgName,
      themeAccent,
      dbStrategy,
      navbarSections
    });
    const shouldInstall = await (0, import_prompts.confirm)({
      message: `Install all dependencies now? ${import_chalk3.default.gray("(npm install in webiu-server + webiu-ui)")}`,
      default: true
    });
    if (shouldInstall) {
      await runInstall(projectDir);
      const shouldStart = await (0, import_prompts.confirm)({
        message: "Start development servers now?",
        default: true
      });
      if (shouldStart) {
        const { devCommand: devCommand2 } = await Promise.resolve().then(() => (init_dev(), dev_exports));
        process.chdir(projectDir);
        await devCommand2();
      }
    }
  } catch (err) {
    spinner.fail(import_chalk3.default.red("  \u2718 Scaffolding failed!"));
    if (err.message && err.message.includes("git")) {
      console.error(import_chalk3.default.red("\n  Git is required to scaffold a Webiu project."));
      console.error(import_chalk3.default.yellow("  Please install git from https://git-scm.com and try again.\n"));
    } else {
      console.error(err);
    }
    const existing = await import_fs_extra2.default.readdir(projectDir).catch(() => []);
    if (existing.length === 0) {
      await import_fs_extra2.default.remove(projectDir);
    }
    process.exit(1);
  }
}
async function runInstall(projectDir) {
  const serverDir = import_path2.default.join(projectDir, "webiu-server");
  const uiDir = import_path2.default.join(projectDir, "webiu-ui");
  const serverSpinner = (0, import_ora.default)({
    text: "Installing backend dependencies (webiu-server)...",
    color: "blue"
  }).start();
  const uiSpinner = (0, import_ora.default)({
    text: "Installing frontend dependencies (webiu-ui)...",
    color: "green"
  }).start();
  const installServer = (0, import_execa.default)("npm", ["install"], { cwd: serverDir, stdio: "pipe" }).then(() => {
    serverSpinner.succeed(import_chalk3.default.green("  \u2714 Backend dependencies installed"));
  }).catch(() => {
    serverSpinner.fail(import_chalk3.default.red("  \u2718 Backend install failed \u2014 run: cd webiu-server && npm install"));
  });
  const installUi = (0, import_execa.default)("npm", ["install"], { cwd: uiDir, stdio: "pipe" }).then(() => {
    uiSpinner.succeed(import_chalk3.default.green("  \u2714 Frontend dependencies installed"));
  }).catch(() => {
    uiSpinner.fail(import_chalk3.default.red("  \u2718 Frontend install failed \u2014 run: cd webiu-ui && npm install"));
  });
  await Promise.all([installServer, installUi]);
}

// src-cli/index.ts
init_dev();

// src-cli/commands/config.ts
var import_prompts2 = require("@inquirer/prompts");
var import_chalk4 = __toESM(require("chalk"));
var import_ora2 = __toESM(require("ora"));
var import_fs_extra3 = __toESM(require("fs-extra"));
var import_path3 = __toESM(require("path"));
init_banner();
init_constants();
async function configCommand() {
  printCompactHeader("webiu config \u2014 Interactive Configuration Manager");
  const rootEnvPath = import_path3.default.join(process.cwd(), ".env");
  const serverEnvPath = import_path3.default.join(process.cwd(), "webiu-server", ".env");
  const uiConfigPath = import_path3.default.join(process.cwd(), "webiu-ui", "src", "assets", "config.json");
  const isWebiuProject = await import_fs_extra3.default.pathExists(rootEnvPath) && await import_fs_extra3.default.pathExists(import_path3.default.join(process.cwd(), "webiu-server")) && await import_fs_extra3.default.pathExists(import_path3.default.join(process.cwd(), "webiu-ui"));
  if (!isWebiuProject) {
    console.error(import_chalk4.default.red("\n  \u2718 Not inside a Webiu project directory."));
    console.error(import_chalk4.default.yellow("  Please run this command from inside your project folder (e.g. cd my-webiu-portal)\n"));
    process.exit(1);
  }
  let currentEnv = {};
  try {
    const envContent = await import_fs_extra3.default.readFile(rootEnvPath, "utf-8");
    for (const line of envContent.split("\n")) {
      if (line.startsWith("#") || !line.includes("=")) continue;
      const eqIdx = line.indexOf("=");
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim().replace(/^"|"$/g, "");
      currentEnv[key] = val;
    }
  } catch {
    console.error(import_chalk4.default.yellow("  Could not read .env \u2014 starting fresh.\n"));
  }
  const setting = await (0, import_prompts2.select)({
    message: "What would you like to re-configure?",
    choices: [
      { name: "\u{1F3E2}  Organization Name & Metadata", value: "org" },
      { name: "\u{1F3A8}  Branding Theme & Accent Color", value: "theme" },
      { name: "\u{1F4CC}  Navbar Portal Navigation Sections", value: "navbar" },
      { name: "\u{1F5C4}\uFE0F   Database Connection URL", value: "db" },
      { name: "\u{1F510}  Admin Dashboard Credentials", value: "auth" }
    ]
  });
  const updates = {};
  let newNavbarSections = void 0;
  if (setting === "org") {
    updates["ORG_NAME"] = await (0, import_prompts2.input)({
      message: "Organization Name:",
      default: currentEnv["ORG_NAME"] || "My Community Org"
    });
    updates["GITHUB_ORG_NAME"] = await (0, import_prompts2.input)({
      message: "GitHub Organization / Username:",
      default: currentEnv["GITHUB_ORG_NAME"] || "c2siorg"
    });
  } else if (setting === "theme") {
    updates["THEME_ACCENT"] = await (0, import_prompts2.select)({
      message: `Current theme: ${import_chalk4.default.hex(currentEnv["THEME_ACCENT"] || "#7B8CFF")("\u25A0")} ${currentEnv["THEME_ACCENT"] || "#7B8CFF"}
Select new accent color:`,
      choices: [
        { name: `${import_chalk4.default.hex("#0052CC")("\u25A0")} Ocean Blue      (#0052CC)`, value: "#0052CC" },
        { name: `${import_chalk4.default.hex("#10B981")("\u25A0")} Emerald Green   (#10B981)`, value: "#10B981" },
        { name: `${import_chalk4.default.hex("#7C3AED")("\u25A0")} Deep Purple      (#7C3AED)`, value: "#7C3AED" },
        { name: `${import_chalk4.default.hex("#EF4444")("\u25A0")} Sunset Crimson   (#EF4444)`, value: "#EF4444" },
        { name: `${import_chalk4.default.hex("#F59E0B")("\u25A0")} Amber Gold       (#F59E0B)`, value: "#F59E0B" },
        { name: `${import_chalk4.default.hex("#EC4899")("\u25A0")} Rose Pink        (#EC4899)`, value: "#EC4899" }
      ]
    });
  } else if (setting === "navbar") {
    const selected = await (0, import_prompts2.checkbox)({
      message: "Which navbar sections should be active?",
      choices: ALL_NAVBAR_SECTIONS,
      instructions: import_chalk4.default.gray("  Space to toggle \xB7 A to select all \xB7 Enter to confirm")
    });
    newNavbarSections = ["home", ...selected.filter((s) => s !== "home")];
  } else if (setting === "db") {
    updates["DATABASE_URL"] = await (0, import_prompts2.input)({
      message: "PostgreSQL Connection URL:",
      default: currentEnv["DATABASE_URL"] || "postgresql://postgres:postgres@localhost:5433/webiu_db"
    });
  } else if (setting === "auth") {
    updates["ADMIN_USERNAME"] = await (0, import_prompts2.input)({
      message: "Admin Username:",
      default: currentEnv["ADMIN_USERNAME"] || "admin"
    });
    updates["ADMIN_PASSWORD"] = await (0, import_prompts2.password)({
      message: "New Admin Password (min 8 characters):",
      validate: (v) => v.length >= 8 ? true : "Password must be at least 8 characters."
    });
  }
  const spinner = (0, import_ora2.default)({ text: "Writing updated configuration across portal...", color: "cyan" }).start();
  try {
    if (await import_fs_extra3.default.pathExists(rootEnvPath)) {
      let envContent = await import_fs_extra3.default.readFile(rootEnvPath, "utf-8");
      for (const [key, val] of Object.entries(updates)) {
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`^${escapedKey}=.*$`, "m");
        const newLine = `${key}="${val}"`;
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, newLine);
        } else {
          envContent += `
${newLine}`;
        }
      }
      await import_fs_extra3.default.writeFile(rootEnvPath, envContent);
    }
    if (await import_fs_extra3.default.pathExists(serverEnvPath)) {
      let serverEnv = await import_fs_extra3.default.readFile(serverEnvPath, "utf-8");
      for (const [key, val] of Object.entries(updates)) {
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`^${escapedKey}=.*$`, "m");
        const newLine = `${key}="${val}"`;
        if (regex.test(serverEnv)) {
          serverEnv = serverEnv.replace(regex, newLine);
        } else {
          serverEnv += `
${newLine}`;
        }
      }
      await import_fs_extra3.default.writeFile(serverEnvPath, serverEnv);
    }
    if (await import_fs_extra3.default.pathExists(uiConfigPath)) {
      const config = await import_fs_extra3.default.readJson(uiConfigPath);
      if (updates["ORG_NAME"]) config.orgName = updates["ORG_NAME"];
      if (updates["GITHUB_ORG_NAME"]) config.githubOrg = updates["GITHUB_ORG_NAME"];
      if (updates["THEME_ACCENT"]) config.themeAccent = updates["THEME_ACCENT"];
      if (newNavbarSections) config.navbarSections = newNavbarSections;
      await import_fs_extra3.default.writeJson(uiConfigPath, config, { spaces: 2 });
    }
    if (updates["THEME_ACCENT"]) {
      const stylesPath = import_path3.default.join(process.cwd(), "webiu-ui", "src", "styles.scss");
      if (await import_fs_extra3.default.pathExists(stylesPath)) {
        let styles = await import_fs_extra3.default.readFile(stylesPath, "utf-8");
        const accent = updates["THEME_ACCENT"];
        styles = styles.replace(/--theme-accent:\s*#[0-9A-Fa-f]{6};/, `--theme-accent:       ${accent};`);
        styles = styles.replace(/--theme-accent-dim:\s*rgba\(.*?\);/, `--theme-accent-dim:   ${accent}26;`);
        styles = styles.replace(/--theme-accent-glow:\s*.*?;/, `--theme-accent-glow:  0 0 24px ${accent}40;`);
        await import_fs_extra3.default.writeFile(stylesPath, styles);
      }
    }
    const appConfigPath = import_path3.default.join(process.cwd(), "webiu-ui", "src", "app", "services", "app-config.service.ts");
    if (await import_fs_extra3.default.pathExists(appConfigPath)) {
      let code = await import_fs_extra3.default.readFile(appConfigPath, "utf-8");
      if (updates["THEME_ACCENT"]) {
        code = code.replace(/themeAccent:\s*'#[0-9A-Fa-f]{6}'/, `themeAccent: '${updates["THEME_ACCENT"]}'`);
      }
      if (updates["ORG_NAME"]) {
        code = code.replace(/orgName:\s*'.*?'/, `orgName: '${updates["ORG_NAME"]}'`);
      }
      if (newNavbarSections) {
        code = code.replace(/navbarSections:\s*\[.*?\]/s, `navbarSections: ${JSON.stringify(newNavbarSections)}`);
      }
      await import_fs_extra3.default.writeFile(appConfigPath, code);
    }
    if (newNavbarSections) {
      const navTsPath = import_path3.default.join(process.cwd(), "webiu-ui", "src", "app", "components", "navbar", "navbar.component.ts");
      if (await import_fs_extra3.default.pathExists(navTsPath)) {
        let navTs = await import_fs_extra3.default.readFile(navTsPath, "utf-8");
        navTs = navTs.replace(/showProjects\s*=\s*(true|false);/, `showProjects = ${newNavbarSections.includes("projects")};`);
        navTs = navTs.replace(/showPublications\s*=\s*(true|false);/, `showPublications = ${newNavbarSections.includes("publications")};`);
        navTs = navTs.replace(/showContributors\s*=\s*(true|false);/, `showContributors = ${newNavbarSections.includes("contributors")};`);
        navTs = navTs.replace(/showCommunity\s*=\s*(true|false);/, `showCommunity = ${newNavbarSections.includes("community")};`);
        navTs = navTs.replace(/showOpportunities\s*=\s*(true|false);/, `showOpportunities = ${newNavbarSections.includes("opportunities")};`);
        navTs = navTs.replace(/showGsoc\s*=\s*(true|false);/, `showGsoc = ${newNavbarSections.includes("gsoc")};`);
        await import_fs_extra3.default.writeFile(navTsPath, navTs);
      }
    }
    if (updates["ORG_NAME"]) {
      const orgName = updates["ORG_NAME"];
      const indexPath = import_path3.default.join(process.cwd(), "webiu-ui", "src", "index.html");
      if (await import_fs_extra3.default.pathExists(indexPath)) {
        let html = await import_fs_extra3.default.readFile(indexPath, "utf-8");
        html = html.replace(/<title>.*?<\/title>/, `<title>${orgName} \u2014 Community Portal</title>`);
        await import_fs_extra3.default.writeFile(indexPath, html);
      }
      const homepagePath = import_path3.default.join(process.cwd(), "webiu-ui", "src", "app", "page", "homepage", "homepage.component.html");
      if (await import_fs_extra3.default.pathExists(homepagePath)) {
        let hp = await import_fs_extra3.default.readFile(homepagePath, "utf-8");
        const words = orgName.toUpperCase().split(/\s+/).filter(Boolean);
        const midpoint = Math.ceil(words.length / 2);
        const row1Words = words.slice(0, midpoint);
        const row2Words = words.slice(midpoint);
        const buildSpan = (w, i, dim = false) => `<span class="hero-word hero-word--${i + 1}${dim ? " hero-word--dim" : ""}">${w}</span>`;
        const r1 = row1Words.map((w, i) => buildSpan(w, i)).join("\n          ");
        const r2 = row2Words.map((w, i) => buildSpan(w, row1Words.length + i, i === row2Words.length - 1)).join("\n          ");
        const newTitle = `<h1 class="hero-title" appRevealOnScroll [immediate]="true" direction="center">
        <div class="hero-title-row">
          ${r1}
        </div>${row2Words.length > 0 ? `
        <div class="hero-title-row">
          ${r2}
        </div>` : ""}
        <span class="hero-handwritten-note">
          <svg class="handwritten-arrow" width="34" height="24" viewBox="0 0 34 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 23C8.5 19 18.5 10 27 1M27 1H17M27 1V9" stroke="var(--arrow-stroke-color)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Open Science Lab
        </span>
      </h1>`;
        hp = hp.replace(/<h1 class="hero-title"[\s\S]*?<\/h1>/, newTitle);
        await import_fs_extra3.default.writeFile(homepagePath, hp);
      }
    }
    spinner.succeed(import_chalk4.default.green("  \u2714 Configuration updated successfully!"));
    console.log(`
  ${import_chalk4.default.bold("Changes applied:")}`);
    for (const [key, val] of Object.entries(updates)) {
      const displayVal = key.includes("PASSWORD") ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : val;
      console.log(`    ${import_chalk4.default.gray(key)} \u2192 ${import_chalk4.default.cyan(displayVal)}`);
    }
    if (newNavbarSections) {
      console.log(`    ${import_chalk4.default.gray("NAVBAR_SECTIONS")} \u2192 ${import_chalk4.default.cyan(newNavbarSections.join(", "))}`);
    }
    console.log("");
  } catch (err) {
    spinner.fail(import_chalk4.default.red("  \u2718 Failed to update configuration."));
    console.error(err);
  }
}

// src-cli/commands/deploy.ts
var import_prompts3 = require("@inquirer/prompts");
var import_chalk5 = __toESM(require("chalk"));
var import_ora3 = __toESM(require("ora"));
var import_fs_extra4 = __toESM(require("fs-extra"));
var import_path4 = __toESM(require("path"));
async function deployCommand() {
  console.log(`
${import_chalk5.default.bold.cyan("====================================================")}`);
  console.log(`${import_chalk5.default.bold.yellow("      Webiu Interactive Deployment Generator       ")}`);
  console.log(`${import_chalk5.default.bold.cyan("====================================================")}
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
      await import_fs_extra4.default.writeFile(import_path4.default.join(process.cwd(), "render.yaml"), renderYaml);
      spinner.succeed(import_chalk5.default.green("Generated render.yaml successfully! XD"));
      console.log(`
${import_chalk5.default.bold.yellow("Next Steps for Render:")}`);
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
      await import_fs_extra4.default.writeFile(import_path4.default.join(process.cwd(), "docker-compose.prod.yml"), dockerProd);
      spinner.succeed(import_chalk5.default.green("Generated docker-compose.prod.yml successfully! :D"));
      console.log(`
${import_chalk5.default.bold.yellow("Next Steps for Docker:")}`);
      console.log(`  1. Run ${import_chalk5.default.cyan("docker compose -f docker-compose.prod.yml up -d")}`);
      console.log("  2. Access your portal at http://localhost\n");
    } else {
      spinner.succeed(import_chalk5.default.green(`Prepared deployment instructions for ${platform}!`));
    }
  } catch (err) {
    spinner.fail(import_chalk5.default.red("Failed to generate deployment templates."));
    console.error(err);
  }
}

// src-cli/commands/help.ts
var import_chalk6 = __toESM(require("chalk"));
init_constants();
function helpCommand() {
  console.log(`
${import_chalk6.default.bold.hex("#7B8CFF")("\u256D\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256E")}
${import_chalk6.default.bold.hex("#7B8CFF")("\u2502")}  ${import_chalk6.default.bold.white("WEBIU CLI")}  ${import_chalk6.default.gray(`v${VERSION}`)}  ${import_chalk6.default.hex("#7B8CFF")("\xB7")}  ${import_chalk6.default.gray("by Ceylon Computer Science Institute")}        ${import_chalk6.default.bold.hex("#7B8CFF")("\u2502")}
${import_chalk6.default.bold.hex("#7B8CFF")("\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256F")}

${import_chalk6.default.bold("Usage:")} ${import_chalk6.default.cyan("webiu")} ${import_chalk6.default.gray("[command]")}

${import_chalk6.default.bold.green("Commands:")}
  ${import_chalk6.default.bold.cyan("init")}            Interactively initialize a new Webiu portal project
  ${import_chalk6.default.bold.cyan("dev")}             Start local development servers (Frontend + Backend)
  ${import_chalk6.default.bold.cyan("build")}           Build production assets for webiu-ui and webiu-server
  ${import_chalk6.default.bold.cyan("config")}          Re-configure org, theme, DB, or admin credentials
  ${import_chalk6.default.bold.cyan("deploy")}          Generate deployment files (Render, Railway, Vercel, Docker)
  ${import_chalk6.default.bold.cyan("docker:up")}       Start local Docker containers (PostgreSQL DB)
  ${import_chalk6.default.bold.cyan("docker:down")}     Stop and remove local Docker containers
  ${import_chalk6.default.bold.cyan("help")}            Display this help manual

${import_chalk6.default.bold.green("Flags:")}
  ${import_chalk6.default.bold.cyan("-V, --version")}   Output the current CLI version
  ${import_chalk6.default.bold.cyan("-h, --help")}      Display help information

${import_chalk6.default.bold.magenta("Examples:")}
  ${import_chalk6.default.gray("$")} ${import_chalk6.default.cyan("webiu init")}
  ${import_chalk6.default.gray("$")} ${import_chalk6.default.cyan("webiu dev")}
  ${import_chalk6.default.gray("$")} ${import_chalk6.default.cyan("webiu config")}
  ${import_chalk6.default.gray("$")} ${import_chalk6.default.cyan("webiu deploy")}
  ${import_chalk6.default.gray("$")} ${import_chalk6.default.cyan("webiu -V")}

${import_chalk6.default.bold.green("URLs after webiu dev:")}
  ${import_chalk6.default.gray("Frontend UI \u2192")}  ${import_chalk6.default.underline.blue("http://localhost:4200")}
  ${import_chalk6.default.gray("Backend API \u2192")}  ${import_chalk6.default.underline.blue("http://localhost:5050")}

${import_chalk6.default.gray("Documentation:")} ${import_chalk6.default.underline.blue("https://github.com/c2siorg/Webiu")}
${import_chalk6.default.gray("Maintainers: Ceylon Computer Science Institute (C2SI)")}
`);
}

// src-cli/commands/docker.ts
var import_execa2 = require("execa");
var import_chalk7 = __toESM(require("chalk"));
async function dockerUpCommand() {
  console.log(`
${import_chalk7.default.bold.cyan("Starting Docker containerized environment... :D")}
`);
  try {
    await (0, import_execa2.execa)("docker", ["compose", "up", "-d"], { stdio: "inherit" });
    console.log(import_chalk7.default.green("\nDocker containers started successfully! XD"));
  } catch (err) {
    console.error(import_chalk7.default.red("Failed to start Docker containers:"), err);
  }
}
async function dockerDownCommand() {
  console.log(`
${import_chalk7.default.bold.cyan("Stopping Docker containerized environment...")}
`);
  try {
    await (0, import_execa2.execa)("docker", ["compose", "down"], { stdio: "inherit" });
    console.log(import_chalk7.default.green("\nDocker containers stopped cleanly."));
  } catch (err) {
    console.error(import_chalk7.default.red("Failed to stop Docker containers:"), err);
  }
}

// src-cli/index.ts
function handleGracefulExit() {
  console.log(`

  ${import_chalk8.default.bold.yellow("\u{1F44B} Goodbye!")} ${import_chalk8.default.gray("Operation cancelled by user.")}
`);
  process.exit(0);
}
process.on("SIGINT", handleGracefulExit);
process.on("unhandledRejection", (reason) => {
  if (reason && (reason.name === "ExitPromptError" || reason.message?.includes("force closed"))) {
    handleGracefulExit();
  } else {
    console.error(import_chalk8.default.red("\n  \u2718 Unexpected Error:"), reason);
    process.exit(1);
  }
});
var program = new import_commander.Command();
program.name("webiu").description("CLI tool to generate, configure, and deploy Webiu community portals").version("2.0.1", "-V, --version", "Output the current CLI version").addHelpCommand(false).helpOption("-h, --help", "Display command usage and instructions");
program.configureOutput({
  writeOut: (str) => {
    if (str.includes("Usage: webiu") || str.includes("Commands:") || str.includes("Options:")) {
      helpCommand();
    } else {
      process.stdout.write(str);
    }
  },
  writeErr: (str) => process.stderr.write(str)
});
program.command("init").description("Interactively initialize a new Webiu portal project").option("-n, --name <name>", "Project directory name (skip prompt)").action(initCommand);
program.command("dev").description("Start local development servers (Frontend + Backend concurrently)").action(devCommand);
program.command("build").description("Build production assets for both webiu-ui and webiu-server").action(buildCommand);
program.command("config").description("Re-configure organization metadata, branding, DB, or admin credentials").action(configCommand);
program.command("deploy").description("Launch interactive deployment generator for Render, Railway, Vercel, or Docker").action(deployCommand);
program.command("docker:up").description("Start local Docker containers (PostgreSQL database)").action(dockerUpCommand);
program.command("docker:down").description("Stop and remove local Docker containers").action(dockerDownCommand);
program.command("help").description("Display detailed command usage and instructions").action(helpCommand);
program.on("command:*", (operands) => {
  console.error(import_chalk8.default.red(`
  \u2718 Unknown command: "${operands[0]}"
`));
  helpCommand();
  process.exit(1);
});
if (process.argv.includes("-h") || process.argv.includes("--help")) {
  helpCommand();
  process.exit(0);
}
program.parse(process.argv);
if (!process.argv.slice(2).length) {
  helpCommand();
}
