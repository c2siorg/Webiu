import chalk from 'chalk';

export async function helpCommand() {
  console.log(`
${chalk.bold.cyan('====================================================================')}
${chalk.bold.yellow('                        WEBIU CLI TOOL - HELP MANUAL                ')}
${chalk.bold.cyan('====================================================================')}

${chalk.bold('Usage:')} webiu [command] [options]

${chalk.bold.green('Commands:')}
  ${chalk.bold.cyan('init')}          Interactively initialize a new Webiu portal project
  ${chalk.bold.cyan('dev')}           Start local development server (Frontend + Backend concurrently)
  ${chalk.bold.cyan('build')}         Build production assets for both webiu-ui and webiu-server
  ${chalk.bold.cyan('config')}        Re-configure Organization metadata, branding, or environment variables
  ${chalk.bold.cyan('deploy')}        Launch interactive deployment generator for Render, Railway, Vercel, or Docker
  ${chalk.bold.cyan('docker:up')}     Spin up containerized development environment using Docker Compose
  ${chalk.bold.cyan('docker:down')}   Stop and remove running local Docker containers
  ${chalk.bold.cyan('help')}          Display detailed command usage and architectural instructions

${chalk.bold.green('Options:')}
  ${chalk.bold.cyan('-v, --version')} Output the current version of webiu
  ${chalk.bold.cyan('-h, --help')}    Display help information for command

${chalk.bold.magenta('Examples:')}
  $ ${chalk.cyan('npx webiu init')}
  $ ${chalk.cyan('npx webiu dev')}
  $ ${chalk.cyan('npx webiu deploy')}

${chalk.gray('For detailed online documentation, visit:')} ${chalk.underline.blue('https://github.com/c2siorg/Webiu')}
${chalk.gray('Maintainers: C2SI Organization (Community Software Infrastructure)')} XD
`);
}
