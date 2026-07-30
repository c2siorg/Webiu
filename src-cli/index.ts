import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init';
import { devCommand, buildCommand } from './commands/dev';
import { configCommand } from './commands/config';
import { deployCommand } from './commands/deploy';
import { helpCommand } from './commands/help';
import { dockerUpCommand, dockerDownCommand } from './commands/docker';

const program = new Command();

program
  .name('webiu')
  .description('CLI tool to generate, configure, and deploy Webiu community portals')
  .version('1.0.5')
  // Disable commander's built-in 'help' subcommand so our custom one can take over
  .addHelpCommand(false)
  // Override the default --help flag output to use our styled help screen
  .helpOption('-h, --help', 'Display command usage and instructions');

program
  .command('init')
  .description('Interactively initialize a new Webiu portal project')
  .option('-n, --name <name>', 'Project name')
  .action(initCommand);

program
  .command('dev')
  .description('Start local development server (Frontend + Backend concurrently)')
  .action(devCommand);

program
  .command('build')
  .description('Build production assets for both webiu-ui and webiu-server')
  .action(buildCommand);

program
  .command('config')
  .description('Re-configure Organization metadata, branding, or environment variables')
  .action(configCommand);

program
  .command('deploy')
  .description('Launch interactive deployment generator for Render, Railway, Vercel, or Docker')
  .action(deployCommand);

program
  .command('docker:up')
  .description('Spin up containerized development environment using Docker Compose')
  .action(dockerUpCommand);

program
  .command('docker:down')
  .description('Stop and remove running local Docker containers')
  .action(dockerDownCommand);

// Custom 'help' command — no conflict since addHelpCommand(false) is set above
program
  .command('help')
  .description('Display detailed command usage and architectural instructions')
  .action(helpCommand);

// Catch-all for unknown/invalid subcommands (e.g. `webiu asdf`)
program.on('command:*', (operands) => {
  console.error(chalk.red(`\nCommand not found: "${operands[0]}". See available commands below: :(\n`));
  helpCommand();
  process.exit(1);
});

program.parse(process.argv);

// If no arguments are given at all, show the help screen
if (!process.argv.slice(2).length) {
  helpCommand();
}
