import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init';
import { devCommand, buildCommand } from './commands/dev';
import { configCommand } from './commands/config';
import { deployCommand } from './commands/deploy';
import { helpCommand } from './commands/help';
import { dockerUpCommand, dockerDownCommand } from './commands/docker';

// ── Global Graceful Exit Handler (Catches Ctrl+C / SIGINT) ───────────────────
function handleGracefulExit(): void {
  console.log(`\n\n  ${chalk.bold.yellow('👋 Goodbye!')} ${chalk.gray('Operation cancelled by user.')}\n`);
  process.exit(0);
}

process.on('SIGINT', handleGracefulExit);
process.on('unhandledRejection', (reason: any) => {
  if (reason && (reason.name === 'ExitPromptError' || reason.message?.includes('force closed'))) {
    handleGracefulExit();
  } else {
    console.error(chalk.red('\n  ✘ Unexpected Error:'), reason);
    process.exit(1);
  }
});

const program = new Command();

program
  .name('webiu')
  .description('CLI tool to generate, configure, and deploy Webiu community portals')
  .version('2.0.1', '-V, --version', 'Output the current CLI version')
  .addHelpCommand(false)
  .helpOption('-h, --help', 'Display command usage and instructions');

// Unify `-h` and `--help` output across Commander so it calls our colored help manual
program.configureOutput({
  writeOut: (str) => {
    if (str.includes('Usage: webiu') || str.includes('Commands:') || str.includes('Options:')) {
      helpCommand();
    } else {
      process.stdout.write(str);
    }
  },
  writeErr: (str) => process.stderr.write(str),
});

program
  .command('init')
  .description('Interactively initialize a new Webiu portal project')
  .option('-n, --name <name>', 'Project directory name (skip prompt)')
  .action(initCommand);

program
  .command('dev')
  .description('Start local development servers (Frontend + Backend concurrently)')
  .action(devCommand);

program
  .command('build')
  .description('Build production assets for both webiu-ui and webiu-server')
  .action(buildCommand);

program
  .command('config')
  .description('Re-configure organization metadata, branding, DB, or admin credentials')
  .action(configCommand);

program
  .command('deploy')
  .description('Launch interactive deployment generator for Render, Railway, Vercel, or Docker')
  .action(deployCommand);

program
  .command('docker:up')
  .description('Start local Docker containers (PostgreSQL database)')
  .action(dockerUpCommand);

program
  .command('docker:down')
  .description('Stop and remove local Docker containers')
  .action(dockerDownCommand);

program
  .command('help')
  .description('Display detailed command usage and instructions')
  .action(helpCommand);

// Catch-all for unknown subcommands
program.on('command:*', (operands) => {
  console.error(chalk.red(`\n  ✘ Unknown command: "${operands[0]}"\n`));
  helpCommand();
  process.exit(1);
});

// Intercept `-h` or `--help` explicitly before Commander default parsing
if (process.argv.includes('-h') || process.argv.includes('--help')) {
  helpCommand();
  process.exit(0);
}

program.parse(process.argv);

// If no arguments are given at all, show the help screen
if (!process.argv.slice(2).length) {
  helpCommand();
}
