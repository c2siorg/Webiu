import chalk from 'chalk';
import { VERSION } from '../constants';

export function helpCommand() {
  console.log(`
${chalk.bold.hex('#7B8CFF')('╭──────────────────────────────────────────────────────────────╮')}
${chalk.bold.hex('#7B8CFF')('│')}  ${chalk.bold.white('WEBIU CLI')}  ${chalk.gray(`v${VERSION}`)}  ${chalk.hex('#7B8CFF')('·')}  ${chalk.gray('by Ceylon Computer Science Institute')}        ${chalk.bold.hex('#7B8CFF')('│')}
${chalk.bold.hex('#7B8CFF')('╰──────────────────────────────────────────────────────────────╯')}

${chalk.bold('Usage:')} ${chalk.cyan('webiu')} ${chalk.gray('[command]')}

${chalk.bold.green('Commands:')}
  ${chalk.bold.cyan('init')}            Interactively initialize a new Webiu portal project
  ${chalk.bold.cyan('dev')}             Start local development servers (Frontend + Backend)
  ${chalk.bold.cyan('build')}           Build production assets for webiu-ui and webiu-server
  ${chalk.bold.cyan('config')}          Re-configure org, theme, DB, or admin credentials
  ${chalk.bold.cyan('deploy')}          Generate deployment files (Render, Railway, Vercel, Docker)
  ${chalk.bold.cyan('docker:up')}       Start local Docker containers (PostgreSQL DB)
  ${chalk.bold.cyan('docker:down')}     Stop and remove local Docker containers
  ${chalk.bold.cyan('help')}            Display this help manual

${chalk.bold.green('Flags:')}
  ${chalk.bold.cyan('-V, --version')}   Output the current CLI version
  ${chalk.bold.cyan('-h, --help')}      Display help information

${chalk.bold.magenta('Examples:')}
  ${chalk.gray('$')} ${chalk.cyan('webiu init')}
  ${chalk.gray('$')} ${chalk.cyan('webiu dev')}
  ${chalk.gray('$')} ${chalk.cyan('webiu config')}
  ${chalk.gray('$')} ${chalk.cyan('webiu deploy')}
  ${chalk.gray('$')} ${chalk.cyan('webiu -V')}

${chalk.bold.green('URLs after webiu dev:')}
  ${chalk.gray('Frontend UI →')}  ${chalk.underline.blue('http://localhost:4200')}
  ${chalk.gray('Backend API →')}  ${chalk.underline.blue('http://localhost:5050')}

${chalk.gray('Documentation:')} ${chalk.underline.blue('https://github.com/c2siorg/Webiu')}
${chalk.gray('Maintainers: Ceylon Computer Science Institute (C2SI)')}
`);
}
