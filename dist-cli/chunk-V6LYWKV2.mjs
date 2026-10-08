// src-cli/commands/dev.ts
import concurrently from "concurrently";
import chalk2 from "chalk";
import path from "path";
import fs from "fs-extra";
import net from "net";

// src-cli/utils/banner.ts
import chalk from "chalk";
import gradient from "gradient-string";
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
  const width = 58;
  const border = chalk.hex("#7B8CFF")("\u2500".repeat(width));
  const corner = chalk.hex("#7B8CFF");
  console.log(corner("\u256D") + border + corner("\u256E"));
  const row = (label, value) => {
    const content = `  ${chalk.bold.gray(label.padEnd(16))} ${chalk.white(value)}`;
    const visibleLen = label.length + 18 + value.length;
    const pad = Math.max(0, width - visibleLen);
    console.log(corner("\u2502") + content + " ".repeat(pad) + corner("\u2502"));
  };
  row("Version", `v${VERSION}`);
  row("CLI Package", "create-webiu");
  row("Docs", "github.com/c2siorg/Webiu");
  row("Org", "Ceylon Computer Science Institute");
  console.log(corner("\u251C") + border + corner("\u2524"));
  const tip = `  ${chalk.yellow("\u26A1")} ${chalk.gray("Tip: Press")} ${chalk.bold.white("\u2191 \u2193")} ${chalk.gray("to navigate options,")} ${chalk.bold.white("Enter")} ${chalk.gray("to select")}`;
  console.log(corner("\u2502") + tip + " ".repeat(Math.max(0, width - 52)) + corner("\u2502"));
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
  printCompactHeader,
  devCommand,
  buildCommand
};
