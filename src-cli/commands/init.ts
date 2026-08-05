import { select, input, checkbox, confirm, password } from '@inquirer/prompts';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import execa from 'execa';
import { printWelcomeBanner, printLiveSummaryCard, printFinalVictoryScreen } from '../utils/banner';
import { WEBIU_REPO, WEBIU_BRANCH, ALL_NAVBAR_SECTIONS } from '../constants';


export async function initCommand(options: { name?: string }) {
  // ── GREETING BANNER ────────────────────────────────────────────────────────
  printWelcomeBanner();

  console.log(`${chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}`);
  console.log(`${chalk.bold.yellow('  🚀 Project Setup Wizard — Answer a few questions to begin')}`);
  console.log(`${chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}\n`);

  // ── Step 1: Collect configuration via interactive prompts ──────────────────

  const summary: any = {};

  const projectName = options.name || await input({
    message: 'What is your project directory name?',
    default: 'my-webiu-portal',
  });
  // Guard: Path traversal protection
  const normalizedPath = path.normalize(projectName);
  if (normalizedPath.startsWith('..') || path.isAbsolute(projectName) || /[\\/]/.test(projectName)) {
    console.error(chalk.red('\n  ✘ Invalid project directory name. Path traversal characters (/, \\, ..) are not allowed.'));
    console.error(chalk.yellow('  Please provide a simple directory name (e.g. "my-webiu-portal").\n'));
    process.exit(1);
  }

  summary.projectName = projectName;
  printLiveSummaryCard(summary);

  const orgName = await input({
    message: 'What is your Organization Name?',
    default: 'My Community Org',
  });
  summary.orgName = orgName;
  printLiveSummaryCard(summary);

  const orgType = await select({
    message: 'Select your Organization Type:',
    choices: [
      { name: 'Open Source Community (e.g., C2SI, SugarLabs)', value: 'opensource' },
      { name: 'Non-Profit Organization', value: 'nonprofit' },
      { name: 'Startup / Personal Project', value: 'startup' },
      { name: 'Custom / Blank Setup', value: 'custom' },
    ],
  });
  summary.orgType = orgType;
  printLiveSummaryCard(summary);

  const githubOrg = await input({
    message: 'What is your GitHub Organization / User name?',
    default: 'c2siorg',
  });
  summary.githubOrg = githubOrg;
  printLiveSummaryCard(summary);

  const dbStrategy = await select({
    message: 'Select Database Setup Strategy:',
    choices: [
      { name: 'PostgreSQL Container  (Automatic local Docker DB - Recommended)', value: 'docker-postgres' },
      { name: 'Remote PostgreSQL     (Provide your own connection string URL)', value: 'remote-postgres' },
    ],
  });
  summary.dbStrategy = dbStrategy;
  printLiveSummaryCard(summary);

  let databaseUrl = 'postgresql://postgres:postgres@localhost:5433/webiu_db';
  if (dbStrategy === 'remote-postgres') {
    databaseUrl = await input({
      message: 'Enter your PostgreSQL Connection String URL:',
      default: databaseUrl,
    });
  }

  const themeAccent = await select({
    message: 'Select Primary UI Theme Accent Color:',
    choices: [
      { name: `${chalk.hex('#0052CC')('■')} Ocean Blue      (#0052CC)`, value: '#0052CC' },
      { name: `${chalk.hex('#10B981')('■')} Emerald Green   (#10B981)`, value: '#10B981' },
      { name: `${chalk.hex('#7C3AED')('■')} Deep Purple      (#7C3AED)`, value: '#7C3AED' },
      { name: `${chalk.hex('#EF4444')('■')} Sunset Crimson   (#EF4444)`, value: '#EF4444' },
      { name: `${chalk.hex('#F59E0B')('■')} Amber Gold       (#F59E0B)`, value: '#F59E0B' },
      { name: `${chalk.hex('#EC4899')('■')} Rose Pink        (#EC4899)`, value: '#EC4899' },
    ],
  });
  summary.themeAccent = themeAccent;
  printLiveSummaryCard(summary);

  const deployTarget = await select({
    message: 'Select Target Deployment Platform:',
    choices: [
      { name: 'Render              (Fullstack App + Postgres DB - Guided config)', value: 'render' },
      { name: 'Railway             (Instant container deployment)', value: 'railway' },
      { name: 'Vercel + Render     (Static Angular UI + NestJS API on Render)', value: 'vercel-render' },
      { name: 'Self-Hosted Docker  (Generates docker-compose.prod.yml)', value: 'docker' },
    ],
  });
  summary.deployTarget = deployTarget;
  printLiveSummaryCard(summary);

  // ── Step 2: Admin credentials ─────────────────────────────────────────────
  console.log(`\n${chalk.bold.gray('── Admin Account Setup ──────────────────────────────────')}\n`);

  const adminUsername = await input({
    message: 'Admin dashboard username:',
    default: 'admin',
  });
  summary.adminUsername = adminUsername;
  printLiveSummaryCard(summary);

  const adminPassword = await password({
    message: 'Admin dashboard password (min 8 characters):',
    validate: (val) => val.length >= 8 ? true : 'Password must be at least 8 characters.',
  });

  // ── Step 3: Navbar sections ───────────────────────────────────────────────
  console.log(`\n${chalk.bold.gray('── Portal Navigation ────────────────────────────────────')}\n`);

  const selectedSections = await checkbox({
    message: 'Which sections do you want in your portal\'s navbar?',
    choices: ALL_NAVBAR_SECTIONS,
    instructions: chalk.gray('  Space to toggle · A to select all · Enter to confirm'),
  });

  // Home is always forced — prepend it even if user somehow didn't get it
  const navbarSections = ['home', ...selectedSections.filter((s: string) => s !== 'home')];
  summary.navbarSections = navbarSections;
  printLiveSummaryCard(summary);

  // ── Step 4: Scaffold the project ──────────────────────────────────────────

  const projectDir = path.resolve(process.cwd(), projectName);

  // Check if target directory already exists and is non-empty
  if (await fs.pathExists(projectDir)) {
    const existing = await fs.readdir(projectDir);
    if (existing.length > 0) {
      console.log(chalk.red(`\n  ✘ Directory "${projectName}" already exists and is not empty.`));
      console.log(chalk.yellow('  Please choose an empty directory or delete the existing one.\n'));
      process.exit(1);
    }
  }

  await fs.ensureDir(projectDir);

  console.log('');
  const spinner = ora({
    text: `Cloning Webiu source code into "${chalk.cyan(projectName)}"...`,
    color: 'cyan',
  }).start();

  try {
    // ── Clone the Webiu repository ────────────────────────────────────────────
    await execa('git', [
      'clone',
      '--branch', WEBIU_BRANCH,
      '--single-branch',
      '--depth=1',
      WEBIU_REPO,
      projectDir,
    ], { stdio: 'pipe' });

    spinner.text = 'Injecting organization configuration...';

    // ── Generate a secure JWT secret ─────────────────────────────────────────
    const jwtSecret = crypto.randomBytes(32).toString('hex');

    // ── Write root .env ───────────────────────────────────────────────────────
    const rootEnvContent = [
      '# Generated by Webiu CLI — Do not commit this file to version control',
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
      `ADMIN_PASSWORD="${adminPassword}"`,
    ].join('\n');

    await fs.writeFile(path.join(projectDir, '.env'), rootEnvContent);

    // ── Write webiu-server/.env ───────────────────────────────────────────────
    const serverEnvPath = path.join(projectDir, 'webiu-server', '.env');
    if (await fs.pathExists(path.dirname(serverEnvPath))) {
      const serverEnvContent = [
        '# Generated by Webiu CLI',
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
        `COOKIE_SECURE=false`,
      ].join('\n');
      await fs.writeFile(serverEnvPath, serverEnvContent);
    }

    spinner.text = 'Configuring Angular frontend...';

    // ── Patch webiu-ui/src/environments/environment.ts ────────────────────────
    const envTsPath = path.join(projectDir, 'webiu-ui', 'src', 'environments', 'environment.ts');
    if (await fs.pathExists(envTsPath)) {
      const envTsContent = `export const environment = {\n  production: false,\n  serverUrl: 'http://localhost:5050',\n};\n`;
      await fs.writeFile(envTsPath, envTsContent);
    }

    // ── Write webiu-ui/src/assets/config.json ─────────────────────────────────
    const uiConfigPath = path.join(projectDir, 'webiu-ui', 'src', 'assets', 'config.json');
    if (await fs.pathExists(path.dirname(uiConfigPath))) {
      await fs.writeJson(uiConfigPath, {
        orgName,
        githubOrg,
        orgType,
        themeAccent,
        navbarSections,
        apiUrl: 'http://localhost:5050',
        graphqlUrl: 'http://localhost:5050/graphql',
      }, { spaces: 2 });
    }

    // ── Self-Contained Angular Code Patching Engine ───────────────────────────
    const targetUiDir = path.join(projectDir, 'webiu-ui', 'src', 'app');

    if (await fs.pathExists(targetUiDir)) {
      // 1. Write AppConfigService
      const appConfigServicePath = path.join(targetUiDir, 'services', 'app-config.service.ts');
      if (await fs.pathExists(path.dirname(appConfigServicePath))) {
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
        await fs.writeFile(appConfigServicePath, appConfigCode);
      }

      // 2. Patch navbar.component.ts to read AppConfigService
      const navbarTsPath = path.join(targetUiDir, 'components', 'navbar', 'navbar.component.ts');
      if (await fs.pathExists(navbarTsPath)) {
        let navTs = await fs.readFile(navbarTsPath, 'utf-8');
        if (!navTs.includes('AppConfigService')) {
          navTs = navTs.replace(
            /import { SearchService } from '\.\.\/\.\.\/services\/search\.service';/,
            `import { SearchService } from '../../services/search.service';\nimport { AppConfigService } from '../../services/app-config.service';`
          );
          navTs = navTs.replace(
            /private searchService = inject\(SearchService\);/,
            `private searchService = inject(SearchService);\n  private appConfigService = inject(AppConfigService);`
          );
          const navSectionsLogic = `
  showProjects = ${navbarSections.includes('projects')};
  showPublications = ${navbarSections.includes('publications')};
  showContributors = ${navbarSections.includes('contributors')};
  showCommunity = ${navbarSections.includes('community')};
  showOpportunities = ${navbarSections.includes('opportunities')};
  showGsoc = ${navbarSections.includes('gsoc')};
`;
          navTs = navTs.replace(/isSunVisible = true;/, `isSunVisible = true;\n${navSectionsLogic}`);
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
          await fs.writeFile(navbarTsPath, navTs);
        }
      }

      // 3. Patch navbar.component.html to wrap items in @if
      const navbarHtmlPath = path.join(targetUiDir, 'components', 'navbar', 'navbar.component.html');
      if (await fs.pathExists(navbarHtmlPath)) {
        let navHtml = await fs.readFile(navbarHtmlPath, 'utf-8');

        // Wrap projects item if not already wrapped
        if (!navHtml.includes('@if (showProjects)')) {
          navHtml = navHtml.replace(
            /(<a\s+class="navbar__menu__items"\s+\[routerLink\]="\['\/projects'\]"[\s\S]*?<\/a>)/,
            `@if (showProjects) {\n      $1\n    }`
          );
          navHtml = navHtml.replace(
            /(<a\s+class="navbar__menu__items"\s+\[routerLink\]="\['\/publications'\]"[\s\S]*?<\/a>)/,
            `@if (showPublications) {\n      $1\n    }`
          );
          navHtml = navHtml.replace(
            /(<a\s+class="navbar__menu__items"\s+\[routerLink\]="\['\/contributors'\]"[\s\S]*?<\/a>)/,
            `@if (showContributors) {\n      $1\n    }`
          );
          navHtml = navHtml.replace(
            /(<a\s+class="navbar__menu__items"\s+\[routerLink\]="\['\/community'\]"[\s\S]*?<\/a>)/,
            `@if (showCommunity) {\n      $1\n    }`
          );
          navHtml = navHtml.replace(
            /(<a\s+class="navbar__menu__items"\s+\[routerLink\]="\['\/opportunities'\]"[\s\S]*?<\/a>)/,
            `@if (showOpportunities) {\n      $1\n    }`
          );
          navHtml = navHtml.replace(
            /@if \(showIdeasPage\) \{/,
            `@if (showGsoc && showIdeasPage) {`
          );
          await fs.writeFile(navbarHtmlPath, navHtml);
        }
      }

      // 4. Patch hero-noise-background.component.ts for Three.js theme lighting
      const heroNoiseTsPath = path.join(targetUiDir, 'components', 'hero-noise-background', 'hero-noise-background.component.ts');
      if (await fs.pathExists(heroNoiseTsPath)) {
        let heroTs = await fs.readFile(heroNoiseTsPath, 'utf-8');
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
        await fs.writeFile(heroNoiseTsPath, heroTs);
      }

      // 5. Patch app.component.ts to initialize AppConfigService
      const appCompTsPath = path.join(targetUiDir, 'app.component.ts');
      if (await fs.pathExists(appCompTsPath)) {
        let appTs = await fs.readFile(appCompTsPath, 'utf-8');
        if (!appTs.includes('AppConfigService')) {
          appTs = appTs.replace(
            /import { SettingsService } from '\.\/services\/settings\.service';/,
            `import { SettingsService } from './services/settings.service';\nimport { AppConfigService } from './services/app-config.service';`
          );
          appTs = appTs.replace(
            /private settingsService = inject\(SettingsService\);/,
            `private settingsService = inject(SettingsService);\n  private appConfigService = inject(AppConfigService);`
          );
          const appInitLogic = `
    this.appConfigService.getConfig().subscribe({
      next: (config: import('./services/app-config.service').AppConfig) => {
        this.appConfigService.applyTheme(config);
        if (config.orgName && config.orgName !== 'WebiU') {
          this.titleService.setTitle(\`\${config.orgName} — Community Portal\`);
        }
      },
    });
`;
          appTs = appTs.replace(/ngOnInit\(\): void \{/, `ngOnInit(): void {${appInitLogic}`);
          await fs.writeFile(appCompTsPath, appTs);
        }
      }
    }

    // ── Patch index.html <title> with org name ────────────────────────────────
    const indexHtmlPath = path.join(projectDir, 'webiu-ui', 'src', 'index.html');
    if (await fs.pathExists(indexHtmlPath)) {
      let indexHtml = await fs.readFile(indexHtmlPath, 'utf-8');
      indexHtml = indexHtml.replace(
        /<title>.*?<\/title>/,
        `<title>${orgName} — Community Portal</title>`
      );
      indexHtml = indexHtml.replace(
        /content="WebiU — Open Source Intelligence Platform"/g,
        `content="${orgName} — Community Portal"`
      );
      indexHtml = indexHtml.replace(
        /content="Discover repositories, contributors, research publications, and community activity from C2SI\."/,
        `content="Discover projects, contributors, publications, and community activity from ${orgName}."`
      );
      await fs.writeFile(indexHtmlPath, indexHtml);
    }

    // ── Patch manifest.webmanifest name ──────────────────────────────────────
    const manifestPath = path.join(projectDir, 'webiu-ui', 'src', 'manifest.webmanifest');
    if (await fs.pathExists(manifestPath)) {
      const manifest = await fs.readJson(manifestPath);
      manifest.name = `${orgName} Community Portal`;
      manifest.short_name = orgName;
      await fs.writeJson(manifestPath, manifest, { spaces: 2 });
    }

    // ── Inject theme color into styles.scss ──────────────────────────────────
    const stylesPath = path.join(projectDir, 'webiu-ui', 'src', 'styles.scss');
    if (await fs.pathExists(stylesPath)) {
      let stylesContent = await fs.readFile(stylesPath, 'utf-8');

      // Replace default --theme-accent value in :root
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

      await fs.writeFile(stylesPath, stylesContent);
    }

    // ── Patch homepage hero title with org name ───────────────────────────────
    // The hero shows a big multi-word title (e.g. CEYLON COMPUTER SCIENCE INSTITUTE).
    // We split the org name into words and rewrite the hardcoded spans.
    const homepagePath = path.join(projectDir, 'webiu-ui', 'src', 'app', 'page', 'homepage', 'homepage.component.html');
    if (await fs.pathExists(homepagePath)) {
      let homepageHtml = await fs.readFile(homepagePath, 'utf-8');

      // Split org name into words (uppercase), then layout: 2 per row
      const words = orgName.toUpperCase().split(/\s+/).filter(Boolean);
      // Build rows: first row gets first half of words, second row the rest
      const midpoint = Math.ceil(words.length / 2);
      const row1Words = words.slice(0, midpoint);
      const row2Words = words.slice(midpoint);

      // Build the replacement <h1> block
      const buildWordSpan = (word: string, idx: number, isDim = false) =>
        `<span class="hero-word hero-word--${idx + 1}${isDim ? ' hero-word--dim' : ''}">${word}</span>`;

      const row1Html = row1Words.map((w, i) => buildWordSpan(w, i)).join('\n          ');
      const row2Html = row2Words.map((w, i) =>
        buildWordSpan(w, row1Words.length + i, i === row2Words.length - 1)
      ).join('\n          ');

      const newHeroTitle = `<h1 class="hero-title" appRevealOnScroll [immediate]="true" direction="center">
        <div class="hero-title-row">
          ${row1Html}
        </div>${row2Words.length > 0 ? `
        <div class="hero-title-row">
          ${row2Html}
        </div>` : ''}
        <span class="hero-handwritten-note">
          <svg class="handwritten-arrow" width="34" height="24" viewBox="0 0 34 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 23C8.5 19 18.5 10 27 1M27 1H17M27 1V9" stroke="var(--arrow-stroke-color)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Open Science Lab
        </span>
      </h1>`;

      // Replace the existing <h1 class="hero-title"...>...</h1> block
      homepageHtml = homepageHtml.replace(
        /<h1 class="hero-title"[\s\S]*?<\/h1>/,
        newHeroTitle
      );
      await fs.writeFile(homepagePath, homepageHtml);
    }

    spinner.succeed(chalk.green(`  ✔ Project ${chalk.bold.cyan(`"${projectName}"`)} scaffolded successfully!`));

    // ── Print Grand Victory Screen ──────────────────────────────────────────
    printFinalVictoryScreen({
      projectName,
      orgName,
      themeAccent,
      dbStrategy,
      navbarSections,
    });

    // ── Optional: auto-install dependencies ──────────────────────────────────
    const shouldInstall = await confirm({
      message: `Install all dependencies now? ${chalk.gray('(npm install in webiu-server + webiu-ui)')}`,
      default: true,
    });

    if (shouldInstall) {
      await runInstall(projectDir);

      // ── Optional: auto-start dev servers ─────────────────────────────────
      const shouldStart = await confirm({
        message: 'Start development servers now?',
        default: true,
      });

      if (shouldStart) {
        const { devCommand } = await import('./dev');
        process.chdir(projectDir);
        await devCommand();
      }
    }

  } catch (err: any) {
    spinner.fail(chalk.red('  ✘ Scaffolding failed!'));

    if (err.message && err.message.includes('git')) {
      console.error(chalk.red('\n  Git is required to scaffold a Webiu project.'));
      console.error(chalk.yellow('  Please install git from https://git-scm.com and try again.\n'));
    } else {
      console.error(err);
    }

    // Clean up empty directory on failure
    const existing = await fs.readdir(projectDir).catch(() => []);
    if (existing.length === 0) {
      await fs.remove(projectDir);
    }

    process.exit(1);
  }
}

async function runInstall(projectDir: string): Promise<void> {
  const serverDir = path.join(projectDir, 'webiu-server');
  const uiDir = path.join(projectDir, 'webiu-ui');

  const serverSpinner = ora({
    text: 'Installing backend dependencies (webiu-server)...',
    color: 'blue',
  }).start();

  const uiSpinner = ora({
    text: 'Installing frontend dependencies (webiu-ui)...',
    color: 'green',
  }).start();

  const installServer = execa('npm', ['install'], { cwd: serverDir, stdio: 'pipe' })
    .then(() => {
      serverSpinner.succeed(chalk.green('  ✔ Backend dependencies installed'));
    })
    .catch(() => {
      serverSpinner.fail(chalk.red('  ✘ Backend install failed — run: cd webiu-server && npm install'));
    });

  const installUi = execa('npm', ['install'], { cwd: uiDir, stdio: 'pipe' })
    .then(() => {
      uiSpinner.succeed(chalk.green('  ✔ Frontend dependencies installed'));
    })
    .catch(() => {
      uiSpinner.fail(chalk.red('  ✘ Frontend install failed — run: cd webiu-ui && npm install'));
    });

  await Promise.all([installServer, installUi]);
}
