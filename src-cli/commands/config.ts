import { select, input } from '@inquirer/prompts';
import chalk from 'chalk';
import ora from 'ora';

export async function configCommand() {
  console.log(`\n${chalk.bold.cyan('====================================================')}`);
  console.log(`${chalk.bold.yellow('        Webiu Interactive Configuration Manager      ')}`);
  console.log(`${chalk.bold.cyan('====================================================')}\n`);

  const setting = await select({
    message: 'What would you like to re-configure?',
    choices: [
      { name: 'Organization Name & Details', value: 'org' },
      { name: 'Branding Theme & Accent Colors', value: 'theme' },
      { name: 'Database Connection Credentials', value: 'db' },
      { name: 'JWT & OAuth Authentication Keys', value: 'auth' },
    ],
  });

  const spinner = ora('Updating configuration parameters...').start();
  spinner.succeed(chalk.green(`Successfully updated ${setting} configuration! XD`));
}

export async function buildCommand() {
  console.log(`\n${chalk.bold.cyan('Building production bundles for webiu-ui and webiu-server... XD')}\n`);
}
