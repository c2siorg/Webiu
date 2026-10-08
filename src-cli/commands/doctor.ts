import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import net from 'net';
import execa from 'execa';
import { printCompactHeader } from '../utils/banner';

interface DiagnosticResult {
  title: string;
  status: 'ok' | 'warn' | 'error';
  message: string;
  fix?: string;
}

function probePort(port: number, host = '127.0.0.1', timeout = 1200): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
    socket.once('error', () => { socket.destroy(); resolve(false); });
    socket.connect(port, host);
  });
}

function parseDatabaseUrl(url: string): { host: string; port: number } | null {
  try {
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

export async function doctorCommand() {
  printCompactHeader('webiu doctor — Homebrew-Style Self-Diagnostics');

  console.log(chalk.gray('  Running system and project diagnostic checks...\n'));

  const results: DiagnosticResult[] = [];

  // 1. Node.js Version Check
  const nodeVer = process.version;
  const majorNode = parseInt(nodeVer.replace(/^v/, '').split('.')[0], 10) || 0;
  if (majorNode >= 18) {
    results.push({
      title: 'Node.js Version',
      status: 'ok',
      message: `Node.js ${nodeVer} detected (>= v18.0.0 required)`,
    });
  } else {
    results.push({
      title: 'Node.js Version',
      status: 'error',
      message: `Node.js ${nodeVer} is outdated (>= v18.0.0 required)`,
      fix: 'Upgrade Node.js from https://nodejs.org or using nvm (nvm install 20)',
    });
  }

  // 2. npm Package Manager Check
  try {
    const { stdout: npmVer } = await execa('npm', ['--version']);
    results.push({
      title: 'npm Package Manager',
      status: 'ok',
      message: `npm v${npmVer.trim()} installed and available`,
    });
  } catch {
    results.push({
      title: 'npm Package Manager',
      status: 'error',
      message: 'npm command not found in system PATH',
      fix: 'Install npm alongside Node.js from https://nodejs.org',
    });
  }

  // 3. Git Availability Check
  try {
    const { stdout: gitVer } = await execa('git', ['--version']);
    results.push({
      title: 'Git Version Control',
      status: 'ok',
      message: `${gitVer.trim()} installed`,
    });
  } catch {
    results.push({
      title: 'Git Version Control',
      status: 'error',
      message: 'Git CLI not found in system PATH',
      fix: 'Install Git from https://git-scm.com to allow project scaffolding',
    });
  }

  // 4. Docker Engine Check
  try {
    await execa('docker', ['info'], { stdio: 'ignore' });
    results.push({
      title: 'Docker Engine',
      status: 'ok',
      message: 'Docker daemon is running and responsive',
    });
  } catch {
    results.push({
      title: 'Docker Engine',
      status: 'warn',
      message: 'Docker daemon is not running or not installed',
      fix: 'Start Docker Desktop or run PostgreSQL natively (webiu docker:up)',
    });
  }

  // 5. Webiu Project Workspace Detection
  const rootDir = process.cwd();
  const serverDir = path.join(rootDir, 'webiu-server');
  const uiDir = path.join(rootDir, 'webiu-ui');
  const envPath = path.join(rootDir, '.env');

  const isProject = await fs.pathExists(serverDir) && await fs.pathExists(uiDir);

  if (isProject) {
    results.push({
      title: 'Webiu Project Structure',
      status: 'ok',
      message: `Webiu project detected at ${chalk.cyan(rootDir)}`,
    });

    // 6. Framework Diagnostics (Angular & NestJS)
    const uiPkgPath = path.join(uiDir, 'package.json');
    if (await fs.pathExists(uiPkgPath)) {
      try {
        const uiPkg = await fs.readJson(uiPkgPath);
        const ngVer = uiPkg.dependencies?.['@angular/core'] || uiPkg.devDependencies?.['@angular/core'] || 'Unknown';
        results.push({
          title: 'Angular UI Framework',
          status: 'ok',
          message: `Angular Frontend detected (${chalk.bold(ngVer)})`,
        });
      } catch {}
    }

    const serverPkgPath = path.join(serverDir, 'package.json');
    if (await fs.pathExists(serverPkgPath)) {
      try {
        const serverPkg = await fs.readJson(serverPkgPath);
        const nestVer = serverPkg.dependencies?.['@nestjs/core'] || serverPkg.devDependencies?.['@nestjs/core'] || 'Unknown';
        results.push({
          title: 'NestJS Backend API',
          status: 'ok',
          message: `NestJS Server detected (${chalk.bold(nestVer)})`,
        });
      } catch {}
    }

    // 7. Database Reachability Check
    let dbHost = 'localhost';
    let dbPort = 5433;
    const serverEnvPath = path.join(serverDir, '.env');
    const targetEnvPath = await fs.pathExists(serverEnvPath) ? serverEnvPath : envPath;

    if (await fs.pathExists(targetEnvPath)) {
      const envContent = await fs.readFile(targetEnvPath, 'utf-8');
      const dbMatch = envContent.match(/^DATABASE_URL="?([^"\n]+)"?/m);
      if (dbMatch) {
        const parsed = parseDatabaseUrl(dbMatch[1]);
        if (parsed) {
          dbHost = parsed.host;
          dbPort = parsed.port;
        }
      }
    }

    const dbConnected = await probePort(dbPort, dbHost === 'localhost' ? '127.0.0.1' : dbHost);
    if (dbConnected) {
      results.push({
        title: 'PostgreSQL Database',
        status: 'ok',
        message: `PostgreSQL is reachable at ${dbHost}:${dbPort}`,
      });
    } else {
      results.push({
        title: 'PostgreSQL Database',
        status: 'warn',
        message: `Cannot reach PostgreSQL at ${dbHost}:${dbPort}`,
        fix: 'Run `webiu docker:up` or start your local PostgreSQL service',
      });
    }

    // 8. Environment & Security Config Verification
    if (await fs.pathExists(targetEnvPath)) {
      const envContent = await fs.readFile(targetEnvPath, 'utf-8');
      
      const adminPassMatch = envContent.match(/^ADMIN_PASSWORD="?([^"\n]+)"?/m);
      if (adminPassMatch && adminPassMatch[1] === 'admin') {
        results.push({
          title: 'Admin Credentials Security',
          status: 'warn',
          message: 'Admin dashboard password is using default fallback "admin"',
          fix: 'Run `webiu config` to set a strong custom admin password',
        });
      } else {
        results.push({
          title: 'Admin Credentials Security',
          status: 'ok',
          message: 'Custom admin credentials configured',
        });
      }

      const ghTokenMatch = envContent.match(/^GITHUB_TOKEN="?([^"\n]+)"?/m);
      if (!ghTokenMatch || !ghTokenMatch[1] || ghTokenMatch[1].includes('your_token')) {
        results.push({
          title: 'GitHub API Authentication',
          status: 'warn',
          message: 'GitHub API Token missing (rate limits may apply to research data)',
          fix: 'Add GITHUB_TOKEN="ghp_..." to webiu-server/.env to increase rate limits',
        });
      } else {
        results.push({
          title: 'GitHub API Authentication',
          status: 'ok',
          message: 'GitHub Personal Access Token configured',
        });
      }
    }

  } else {
    results.push({
      title: 'Webiu Project Workspace',
      status: 'warn',
      message: 'Not inside a Webiu project directory',
      fix: 'Navigate inside a project folder or create one with `webiu init`',
    });
  }

  // ── Render Homebrew-Style Output ─────────────────────────────────────────

  console.log(`${chalk.bold('System & Environment Diagnostics:')}\n`);

  for (const res of results) {
    const symbol = res.status === 'ok'
      ? chalk.bold.green('  ✓ ')
      : res.status === 'warn'
      ? chalk.bold.yellow('  ⚠ ')
      : chalk.bold.red('  ✘ ');

    const titleStr = chalk.bold(res.title.padEnd(30));
    console.log(`${symbol}${titleStr} ${chalk.gray(res.message)}`);
  }

  console.log('');

  const warnings = results.filter((r) => r.status === 'warn');
  const errors = results.filter((r) => r.status === 'error');

  if (warnings.length === 0 && errors.length === 0) {
    console.log(chalk.bold.green('  ✔ Your WebiU environment is healthy and ready to build and deploy!\n'));
  } else {
    console.log(chalk.bold.yellow('─────────────────────────────────────────────────────────────────────────────'));
    console.log(chalk.bold.yellow('  Suggested Remediation Steps:'));
    console.log(chalk.bold.yellow('─────────────────────────────────────────────────────────────────────────────\n'));

    let count = 1;
    for (const item of [...errors, ...warnings]) {
      if (item.fix) {
        console.log(`  ${chalk.bold.cyan(`${count}.`)} ${chalk.bold.white(item.title)}`);
        console.log(`     ${chalk.yellow('→')} ${item.fix}\n`);
        count++;
      }
    }
  }
}
