import concurrently from 'concurrently';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';

export async function devCommand() {
  console.log(`\n${chalk.bold.cyan('Starting Webiu Development Server (Frontend + Backend)... :D')}\n`)

  // Guard: check webiu-server and webiu-ui exist before attempting to launch
  const serverDir = path.join(process.cwd(), 'webiu-server')
  const uiDir = path.join(process.cwd(), 'webiu-ui')

  if (!await fs.pathExists(serverDir) || !await fs.pathExists(uiDir)) {
    console.error(chalk.red('\nError: webiu-server or webiu-ui directories not found in current directory! :('))
    console.error(chalk.yellow('Make sure you have run `npx webiu init` first and are inside your project directory.'))
    console.error(chalk.yellow(`Expected: ${chalk.cyan(serverDir)}`))
    console.error(chalk.yellow(`Expected: ${chalk.cyan(uiDir)}\n`))
    process.exit(1)
  }

  // Guard: check node_modules exist in both, remind user to install if not
  const serverModules = path.join(serverDir, 'node_modules')
  const uiModules = path.join(uiDir, 'node_modules')
  if (!await fs.pathExists(serverModules) || !await fs.pathExists(uiModules)) {
    console.error(chalk.red('\nError: node_modules not found in webiu-server or webiu-ui! :('))
    console.error(chalk.yellow('Please run the following commands first:'))
    console.error(chalk.cyan('  cd webiu-server && npm install && cd ..'))
    console.error(chalk.cyan('  cd webiu-ui && npm install && cd ..\n'))
    process.exit(1)
  }

  console.log(chalk.gray('  Backend API : http://localhost:3000'))
  console.log(chalk.gray('  Frontend UI : http://localhost:4200'))
  console.log(chalk.gray('  Press Ctrl+C to stop all servers\n'))

  try {
    const { result } = concurrently(
      [
        {
          command: 'npm run start:dev',
          name: 'backend',
          cwd: serverDir,
          prefixColor: 'blue',
        },
        {
          command: 'npm start',
          name: 'frontend',
          cwd: uiDir,
          prefixColor: 'green',
        },
      ],
      {
        prefix: 'name',
        killOthersOn: ['failure'],
        restartTries: 0,
      }
    )

    await result
  } catch (err) {
    console.error(chalk.red('\nDevelopment servers stopped unexpectedly:'), err)
  }
}

export async function buildCommand() {
  console.log(`\n${chalk.bold.cyan('Building production bundles for Webiu... XD')}\n`)

  const serverDir = path.join(process.cwd(), 'webiu-server')
  const uiDir = path.join(process.cwd(), 'webiu-ui')

  if (!await fs.pathExists(serverDir) || !await fs.pathExists(uiDir)) {
    console.error(chalk.red('Error: webiu-server or webiu-ui directories not found. Run `npx webiu init` first.'))
    process.exit(1)
  }

  const { execa } = await import('execa')

  console.log(chalk.cyan('Building NestJS backend...'))
  await execa('npm', ['run', 'build'], { cwd: serverDir, stdio: 'inherit' })

  console.log(chalk.cyan('\nBuilding Angular frontend...'))
  await execa('npm', ['run', 'build'], { cwd: uiDir, stdio: 'inherit' })

  console.log(chalk.green('\nBuild complete! XD'))
}
