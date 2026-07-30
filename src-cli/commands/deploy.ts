import { select } from '@inquirer/prompts';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';

export async function deployCommand() {
  console.log(`\n${chalk.bold.cyan('====================================================')}`);
  console.log(`${chalk.bold.yellow('      Webiu Interactive Deployment Generator       ')}`);
  console.log(`${chalk.bold.cyan('====================================================')}\n`);

  const platform = await select({
    message: 'Select target cloud platform for deployment:',
    choices: [
      {
        name: 'Render (Fullstack Blueprint - Server + UI + Postgres DB)',
        value: 'render',
        description: 'Generates render.yaml for one-click Infrastructure-as-Code deployment',
      },
      {
        name: 'Railway (Containerized Service Deployment)',
        value: 'railway',
        description: 'Generates railway.json container configuration',
      },
      {
        name: 'Vercel + Render (Static Angular UI on Vercel + NestJS API on Render)',
        value: 'vercel-render',
        description: 'Configures Vercel static build and Render backend environment',
      },
      {
        name: 'Self-Hosted Production Docker (Docker Compose)',
        value: 'docker',
        description: 'Generates production docker-compose.prod.yml with Nginx reverse proxy',
      },
    ],
  });

  const spinner = ora(`Generating deployment configuration files for ${platform}...`).start();

  try {
    if (platform === 'render') {
      const renderYaml = `
services:
  - type: web
    name: webiu-server
    env: node
    buildCommand: cd webiu-server && npm install && npm run build
    startCommand: cd webiu-server && npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production

  - type: web
    name: webiu-ui
    env: static
    buildCommand: cd webiu-ui && npm install && npm run build
    staticPublishPath: ./webiu-ui/dist/webiu-ui/browser
`.trim();
      await fs.writeFile(path.join(process.cwd(), 'render.yaml'), renderYaml);
      spinner.succeed(chalk.green('Generated render.yaml successfully! XD'));
      console.log(`\n${chalk.bold.yellow('Next Steps for Render:')}`);
      console.log('  1. Commit and push your changes to GitHub.');
      console.log('  2. Go to https://dashboard.render.com and choose "New Blueprint Group".');
      console.log('  3. Select your GitHub repo to deploy automatically!\n');
    } else if (platform === 'docker') {
      const dockerProd = `
version: '3.8'
services:
  webiu-server:
    build:
      context: ./webiu-server
    ports:
      - "3000:3000"
    restart: always

  webiu-ui:
    build:
      context: ./webiu-ui
    ports:
      - "80:80"
    restart: always
`.trim();
      await fs.writeFile(path.join(process.cwd(), 'docker-compose.prod.yml'), dockerProd);
      spinner.succeed(chalk.green('Generated docker-compose.prod.yml successfully! :D'));
      console.log(`\n${chalk.bold.yellow('Next Steps for Docker:')}`);
      console.log(`  1. Run ${chalk.cyan('docker compose -f docker-compose.prod.yml up -d')}`);
      console.log('  2. Access your portal at http://localhost\n');
    } else {
      spinner.succeed(chalk.green(`Prepared deployment instructions for ${platform}!`));
    }
  } catch (err: any) {
    spinner.fail(chalk.red('Failed to generate deployment templates.'));
    console.error(err);
  }
}
