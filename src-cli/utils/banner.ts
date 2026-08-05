import chalk from 'chalk';
import gradient from 'gradient-string';
import os from 'os';
import { VERSION } from '../constants';

// Big bold 3D ASCII Logo for WEBIU
const WEBIU_BIG_ASCII = `
██╗    ██╗███████╗██████╗ ██╗██╗   ██╗
██║    ██║██╔════╝██╔══██╗██║██║   ██║
██║ █╗ ██║█████╗  ██████╔╝██║██║   ██║
██║███╗██║██╔══╝  ██╔══██╗██║██║   ██║
╚███╔███╔╝███████╗██████╔╝██║╚██████╔╝
 ╚══╝╚══╝ ╚══════╝╚═════╝ ╚═╝ ╚═════╝ `;

/**
 * Calculates string length excluding ANSI color escape sequences
 */
function visibleLength(str: string): number {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\u001b\[[0-9;]*m/g, '').length;
}

/**
 * Prints the main greeting banner at the start of `webiu init`.
 */
export function printWelcomeBanner(): void {
  console.log(gradient(['#7B8CFF', '#00C8FF', '#10B981'])(WEBIU_BIG_ASCII));
  console.log(
    gradient(['#7B8CFF', '#00C8FF'])(
      '  ⚡ CLI Scaffolding Engine for Webiu Community Portals'
    )
  );
  console.log('');

  const rows: Array<[string, string]> = [
    ['Version', `v${VERSION}`],
    ['CLI Package', 'create-webiu'],
    ['Maintainer', 'Ceylon Computer Science Institute (C2SI)'],
    ['Node Version', process.version],
    ['System OS', `${os.type()} ${os.arch()}`],
  ];

  // Find max width needed to fit longest row without breaking
  let maxContentLen = 0;
  for (const [label, val] of rows) {
    const len = label.length + val.length + 6;
    if (len > maxContentLen) maxContentLen = len;
  }

  const width = Math.max(72, maxContentLen + 4);
  const border = chalk.hex('#7B8CFF')('═'.repeat(width));
  const corner = chalk.hex('#7B8CFF');

  console.log(corner('╔') + border + corner('╗'));

  for (const [label, val] of rows) {
    const leftText = `  ${chalk.bold.gray(label.padEnd(16))} ${chalk.cyan(val)}`;
    const padCount = width - visibleLength(leftText);
    console.log(corner('║') + leftText + ' '.repeat(Math.max(0, padCount)) + corner('║'));
  }

  const divider = chalk.hex('#7B8CFF')('─'.repeat(width));
  console.log(corner('╟') + divider + corner('╢'));

  const tipLeft = `  ${chalk.yellow('⚡')} ${chalk.gray('Tip: Use')} ${chalk.bold.white('↑ ↓')} ${chalk.gray('arrows to navigate,')} ${chalk.bold.white('Space')} ${chalk.gray('to toggle,')} ${chalk.bold.white('Enter')} ${chalk.gray('to confirm')}`;
  const tipPad = width - visibleLength(tipLeft);
  console.log(corner('║') + tipLeft + ' '.repeat(Math.max(0, tipPad)) + corner('║'));

  console.log(corner('╚') + border + corner('╝'));
  console.log('');
}

/**
 * Real-time dynamic configuration summary card that updates as the user answers prompts.
 */
export interface LiveConfigSummary {
  projectName?: string;
  orgName?: string;
  orgType?: string;
  githubOrg?: string;
  dbStrategy?: string;
  themeAccent?: string;
  deployTarget?: string;
  adminUsername?: string;
  navbarSections?: string[];
}

export function printLiveSummaryCard(config: LiveConfigSummary): void {
  const items: Array<[string, string | undefined, string | undefined]> = [
    ['Project Folder', config.projectName, undefined],
    ['Organization', config.orgName, undefined],
    ['Org Type', config.orgType, undefined],
    ['GitHub Org/User', config.githubOrg, undefined],
    ['Database Setup', config.dbStrategy, undefined],
    ['Theme Accent', config.themeAccent, config.themeAccent],
    ['Deploy Target', config.deployTarget, undefined],
    ['Admin Username', config.adminUsername, undefined],
  ];

  if (config.navbarSections && config.navbarSections.length > 0) {
    items.push(['Navbar Sections', config.navbarSections.join(', '), undefined]);
  }

  // Determine width dynamically based on content
  let maxContentLen = 34; // minimum width for header
  for (const [label, val, hex] of items) {
    if (!val) continue;
    const len = label.length + val.length + (hex ? 6 : 4);
    if (len > maxContentLen) maxContentLen = len;
  }

  const width = Math.max(72, maxContentLen + 4);
  const border = chalk.hex('#00C8FF')('═'.repeat(width));
  const corner = chalk.hex('#00C8FF');

  console.log(`\n${corner('╔')}${border}${corner('╗')}`);
  const headerText = `  ${chalk.bold.magenta('⚙️   LIVE CONFIGURATION SUMMARY')}`;
  const headerPad = width - visibleLength(headerText);
  console.log(`${corner('║')}${headerText}${' '.repeat(Math.max(0, headerPad))}${corner('║')}`);
  console.log(`${corner('╟')}${chalk.hex('#00C8FF')('─'.repeat(width))}${corner('╢')}`);

  for (const [label, val, badgeColor] of items) {
    if (!val) continue;
    const valText = badgeColor ? chalk.hex(badgeColor)(`■ ${val}`) : chalk.white(val);
    const leftText = `  ${chalk.bold.gray(label.padEnd(18))} ${valText}`;
    const pad = width - visibleLength(leftText);
    console.log(`${corner('║')}${leftText}${' '.repeat(Math.max(0, pad))}${corner('║')}`);
  }

  console.log(`${corner('╚')}${border}${corner('╝')}\n`);
}

/**
 * Grand Victory Screen at the end of `webiu init`.
 */
export function printFinalVictoryScreen(config: {
  projectName: string;
  orgName: string;
  themeAccent: string;
  dbStrategy: string;
  navbarSections: string[];
}): void {
  console.log(gradient(['#10B981', '#00C8FF'])(`
 ════════════════════════════════════════════════════════════════════════
  🎉 WEBIU COMMUNITY PORTAL CREATED SUCCESSFULLY!
 ════════════════════════════════════════════════════════════════════════`));

  const items: Array<[string, string, string | undefined]> = [
    ['Project Name', config.projectName, undefined],
    ['Organization', config.orgName, undefined],
    ['Theme Accent', config.themeAccent, config.themeAccent],
    ['Active Navbar', `${config.navbarSections.length} sections active (${config.navbarSections.join(', ')})`, undefined],
    ['Frontend UI', 'http://localhost:4200', undefined],
    ['Backend API', 'http://localhost:5050', undefined],
  ];

  let maxLen = 50;
  for (const [label, val, hex] of items) {
    const len = label.length + val.length + (hex ? 6 : 4);
    if (len > maxLen) maxLen = len;
  }

  const width = Math.max(72, maxLen + 4);
  const border = chalk.hex('#10B981')('═'.repeat(width));
  const corner = chalk.hex('#10B981');

  console.log(corner('╔') + border + corner('╗'));

  for (const [label, val, colorHex] of items) {
    const displayVal = colorHex ? chalk.hex(colorHex)(`■ ${val}`) : chalk.cyan(val);
    const leftText = `  ${chalk.bold.gray(label.padEnd(18))} ${displayVal}`;
    const pad = width - visibleLength(leftText);
    console.log(corner('║') + leftText + ' '.repeat(Math.max(0, pad)) + corner('║'));
  }

  console.log(corner('╟') + chalk.hex('#10B981')('─'.repeat(width)) + corner('╢'));

  const headerText = `  ${chalk.bold.yellow('🚀 NEXT STEPS TO GET STARTED:')}`;
  console.log(corner('║') + headerText + ' '.repeat(Math.max(0, width - visibleLength(headerText))) + corner('║'));

  const cmd1 = `  ${chalk.gray('1.')} cd ${chalk.cyan(config.projectName)}`;
  console.log(corner('║') + cmd1 + ' '.repeat(Math.max(0, width - visibleLength(cmd1))) + corner('║'));

  if (config.dbStrategy === 'docker-postgres') {
    const cmd2 = `  ${chalk.gray('2.')} docker compose up -d ${chalk.gray('(Starts PostgreSQL container)')}`;
    console.log(corner('║') + cmd2 + ' '.repeat(Math.max(0, width - visibleLength(cmd2))) + corner('║'));
    const cmd3 = `  ${chalk.gray('3.')} webiu dev             ${chalk.gray('(Launches UI + API servers)')}`;
    console.log(corner('║') + cmd3 + ' '.repeat(Math.max(0, width - visibleLength(cmd3))) + corner('║'));
  } else {
    const cmd2 = `  ${chalk.gray('2.')} webiu dev             ${chalk.gray('(Launches UI + API servers)')}`;
    console.log(corner('║') + cmd2 + ' '.repeat(Math.max(0, width - visibleLength(cmd2))) + corner('║'));
  }

  console.log(corner('╚') + border + corner('╝'));
  console.log('');
}

/**
 * Compact header for subcommands.
 */
export function printCompactHeader(commandName: string): void {
  const tag = chalk.bgHex('#7B8CFF').black(` WebiU CLI v${VERSION} `);
  const cmd = chalk.bold.cyan(commandName);
  console.log(`\n${tag}  ${cmd}\n`);
}
