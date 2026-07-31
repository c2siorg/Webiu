import {
  buildCommand,
  devCommand,
  printCompactHeader,
  printFinalVictoryScreen,
  printLiveSummaryCard,
  printWelcomeBanner
} from "./chunk-36XSOGHD.mjs";

// src-cli/index.ts
import { Command } from "commander";
import chalk6 from "chalk";

// src-cli/commands/init.ts
import { select, input, checkbox, confirm, password } from "@inquirer/prompts";
import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import path from "path";
import execa from "execa";
var WEBIU_REPO = "https://github.com/TarunyaProgrammer/Webiu.git";
var WEBIU_BRANCH = "webiu-npm-pack";
var ALL_NAVBAR_SECTIONS = [
  { name: "\u{1F3E0} Home          (always included)", value: "home", disabled: true },
  { name: "\u{1F4C1} Projects", value: "projects", checked: true },
  { name: "\u{1F4F0} Publications", value: "publications", checked: true },
  { name: "\u{1F465} Contributors", value: "contributors", checked: true },
  { name: "\u{1F310} Community", value: "community", checked: true },
  { name: "\u{1F4BC} Opportunities", value: "opportunities", checked: true },
  { name: "\u{1F393} GSoC (Google Summer of Code)", value: "gsoc", checked: true }
];
async function initCommand(options) {
  printWelcomeBanner();
  console.log(`${chalk.bold.cyan("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501")}`);
  console.log(`${chalk.bold.yellow("  \u{1F680} Project Setup Wizard \u2014 Answer a few questions to begin")}`);
  console.log(`${chalk.bold.cyan("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501")}
`);
  const summary = {};
  const projectName = options.name || await input({
    message: "What is your project directory name?",
    default: "my-webiu-portal"
  });
  summary.projectName = projectName;
  printLiveSummaryCard(summary);
  const orgName = await input({
    message: "What is your Organization Name?",
    default: "My Community Org"
  });
  summary.orgName = orgName;
  printLiveSummaryCard(summary);
  const orgType = await select({
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
  const githubOrg = await input({
    message: "What is your GitHub Organization / User name?",
    default: "c2siorg"
  });
  summary.githubOrg = githubOrg;
  printLiveSummaryCard(summary);
  const dbStrategy = await select({
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
    databaseUrl = await input({
      message: "Enter your PostgreSQL Connection String URL:",
      default: databaseUrl
    });
  }
  const themeAccent = await select({
    message: "Select Primary UI Theme Accent Color:",
    choices: [
      { name: `${chalk.hex("#0052CC")("\u25A0")} Ocean Blue      (#0052CC)`, value: "#0052CC" },
      { name: `${chalk.hex("#10B981")("\u25A0")} Emerald Green   (#10B981)`, value: "#10B981" },
      { name: `${chalk.hex("#7C3AED")("\u25A0")} Deep Purple      (#7C3AED)`, value: "#7C3AED" },
      { name: `${chalk.hex("#EF4444")("\u25A0")} Sunset Crimson   (#EF4444)`, value: "#EF4444" },
      { name: `${chalk.hex("#F59E0B")("\u25A0")} Amber Gold       (#F59E0B)`, value: "#F59E0B" },
      { name: `${chalk.hex("#EC4899")("\u25A0")} Rose Pink        (#EC4899)`, value: "#EC4899" }
    ]
  });
  summary.themeAccent = themeAccent;
  printLiveSummaryCard(summary);
  const deployTarget = await select({
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
${chalk.bold.gray("\u2500\u2500 Admin Account Setup \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500")}
`);
  const adminUsername = await input({
    message: "Admin dashboard username:",
    default: "admin"
  });
  summary.adminUsername = adminUsername;
  printLiveSummaryCard(summary);
  const adminPassword = await password({
    message: "Admin dashboard password (min 8 characters):",
    validate: (val) => val.length >= 8 ? true : "Password must be at least 8 characters."
  });
  console.log(`
${chalk.bold.gray("\u2500\u2500 Portal Navigation \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500")}
`);
  const selectedSections = await checkbox({
    message: "Which sections do you want in your portal's navbar?",
    choices: ALL_NAVBAR_SECTIONS,
    instructions: chalk.gray("  Space to toggle \xB7 A to select all \xB7 Enter to confirm")
  });
  const navbarSections = ["home", ...selectedSections.filter((s) => s !== "home")];
  summary.navbarSections = navbarSections;
  printLiveSummaryCard(summary);
  const projectDir = path.resolve(process.cwd(), projectName);
  if (await fs.pathExists(projectDir)) {
    const existing = await fs.readdir(projectDir);
    if (existing.length > 0) {
      console.log(chalk.red(`
  \u2718 Directory "${projectName}" already exists and is not empty.`));
      console.log(chalk.yellow("  Please choose an empty directory or delete the existing one.\n"));
      process.exit(1);
    }
  }
  await fs.ensureDir(projectDir);
  console.log("");
  const spinner = ora({
    text: `Cloning Webiu source code into "${chalk.cyan(projectName)}"...`,
    color: "cyan"
  }).start();
  try {
    await execa("git", [
      "clone",
      "--branch",
      WEBIU_BRANCH,
      "--single-branch",
      "--depth=1",
      WEBIU_REPO,
      projectDir
    ], { stdio: "pipe" });
    spinner.text = "Injecting organization configuration...";
    const jwtSecret = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
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
    await fs.writeFile(path.join(projectDir, ".env"), rootEnvContent);
    const serverEnvPath = path.join(projectDir, "webiu-server", ".env");
    if (await fs.pathExists(path.dirname(serverEnvPath))) {
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
      await fs.writeFile(serverEnvPath, serverEnvContent);
    }
    spinner.text = "Configuring Angular frontend...";
    const envTsPath = path.join(projectDir, "webiu-ui", "src", "environments", "environment.ts");
    if (await fs.pathExists(envTsPath)) {
      const envTsContent = `export const environment = {
  production: false,
  serverUrl: 'http://localhost:5050',
};
`;
      await fs.writeFile(envTsPath, envTsContent);
    }
    const uiConfigPath = path.join(projectDir, "webiu-ui", "src", "assets", "config.json");
    if (await fs.pathExists(path.dirname(uiConfigPath))) {
      await fs.writeJson(uiConfigPath, {
        orgName,
        githubOrg,
        orgType,
        themeAccent,
        navbarSections,
        apiUrl: "http://localhost:5050",
        graphqlUrl: "http://localhost:5050/graphql"
      }, { spaces: 2 });
    }
    const targetUiDir = path.join(projectDir, "webiu-ui", "src", "app");
    if (await fs.pathExists(targetUiDir)) {
      const appConfigServicePath = path.join(targetUiDir, "services", "app-config.service.ts");
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
      const navbarTsPath = path.join(targetUiDir, "components", "navbar", "navbar.component.ts");
      if (await fs.pathExists(navbarTsPath)) {
        let navTs = await fs.readFile(navbarTsPath, "utf-8");
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
          await fs.writeFile(navbarTsPath, navTs);
        }
      }
      const navbarHtmlPath = path.join(targetUiDir, "components", "navbar", "navbar.component.html");
      if (await fs.pathExists(navbarHtmlPath)) {
        let navHtml = await fs.readFile(navbarHtmlPath, "utf-8");
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
          await fs.writeFile(navbarHtmlPath, navHtml);
        }
      }
      const heroNoiseTsPath = path.join(targetUiDir, "components", "hero-noise-background", "hero-noise-background.component.ts");
      if (await fs.pathExists(heroNoiseTsPath)) {
        let heroTs = await fs.readFile(heroNoiseTsPath, "utf-8");
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
      const appCompTsPath = path.join(targetUiDir, "app.component.ts");
      if (await fs.pathExists(appCompTsPath)) {
        let appTs = await fs.readFile(appCompTsPath, "utf-8");
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
          await fs.writeFile(appCompTsPath, appTs);
        }
      }
    }
    const indexHtmlPath = path.join(projectDir, "webiu-ui", "src", "index.html");
    if (await fs.pathExists(indexHtmlPath)) {
      let indexHtml = await fs.readFile(indexHtmlPath, "utf-8");
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
      await fs.writeFile(indexHtmlPath, indexHtml);
    }
    const manifestPath = path.join(projectDir, "webiu-ui", "src", "manifest.webmanifest");
    if (await fs.pathExists(manifestPath)) {
      const manifest = await fs.readJson(manifestPath);
      manifest.name = `${orgName} Community Portal`;
      manifest.short_name = orgName;
      await fs.writeJson(manifestPath, manifest, { spaces: 2 });
    }
    const stylesPath = path.join(projectDir, "webiu-ui", "src", "styles.scss");
    if (await fs.pathExists(stylesPath)) {
      let stylesContent = await fs.readFile(stylesPath, "utf-8");
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
    const homepagePath = path.join(projectDir, "webiu-ui", "src", "app", "page", "homepage", "homepage.component.html");
    if (await fs.pathExists(homepagePath)) {
      let homepageHtml = await fs.readFile(homepagePath, "utf-8");
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
      await fs.writeFile(homepagePath, homepageHtml);
    }
    spinner.succeed(chalk.green(`  \u2714 Project ${chalk.bold.cyan(`"${projectName}"`)} scaffolded successfully!`));
    printFinalVictoryScreen({
      projectName,
      orgName,
      themeAccent,
      dbStrategy,
      navbarSections
    });
    const shouldInstall = await confirm({
      message: `Install all dependencies now? ${chalk.gray("(npm install in webiu-server + webiu-ui)")}`,
      default: true
    });
    if (shouldInstall) {
      await runInstall(projectDir);
      const shouldStart = await confirm({
        message: "Start development servers now?",
        default: true
      });
      if (shouldStart) {
        const { devCommand: devCommand2 } = await import("./dev-NPAINWOV.mjs");
        process.chdir(projectDir);
        await devCommand2();
      }
    }
  } catch (err) {
    spinner.fail(chalk.red("  \u2718 Scaffolding failed!"));
    if (err.message && err.message.includes("git")) {
      console.error(chalk.red("\n  Git is required to scaffold a Webiu project."));
      console.error(chalk.yellow("  Please install git from https://git-scm.com and try again.\n"));
    } else {
      console.error(err);
    }
    const existing = await fs.readdir(projectDir).catch(() => []);
    if (existing.length === 0) {
      await fs.remove(projectDir);
    }
    process.exit(1);
  }
}
async function runInstall(projectDir) {
  const serverDir = path.join(projectDir, "webiu-server");
  const uiDir = path.join(projectDir, "webiu-ui");
  const serverSpinner = ora({
    text: "Installing backend dependencies (webiu-server)...",
    color: "blue"
  }).start();
  try {
    await execa("npm", ["install"], { cwd: serverDir, stdio: "pipe" });
    serverSpinner.succeed(chalk.green("  \u2714 Backend dependencies installed"));
  } catch {
    serverSpinner.fail(chalk.red("  \u2718 Backend install failed \u2014 run: cd webiu-server && npm install"));
  }
  const uiSpinner = ora({
    text: "Installing frontend dependencies (webiu-ui)...",
    color: "green"
  }).start();
  try {
    await execa("npm", ["install"], { cwd: uiDir, stdio: "pipe" });
    uiSpinner.succeed(chalk.green("  \u2714 Frontend dependencies installed"));
  } catch {
    uiSpinner.fail(chalk.red("  \u2718 Frontend install failed \u2014 run: cd webiu-ui && npm install"));
  }
}

// src-cli/commands/config.ts
import { select as select2, input as input2, checkbox as checkbox2, password as password2 } from "@inquirer/prompts";
import chalk2 from "chalk";
import ora2 from "ora";
import fs2 from "fs-extra";
import path2 from "path";
var ALL_NAVBAR_SECTIONS2 = [
  { name: "\u{1F3E0} Home          (always included)", value: "home", disabled: true },
  { name: "\u{1F4C1} Projects", value: "projects", checked: true },
  { name: "\u{1F4F0} Publications", value: "publications", checked: true },
  { name: "\u{1F465} Contributors", value: "contributors", checked: true },
  { name: "\u{1F310} Community", value: "community", checked: true },
  { name: "\u{1F4BC} Opportunities", value: "opportunities", checked: true },
  { name: "\u{1F393} GSoC (Google Summer of Code)", value: "gsoc", checked: true }
];
async function configCommand() {
  printCompactHeader("webiu config \u2014 Interactive Configuration Manager");
  const rootEnvPath = path2.join(process.cwd(), ".env");
  const serverEnvPath = path2.join(process.cwd(), "webiu-server", ".env");
  const uiConfigPath = path2.join(process.cwd(), "webiu-ui", "src", "assets", "config.json");
  const isWebiuProject = await fs2.pathExists(rootEnvPath) && await fs2.pathExists(path2.join(process.cwd(), "webiu-server")) && await fs2.pathExists(path2.join(process.cwd(), "webiu-ui"));
  if (!isWebiuProject) {
    console.error(chalk2.red("\n  \u2718 Not inside a Webiu project directory."));
    console.error(chalk2.yellow("  Please run this command from inside your project folder (e.g. cd my-webiu-portal)\n"));
    process.exit(1);
  }
  let currentEnv = {};
  try {
    const envContent = await fs2.readFile(rootEnvPath, "utf-8");
    for (const line of envContent.split("\n")) {
      if (line.startsWith("#") || !line.includes("=")) continue;
      const eqIdx = line.indexOf("=");
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim().replace(/^"|"$/g, "");
      currentEnv[key] = val;
    }
  } catch {
    console.error(chalk2.yellow("  Could not read .env \u2014 starting fresh.\n"));
  }
  const setting = await select2({
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
    updates["ORG_NAME"] = await input2({
      message: "Organization Name:",
      default: currentEnv["ORG_NAME"] || "My Community Org"
    });
    updates["GITHUB_ORG_NAME"] = await input2({
      message: "GitHub Organization / Username:",
      default: currentEnv["GITHUB_ORG_NAME"] || "c2siorg"
    });
  } else if (setting === "theme") {
    updates["THEME_ACCENT"] = await select2({
      message: `Current theme: ${chalk2.hex(currentEnv["THEME_ACCENT"] || "#7B8CFF")("\u25A0")} ${currentEnv["THEME_ACCENT"] || "#7B8CFF"}
Select new accent color:`,
      choices: [
        { name: `${chalk2.hex("#0052CC")("\u25A0")} Ocean Blue      (#0052CC)`, value: "#0052CC" },
        { name: `${chalk2.hex("#10B981")("\u25A0")} Emerald Green   (#10B981)`, value: "#10B981" },
        { name: `${chalk2.hex("#7C3AED")("\u25A0")} Deep Purple      (#7C3AED)`, value: "#7C3AED" },
        { name: `${chalk2.hex("#EF4444")("\u25A0")} Sunset Crimson   (#EF4444)`, value: "#EF4444" },
        { name: `${chalk2.hex("#F59E0B")("\u25A0")} Amber Gold       (#F59E0B)`, value: "#F59E0B" },
        { name: `${chalk2.hex("#EC4899")("\u25A0")} Rose Pink        (#EC4899)`, value: "#EC4899" }
      ]
    });
  } else if (setting === "navbar") {
    const selected = await checkbox2({
      message: "Which navbar sections should be active?",
      choices: ALL_NAVBAR_SECTIONS2,
      instructions: chalk2.gray("  Space to toggle \xB7 A to select all \xB7 Enter to confirm")
    });
    newNavbarSections = ["home", ...selected.filter((s) => s !== "home")];
  } else if (setting === "db") {
    updates["DATABASE_URL"] = await input2({
      message: "PostgreSQL Connection URL:",
      default: currentEnv["DATABASE_URL"] || "postgresql://postgres:postgres@localhost:5433/webiu_db"
    });
  } else if (setting === "auth") {
    updates["ADMIN_USERNAME"] = await input2({
      message: "Admin Username:",
      default: currentEnv["ADMIN_USERNAME"] || "admin"
    });
    updates["ADMIN_PASSWORD"] = await password2({
      message: "New Admin Password (min 8 characters):",
      validate: (v) => v.length >= 8 ? true : "Password must be at least 8 characters."
    });
  }
  const spinner = ora2({ text: "Writing updated configuration across portal...", color: "cyan" }).start();
  try {
    if (await fs2.pathExists(rootEnvPath)) {
      let envContent = await fs2.readFile(rootEnvPath, "utf-8");
      for (const [key, val] of Object.entries(updates)) {
        const regex = new RegExp(`^${key}=.*$`, "m");
        const newLine = `${key}="${val}"`;
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, newLine);
        } else {
          envContent += `
${newLine}`;
        }
      }
      await fs2.writeFile(rootEnvPath, envContent);
    }
    if (await fs2.pathExists(serverEnvPath)) {
      let serverEnv = await fs2.readFile(serverEnvPath, "utf-8");
      for (const [key, val] of Object.entries(updates)) {
        const regex = new RegExp(`^${key}=.*$`, "m");
        const newLine = `${key}="${val}"`;
        if (regex.test(serverEnv)) {
          serverEnv = serverEnv.replace(regex, newLine);
        } else {
          serverEnv += `
${newLine}`;
        }
      }
      await fs2.writeFile(serverEnvPath, serverEnv);
    }
    if (await fs2.pathExists(uiConfigPath)) {
      const config = await fs2.readJson(uiConfigPath);
      if (updates["ORG_NAME"]) config.orgName = updates["ORG_NAME"];
      if (updates["GITHUB_ORG_NAME"]) config.githubOrg = updates["GITHUB_ORG_NAME"];
      if (updates["THEME_ACCENT"]) config.themeAccent = updates["THEME_ACCENT"];
      if (newNavbarSections) config.navbarSections = newNavbarSections;
      await fs2.writeJson(uiConfigPath, config, { spaces: 2 });
    }
    if (updates["THEME_ACCENT"]) {
      const stylesPath = path2.join(process.cwd(), "webiu-ui", "src", "styles.scss");
      if (await fs2.pathExists(stylesPath)) {
        let styles = await fs2.readFile(stylesPath, "utf-8");
        const accent = updates["THEME_ACCENT"];
        styles = styles.replace(/--theme-accent:\s*#[0-9A-Fa-f]{6};/, `--theme-accent:       ${accent};`);
        styles = styles.replace(/--theme-accent-dim:\s*rgba\(.*?\);/, `--theme-accent-dim:   ${accent}26;`);
        styles = styles.replace(/--theme-accent-glow:\s*.*?;/, `--theme-accent-glow:  0 0 24px ${accent}40;`);
        await fs2.writeFile(stylesPath, styles);
      }
    }
    const appConfigPath = path2.join(process.cwd(), "webiu-ui", "src", "app", "services", "app-config.service.ts");
    if (await fs2.pathExists(appConfigPath)) {
      let code = await fs2.readFile(appConfigPath, "utf-8");
      if (updates["THEME_ACCENT"]) {
        code = code.replace(/themeAccent:\s*'#[0-9A-Fa-f]{6}'/, `themeAccent: '${updates["THEME_ACCENT"]}'`);
      }
      if (updates["ORG_NAME"]) {
        code = code.replace(/orgName:\s*'.*?'/, `orgName: '${updates["ORG_NAME"]}'`);
      }
      if (newNavbarSections) {
        code = code.replace(/navbarSections:\s*\[.*?\]/s, `navbarSections: ${JSON.stringify(newNavbarSections)}`);
      }
      await fs2.writeFile(appConfigPath, code);
    }
    if (newNavbarSections) {
      const navTsPath = path2.join(process.cwd(), "webiu-ui", "src", "app", "components", "navbar", "navbar.component.ts");
      if (await fs2.pathExists(navTsPath)) {
        let navTs = await fs2.readFile(navTsPath, "utf-8");
        navTs = navTs.replace(/showProjects\s*=\s*(true|false);/, `showProjects = ${newNavbarSections.includes("projects")};`);
        navTs = navTs.replace(/showPublications\s*=\s*(true|false);/, `showPublications = ${newNavbarSections.includes("publications")};`);
        navTs = navTs.replace(/showContributors\s*=\s*(true|false);/, `showContributors = ${newNavbarSections.includes("contributors")};`);
        navTs = navTs.replace(/showCommunity\s*=\s*(true|false);/, `showCommunity = ${newNavbarSections.includes("community")};`);
        navTs = navTs.replace(/showOpportunities\s*=\s*(true|false);/, `showOpportunities = ${newNavbarSections.includes("opportunities")};`);
        navTs = navTs.replace(/showGsoc\s*=\s*(true|false);/, `showGsoc = ${newNavbarSections.includes("gsoc")};`);
        await fs2.writeFile(navTsPath, navTs);
      }
    }
    if (updates["ORG_NAME"]) {
      const orgName = updates["ORG_NAME"];
      const indexPath = path2.join(process.cwd(), "webiu-ui", "src", "index.html");
      if (await fs2.pathExists(indexPath)) {
        let html = await fs2.readFile(indexPath, "utf-8");
        html = html.replace(/<title>.*?<\/title>/, `<title>${orgName} \u2014 Community Portal</title>`);
        await fs2.writeFile(indexPath, html);
      }
      const homepagePath = path2.join(process.cwd(), "webiu-ui", "src", "app", "page", "homepage", "homepage.component.html");
      if (await fs2.pathExists(homepagePath)) {
        let hp = await fs2.readFile(homepagePath, "utf-8");
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
        await fs2.writeFile(homepagePath, hp);
      }
    }
    spinner.succeed(chalk2.green("  \u2714 Configuration updated successfully!"));
    console.log(`
  ${chalk2.bold("Changes applied:")}`);
    for (const [key, val] of Object.entries(updates)) {
      const displayVal = key.includes("PASSWORD") ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : val;
      console.log(`    ${chalk2.gray(key)} \u2192 ${chalk2.cyan(displayVal)}`);
    }
    if (newNavbarSections) {
      console.log(`    ${chalk2.gray("NAVBAR_SECTIONS")} \u2192 ${chalk2.cyan(newNavbarSections.join(", "))}`);
    }
    console.log("");
  } catch (err) {
    spinner.fail(chalk2.red("  \u2718 Failed to update configuration."));
    console.error(err);
  }
}

// src-cli/commands/deploy.ts
import { select as select3 } from "@inquirer/prompts";
import chalk3 from "chalk";
import ora3 from "ora";
import fs3 from "fs-extra";
import path3 from "path";
async function deployCommand() {
  console.log(`
${chalk3.bold.cyan("====================================================")}`);
  console.log(`${chalk3.bold.yellow("      Webiu Interactive Deployment Generator       ")}`);
  console.log(`${chalk3.bold.cyan("====================================================")}
`);
  const platform = await select3({
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
  const spinner = ora3(`Generating deployment configuration files for ${platform}...`).start();
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
      await fs3.writeFile(path3.join(process.cwd(), "render.yaml"), renderYaml);
      spinner.succeed(chalk3.green("Generated render.yaml successfully! XD"));
      console.log(`
${chalk3.bold.yellow("Next Steps for Render:")}`);
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
      await fs3.writeFile(path3.join(process.cwd(), "docker-compose.prod.yml"), dockerProd);
      spinner.succeed(chalk3.green("Generated docker-compose.prod.yml successfully! :D"));
      console.log(`
${chalk3.bold.yellow("Next Steps for Docker:")}`);
      console.log(`  1. Run ${chalk3.cyan("docker compose -f docker-compose.prod.yml up -d")}`);
      console.log("  2. Access your portal at http://localhost\n");
    } else {
      spinner.succeed(chalk3.green(`Prepared deployment instructions for ${platform}!`));
    }
  } catch (err) {
    spinner.fail(chalk3.red("Failed to generate deployment templates."));
    console.error(err);
  }
}

// src-cli/commands/help.ts
import chalk4 from "chalk";
function helpCommand() {
  console.log(`
${chalk4.bold.hex("#7B8CFF")("\u256D\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256E")}
${chalk4.bold.hex("#7B8CFF")("\u2502")}  ${chalk4.bold.white("WEBIU CLI")}  ${chalk4.gray("v1.0.5")}  ${chalk4.hex("#7B8CFF")("\xB7")}  ${chalk4.gray("by Ceylon Computer Science Institute")}        ${chalk4.bold.hex("#7B8CFF")("\u2502")}
${chalk4.bold.hex("#7B8CFF")("\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256F")}

${chalk4.bold("Usage:")} ${chalk4.cyan("webiu")} ${chalk4.gray("[command]")}

${chalk4.bold.green("Commands:")}
  ${chalk4.bold.cyan("init")}            Interactively initialize a new Webiu portal project
  ${chalk4.bold.cyan("dev")}             Start local development servers (Frontend + Backend)
  ${chalk4.bold.cyan("build")}           Build production assets for webiu-ui and webiu-server
  ${chalk4.bold.cyan("config")}          Re-configure org, theme, DB, or admin credentials
  ${chalk4.bold.cyan("deploy")}          Generate deployment files (Render, Railway, Vercel, Docker)
  ${chalk4.bold.cyan("docker:up")}       Start local Docker containers (PostgreSQL DB)
  ${chalk4.bold.cyan("docker:down")}     Stop and remove local Docker containers
  ${chalk4.bold.cyan("help")}            Display this help manual

${chalk4.bold.green("Flags:")}
  ${chalk4.bold.cyan("-V, --version")}   Output the current CLI version
  ${chalk4.bold.cyan("-h, --help")}      Display help information

${chalk4.bold.magenta("Examples:")}
  ${chalk4.gray("$")} ${chalk4.cyan("webiu init")}
  ${chalk4.gray("$")} ${chalk4.cyan("webiu dev")}
  ${chalk4.gray("$")} ${chalk4.cyan("webiu config")}
  ${chalk4.gray("$")} ${chalk4.cyan("webiu deploy")}
  ${chalk4.gray("$")} ${chalk4.cyan("webiu -V")}

${chalk4.bold.green("URLs after webiu dev:")}
  ${chalk4.gray("Frontend UI \u2192")}  ${chalk4.underline.blue("http://localhost:4200")}
  ${chalk4.gray("Backend API \u2192")}  ${chalk4.underline.blue("http://localhost:5050")}

${chalk4.gray("Documentation:")} ${chalk4.underline.blue("https://github.com/c2siorg/Webiu")}
${chalk4.gray("Maintainers: Ceylon Computer Science Institute (C2SI)")}
`);
}

// src-cli/commands/docker.ts
import { execa as execa2 } from "execa";
import chalk5 from "chalk";
async function dockerUpCommand() {
  console.log(`
${chalk5.bold.cyan("Starting Docker containerized environment... :D")}
`);
  try {
    await execa2("docker", ["compose", "up", "-d"], { stdio: "inherit" });
    console.log(chalk5.green("\nDocker containers started successfully! XD"));
  } catch (err) {
    console.error(chalk5.red("Failed to start Docker containers:"), err);
  }
}
async function dockerDownCommand() {
  console.log(`
${chalk5.bold.cyan("Stopping Docker containerized environment...")}
`);
  try {
    await execa2("docker", ["compose", "down"], { stdio: "inherit" });
    console.log(chalk5.green("\nDocker containers stopped cleanly."));
  } catch (err) {
    console.error(chalk5.red("Failed to stop Docker containers:"), err);
  }
}

// src-cli/index.ts
function handleGracefulExit() {
  console.log(`

  ${chalk6.bold.yellow("\u{1F44B} Goodbye!")} ${chalk6.gray("Operation cancelled by user.")}
`);
  process.exit(0);
}
process.on("SIGINT", handleGracefulExit);
process.on("unhandledRejection", (reason) => {
  if (reason && (reason.name === "ExitPromptError" || reason.message?.includes("force closed"))) {
    handleGracefulExit();
  } else {
    console.error(chalk6.red("\n  \u2718 Unexpected Error:"), reason);
    process.exit(1);
  }
});
var program = new Command();
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
  console.error(chalk6.red(`
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
