import concurrently from 'concurrently';
import chalk from 'chalk';
import path from 'path';

export async function devCommand() {
  console.log(`\n${chalk.bold.cyan('Starting Webiu Development Server (Frontend + Backend)... :D')}\n`);

  try {
    const { result } = concurrently(
      [
        {
          command: 'npm run start:dev',
          name: 'backend',
          cwd: path.join(process.cwd(), 'webiu-server'),
          prefixColor: 'blue',
        },
        {
          command: 'npm start',
          name: 'frontend',
          cwd: path.join(process.cwd(), 'webiu-ui'),
          prefixColor: 'green',
        },
      ],
      {
        prefix: 'name',
        killOthers: ['failure', 'success'],
        restartTries: 3,
      }
    );

    await result;
  } catch (err) {
    console.error(chalk.red('Error running development servers:'), err);
  }
}

export async function buildCommand() {
  console.log(`\n${chalk.bold.cyan('Building production bundles for Webiu... XD')}\n`);
  // Build handlers
}

export async function configCommand() {
  console.log(`\n${chalk.bold.cyan('Launching Webiu Configuration Manager...')}\n`);
}
