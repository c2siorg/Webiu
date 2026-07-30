import { select, input, confirm, checkbox, password } from '@inquirer/prompts';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import execa from 'execa';
import { printCompactHeader } from '../utils/banner';

const ALL_NAVBAR_SECTIONS = [
  { name: '🏠 Home          (always included)', value: 'home', disabled: true },
  { name: '📁 Projects', value: 'projects', checked: true },
  { name: '📰 Publications', value: 'publications', checked: true },
  { name: '👥 Contributors', value: 'contributors', checked: true },
  { name: '🌐 Community', value: 'community', checked: true },
  { name: '💼 Opportunities', value: 'opportunities', checked: true },
  { name: '🎓 GSoC (Google Summer of Code)', value: 'gsoc', checked: true },
];

export async function configCommand() {
  printCompactHeader('webiu config — Interactive Configuration Manager');

  // Guard: must be inside a webiu project directory
  const rootEnvPath = path.join(process.cwd(), '.env');
  const serverEnvPath = path.join(process.cwd(), 'webiu-server', '.env');
  const uiConfigPath = path.join(process.cwd(), 'webiu-ui', 'src', 'assets', 'config.json');

  const isWebiuProject = await fs.pathExists(rootEnvPath) &&
    await fs.pathExists(path.join(process.cwd(), 'webiu-server')) &&
    await fs.pathExists(path.join(process.cwd(), 'webiu-ui'));

  if (!isWebiuProject) {
    console.error(chalk.red('\n  ✘ Not inside a Webiu project directory.'));
    console.error(chalk.yellow('  Please run this command from inside your project folder (e.g. cd my-webiu-portal)\n'));
    process.exit(1);
  }

  // Read current values from .env
  let currentEnv: Record<string, string> = {};
  try {
    const envContent = await fs.readFile(rootEnvPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      if (line.startsWith('#') || !line.includes('=')) continue;
      const eqIdx = line.indexOf('=');
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim().replace(/^"|"$/g, '');
      currentEnv[key] = val;
    }
  } catch {
    console.error(chalk.yellow('  Could not read .env — starting fresh.\n'));
  }

  const setting = await select({
    message: 'What would you like to re-configure?',
    choices: [
      { name: '🏢  Organization Name & Metadata', value: 'org' },
      { name: '🎨  Branding Theme & Accent Color', value: 'theme' },
      { name: '📌  Navbar Portal Navigation Sections', value: 'navbar' },
      { name: '🗄️   Database Connection URL', value: 'db' },
      { name: '🔐  Admin Dashboard Credentials', value: 'auth' },
    ],
  });

  const updates: Record<string, any> = {};
  let newNavbarSections: string[] | undefined = undefined;

  if (setting === 'org') {
    updates['ORG_NAME'] = await input({
      message: 'Organization Name:',
      default: currentEnv['ORG_NAME'] || 'My Community Org',
    });
    updates['GITHUB_ORG_NAME'] = await input({
      message: 'GitHub Organization / Username:',
      default: currentEnv['GITHUB_ORG_NAME'] || 'c2siorg',
    });

  } else if (setting === 'theme') {
    updates['THEME_ACCENT'] = await select({
      message: `Current theme: ${chalk.hex(currentEnv['THEME_ACCENT'] || '#7B8CFF')('■')} ${currentEnv['THEME_ACCENT'] || '#7B8CFF'}\nSelect new accent color:`,
      choices: [
        { name: `${chalk.hex('#0052CC')('■')} Ocean Blue      (#0052CC)`, value: '#0052CC' },
        { name: `${chalk.hex('#10B981')('■')} Emerald Green   (#10B981)`, value: '#10B981' },
        { name: `${chalk.hex('#7C3AED')('■')} Deep Purple      (#7C3AED)`, value: '#7C3AED' },
        { name: `${chalk.hex('#EF4444')('■')} Sunset Crimson   (#EF4444)`, value: '#EF4444' },
        { name: `${chalk.hex('#F59E0B')('■')} Amber Gold       (#F59E0B)`, value: '#F59E0B' },
        { name: `${chalk.hex('#EC4899')('■')} Rose Pink        (#EC4899)`, value: '#EC4899' },
      ],
    });

  } else if (setting === 'navbar') {
    const selected = await checkbox({
      message: 'Which navbar sections should be active?',
      choices: ALL_NAVBAR_SECTIONS,
      instructions: chalk.gray('  Space to toggle · A to select all · Enter to confirm'),
    });
    newNavbarSections = ['home', ...selected.filter((s: string) => s !== 'home')];

  } else if (setting === 'db') {
    updates['DATABASE_URL'] = await input({
      message: 'PostgreSQL Connection URL:',
      default: currentEnv['DATABASE_URL'] || 'postgresql://postgres:postgres@localhost:5433/webiu_db',
    });

  } else if (setting === 'auth') {
    updates['ADMIN_USERNAME'] = await input({
      message: 'Admin Username:',
      default: currentEnv['ADMIN_USERNAME'] || 'admin',
    });
    updates['ADMIN_PASSWORD'] = await password({
      message: 'New Admin Password (min 8 characters):',
      validate: (v) => v.length >= 8 ? true : 'Password must be at least 8 characters.',
    });
  }

  const spinner = ora({ text: 'Writing updated configuration across portal...', color: 'cyan' }).start();

  try {
    // --- Update root .env ---
    if (await fs.pathExists(rootEnvPath)) {
      let envContent = await fs.readFile(rootEnvPath, 'utf-8');
      for (const [key, val] of Object.entries(updates)) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        const newLine = `${key}="${val}"`;
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, newLine);
        } else {
          envContent += `\n${newLine}`;
        }
      }
      await fs.writeFile(rootEnvPath, envContent);
    }

    // --- Update webiu-server/.env ---
    if (await fs.pathExists(serverEnvPath)) {
      let serverEnv = await fs.readFile(serverEnvPath, 'utf-8');
      for (const [key, val] of Object.entries(updates)) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        const newLine = `${key}="${val}"`;
        if (regex.test(serverEnv)) {
          serverEnv = serverEnv.replace(regex, newLine);
        } else {
          serverEnv += `\n${newLine}`;
        }
      }
      await fs.writeFile(serverEnvPath, serverEnv);
    }

    // --- Update webiu-ui/src/assets/config.json ---
    if (await fs.pathExists(uiConfigPath)) {
      const config = await fs.readJson(uiConfigPath);
      if (updates['ORG_NAME'])       config.orgName     = updates['ORG_NAME'];
      if (updates['GITHUB_ORG_NAME']) config.githubOrg  = updates['GITHUB_ORG_NAME'];
      if (updates['THEME_ACCENT'])   config.themeAccent = updates['THEME_ACCENT'];
      if (newNavbarSections)        config.navbarSections = newNavbarSections;
      await fs.writeJson(uiConfigPath, config, { spaces: 2 });
    }

    // --- Update webiu-ui/src/styles.scss ---
    if (updates['THEME_ACCENT']) {
      const stylesPath = path.join(process.cwd(), 'webiu-ui', 'src', 'styles.scss');
      if (await fs.pathExists(stylesPath)) {
        let styles = await fs.readFile(stylesPath, 'utf-8');
        const accent = updates['THEME_ACCENT'];
        styles = styles.replace(/--theme-accent:\s*#[0-9A-Fa-f]{6};/, `--theme-accent:       ${accent};`);
        styles = styles.replace(/--theme-accent-dim:\s*rgba\(.*?\);/, `--theme-accent-dim:   ${accent}26;`);
        styles = styles.replace(/--theme-accent-glow:\s*.*?;/, `--theme-accent-glow:  0 0 24px ${accent}40;`);
        await fs.writeFile(stylesPath, styles);
      }
    }

    // --- Patch app-config.service.ts DEFAULT_CONFIG ---
    const appConfigPath = path.join(process.cwd(), 'webiu-ui', 'src', 'app', 'services', 'app-config.service.ts');
    if (await fs.pathExists(appConfigPath)) {
      let code = await fs.readFile(appConfigPath, 'utf-8');
      if (updates['THEME_ACCENT']) {
        code = code.replace(/themeAccent:\s*'#[0-9A-Fa-f]{6}'/, `themeAccent: '${updates['THEME_ACCENT']}'`);
      }
      if (updates['ORG_NAME']) {
        code = code.replace(/orgName:\s*'.*?'/, `orgName: '${updates['ORG_NAME']}'`);
      }
      if (newNavbarSections) {
        code = code.replace(/navbarSections:\s*\[.*?\]/s, `navbarSections: ${JSON.stringify(newNavbarSections)}`);
      }
      await fs.writeFile(appConfigPath, code);
    }

    // --- Update navbar.component.ts section flags if navbar sections changed ---
    if (newNavbarSections) {
      const navTsPath = path.join(process.cwd(), 'webiu-ui', 'src', 'app', 'components', 'navbar', 'navbar.component.ts');
      if (await fs.pathExists(navTsPath)) {
        let navTs = await fs.readFile(navTsPath, 'utf-8');
        navTs = navTs.replace(/showProjects\s*=\s*(true|false);/, `showProjects = ${newNavbarSections.includes('projects')};`);
        navTs = navTs.replace(/showPublications\s*=\s*(true|false);/, `showPublications = ${newNavbarSections.includes('publications')};`);
        navTs = navTs.replace(/showContributors\s*=\s*(true|false);/, `showContributors = ${newNavbarSections.includes('contributors')};`);
        navTs = navTs.replace(/showCommunity\s*=\s*(true|false);/, `showCommunity = ${newNavbarSections.includes('community')};`);
        navTs = navTs.replace(/showOpportunities\s*=\s*(true|false);/, `showOpportunities = ${newNavbarSections.includes('opportunities')};`);
        navTs = navTs.replace(/showGsoc\s*=\s*(true|false);/, `showGsoc = ${newNavbarSections.includes('gsoc')};`);
        await fs.writeFile(navTsPath, navTs);
      }
    }

    // --- Update index.html title and homepage hero title if org name changed ---
    if (updates['ORG_NAME']) {
      const orgName = updates['ORG_NAME'];
      const indexPath = path.join(process.cwd(), 'webiu-ui', 'src', 'index.html');
      if (await fs.pathExists(indexPath)) {
        let html = await fs.readFile(indexPath, 'utf-8');
        html = html.replace(/<title>.*?<\/title>/, `<title>${orgName} — Community Portal</title>`);
        await fs.writeFile(indexPath, html);
      }

      const homepagePath = path.join(process.cwd(), 'webiu-ui', 'src', 'app', 'page', 'homepage', 'homepage.component.html');
      if (await fs.pathExists(homepagePath)) {
        let hp = await fs.readFile(homepagePath, 'utf-8');
        const words = orgName.toUpperCase().split(/\s+/).filter(Boolean);
        const midpoint = Math.ceil(words.length / 2);
        const row1Words = words.slice(0, midpoint);
        const row2Words = words.slice(midpoint);
        const buildSpan = (w: string, i: number, dim = false) => `<span class="hero-word hero-word--${i + 1}${dim ? ' hero-word--dim' : ''}">${w}</span>`;
        const r1 = row1Words.map((w, i) => buildSpan(w, i)).join('\n          ');
        const r2 = row2Words.map((w, i) => buildSpan(w, row1Words.length + i, i === row2Words.length - 1)).join('\n          ');
        const newTitle = `<h1 class="hero-title" appRevealOnScroll [immediate]="true" direction="center">
        <div class="hero-title-row">
          ${r1}
        </div>${row2Words.length > 0 ? `
        <div class="hero-title-row">
          ${r2}
        </div>` : ''}
        <span class="hero-handwritten-note">
          <svg class="handwritten-arrow" width="34" height="24" viewBox="0 0 34 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 23C8.5 19 18.5 10 27 1M27 1H17M27 1V9" stroke="var(--arrow-stroke-color)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Open Science Lab
        </span>
      </h1>`;
        hp = hp.replace(/<h1 class="hero-title"[\s\S]*?<\/h1>/, newTitle);
        await fs.writeFile(homepagePath, hp);
      }
    }

    spinner.succeed(chalk.green('  ✔ Configuration updated successfully!'));

    console.log(`\n  ${chalk.bold('Changes applied:')}`);
    for (const [key, val] of Object.entries(updates)) {
      const displayVal = key.includes('PASSWORD') ? '••••••••' : val;
      console.log(`    ${chalk.gray(key)} → ${chalk.cyan(displayVal)}`);
    }
    if (newNavbarSections) {
      console.log(`    ${chalk.gray('NAVBAR_SECTIONS')} → ${chalk.cyan(newNavbarSections.join(', '))}`);
    }
    console.log('');

  } catch (err: any) {
    spinner.fail(chalk.red('  ✘ Failed to update configuration.'));
    console.error(err);
  }
}
