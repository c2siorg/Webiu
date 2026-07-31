import concurrently from 'concurrently';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import net from 'net';
import { printCompactHeader } from '../utils/banner';

/**
 * Check if a TCP port is reachable (i.e., something is listening on it).
 * Used to pre-flight check whether PostgreSQL / Docker DB is running.
 */
function isPortReachable(port: number, host = '127.0.0.1', timeout = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
    socket.once('error', () => { socket.destroy(); resolve(false); });
    socket.connect(port, host);
  });
}

/**
 * Extract host + port from a DATABASE_URL string.
 * e.g. "postgresql://user:pass@localhost:5433/db" → { host: 'localhost', port: 5433 }
 */
function parseDatabaseUrl(url: string): { host: string; port: number } | null {
  try {
    // Handle both postgresql:// and postgres://
    const normalized = url.replace(/^postgres:\/\//, 'postgresql://');
    const parsed = new URL(normalized);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port || '5432', 10),
    };
  } catch {
    return null;
  }
}

export async function devCommand() {
  printCompactHeader('webiu dev — Development Server');

  // Guard: check webiu-server and webiu-ui exist
  const serverDir = path.join(process.cwd(), 'webiu-server');
  const uiDir = path.join(process.cwd(), 'webiu-ui');

  if (!await fs.pathExists(serverDir) || !await fs.pathExists(uiDir)) {
    console.error(chalk.red('\n  ✘ webiu-server or webiu-ui directories not found!'));
    console.error(chalk.yellow('  Make sure you have run `webiu init` first and are inside your project directory.'));
    console.error(chalk.yellow(`  Expected: ${chalk.cyan(serverDir)}`));
    console.error(chalk.yellow(`  Expected: ${chalk.cyan(uiDir)}\n`));
    process.exit(1);
  }

  // Guard: check node_modules exist
  const serverModules = path.join(serverDir, 'node_modules');
  const uiModules = path.join(uiDir, 'node_modules');
  if (!await fs.pathExists(serverModules) || !await fs.pathExists(uiModules)) {
    console.error(chalk.red('\n  ✘ node_modules not found in webiu-server or webiu-ui!'));
    console.error(chalk.yellow('  Please run the following commands first:'));
    console.error(chalk.cyan('    cd webiu-server && npm install && cd ..'));
    console.error(chalk.cyan('    cd webiu-ui && npm install && cd ..\n'));
    process.exit(1);
  }

  // ── Pre-flight: Check database connectivity ─────────────────────────────
  const envPath = path.join(process.cwd(), 'webiu-server', '.env');
  let dbHost = 'localhost';
  let dbPort = 5433; // Default to the correct port

  if (await fs.pathExists(envPath)) {
    const envContent = await fs.readFile(envPath, 'utf-8');
    const dbUrlMatch = envContent.match(/^DATABASE_URL="?([^"\n]+)"?/m);
    if (dbUrlMatch) {
      const parsed = parseDatabaseUrl(dbUrlMatch[1]);
      if (parsed) {
        dbHost = parsed.host;
        dbPort = parsed.port;
      }
    }
  }

  console.log(chalk.gray(`  Checking database at ${dbHost}:${dbPort}...`));
  const dbReachable = await isPortReachable(dbPort, dbHost === 'localhost' ? '127.0.0.1' : dbHost);

  if (!dbReachable) {
    console.log('');
    console.log(chalk.yellow('  ⚠ Warning: Cannot reach the database!'));
    console.log(chalk.gray(`  Expected PostgreSQL at ${chalk.bold(`${dbHost}:${dbPort}`)}`));
    console.log('');
    console.log(chalk.bold('  To fix this, start your database first:'));
    console.log(chalk.cyan('    docker compose up -d'));
    console.log('');
    console.log(chalk.gray('  (Continuing anyway — backend will retry the connection automatically)'));
    console.log('');
  } else {
    console.log(chalk.green(`  ✔ Database reachable at ${dbHost}:${dbPort}`));
  }

  console.log('');
  console.log(chalk.gray(`  Backend API →  http://localhost:5050`));
  console.log(chalk.gray(`  Frontend UI →  http://localhost:4200`));
  console.log(chalk.gray('  Press Ctrl+C to stop all servers\n'));

  try {
    const { result } = concurrently(
      [
        {
          command: 'npm run start:dev',
          name: 'backend',
          cwd: serverDir,
          prefixColor: 'blue',
        },
        {
          command: 'npm start',
          name: 'frontend',
          cwd: uiDir,
          prefixColor: 'green',
        },
      ],
      {
        prefix: 'name',
        killOthersOn: ['failure'],
        restartTries: 0,
      }
    );

    await result;
  } catch (err) {
    console.error(chalk.red('\n  Development servers stopped unexpectedly:'), err);
  }
}

export async function buildCommand() {
  printCompactHeader('webiu build — Production Build');

  const serverDir = path.join(process.cwd(), 'webiu-server');
  const uiDir = path.join(process.cwd(), 'webiu-ui');

  if (!await fs.pathExists(serverDir) || !await fs.pathExists(uiDir)) {
    console.error(chalk.red('  ✘ webiu-server or webiu-ui not found. Run `webiu init` first.\n'));
    process.exit(1);
  }

  const execa = (await import('execa')).default;

  console.log(chalk.cyan('  Building NestJS backend...'));
  await execa('npm', ['run', 'build'], { cwd: serverDir, stdio: 'inherit' });

  console.log(chalk.cyan('\n  Building Angular frontend...'));
  await execa('npm', ['run', 'build'], { cwd: uiDir, stdio: 'inherit' });

  console.log(chalk.green('\n  ✔ Build complete!\n'));
}
