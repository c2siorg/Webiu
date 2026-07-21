import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init';
import { devCommand } from './commands/dev';
import { buildCommand, configCommand } from './commands/config';
import { deployCommand } from './commands/deploy';
import { helpCommand } from './commands/help';
import { dockerUpCommand, dockerDownCommand } from './commands/docker';

const program = new Command();

program
  .name('webiu')
  .description('CLI tool to generate, configure, and deploy Webiu community portals')
  .version('1.0.0');

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

program
  .command('help')
  .description('Display detailed command usage and architectural instructions')
  .action(helpCommand);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  helpCommand();
}
