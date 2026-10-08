import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import https from 'https';
import { VERSION } from '../constants';

const CACHE_DIR = path.join(os.homedir(), '.config', 'webiu');
const CACHE_FILE = path.join(CACHE_DIR, 'update-check.json');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface UpdateCache {
  lastChecked: number;
  latestVersion: string;
}

/**
 * Compare two semver strings (simple major.minor.patch).
 * Returns true if candidate is newer than current.
 */
function isNewerVersion(current: string, candidate: string): boolean {
  const cParts = current.split('.').map((p) => parseInt(p, 10) || 0);
  const vParts = candidate.split('.').map((p) => parseInt(p, 10) || 0);

  for (let i = 0; i < 3; i++) {
    if ((vParts[i] || 0) > (cParts[i] || 0)) return true;
    if ((vParts[i] || 0) < (cParts[i] || 0)) return false;
  }
  return false;
}

/**
 * Fetch latest version string from npm registry with a 1.5s timeout.
 */
function fetchLatestNpmVersion(): Promise<string | null> {
  return new Promise((resolve) => {
    const req = https.get('https://registry.npmjs.org/create-webiu/latest', { timeout: 1500 }, (res) => {
      if (res.statusCode !== 200) {
        resolve(null);
        return;
      }
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed.version || null);
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

/**
 * Checks for updates in the background using local 24h caching.
 */
export async function checkForUpdates(): Promise<string | null> {
  try {
    await fs.ensureDir(CACHE_DIR);

    let cache: UpdateCache | null = null;
    if (await fs.pathExists(CACHE_FILE)) {
      try {
        cache = await fs.readJson(CACHE_FILE);
      } catch {
        cache = null;
      }
    }

    const now = Date.now();
    if (cache && now - cache.lastChecked < CACHE_TTL_MS && cache.latestVersion) {
      return isNewerVersion(VERSION, cache.latestVersion) ? cache.latestVersion : null;
    }

    const latest = await fetchLatestNpmVersion();
    if (latest) {
      await fs.writeJson(CACHE_FILE, {
        lastChecked: now,
        latestVersion: latest,
      }, { spaces: 2 });

      return isNewerVersion(VERSION, latest) ? latest : null;
    }
  } catch {
    // Fail silently so update checks never crash CLI execution
  }
  return null;
}

/**
 * Displays an aesthetic update notification card if a newer version is available.
 */
export function displayUpdateBanner(latestVersion: string): void {
  const border = chalk.hex('#7B8CFF')('─────────────────────────────────────────────────────────────');
  const line1 = `  ${chalk.bold.yellow('⚡ Update available!')} ${chalk.gray(`v${VERSION}`)} → ${chalk.bold.green(`v${latestVersion}`)}`;
  const line2 = `  ${chalk.gray('Run:')} ${chalk.bold.cyan('npm install -g create-webiu')} ${chalk.gray('to update to latest')}`;

  console.log(`\n╭${border}╮`);
  console.log(`│${line1.padEnd(76)}│`);
  console.log(`│${line2.padEnd(78)}│`);
  console.log(`╰${border}╯\n`);
}
