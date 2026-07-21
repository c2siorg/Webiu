import { execa } from 'execa';
import chalk from 'chalk';

export async function dockerUpCommand() {
  console.log(`\n${chalk.bold.cyan('Starting Docker containerized environment... :D')}\n`);
  try {
    await execa('docker', ['compose', 'up', '-d'], { stdio: 'inherit' });
    console.log(chalk.green('\nDocker containers started successfully! XD'));
  } catch (err) {
    console.error(chalk.red('Failed to start Docker containers:'), err);
  }
}

export async function dockerDownCommand() {
  console.log(`\n${chalk.bold.cyan('Stopping Docker containerized environment...')}\n`);
  try {
    await execa('docker', ['compose', 'down'], { stdio: 'inherit' });
    console.log(chalk.green('\nDocker containers stopped cleanly.'));
  } catch (err) {
    console.error(chalk.red('Failed to stop Docker containers:'), err);
  }
}
