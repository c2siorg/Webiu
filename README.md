# WEBIU CLI (`create-webiu`)

> The Official Command Line Interface and Scaffolding Engine for Webiu Community Portals.

[![NPM Version](https://img.shields.io/npm/v/create-webiu.svg)](https://www.npmjs.com/package/create-webiu)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## WHAT IS WEBIU?

**Webiu** is an open-source community portal platform built to help organizations showcase their projects, manage memberships, and track open-source contributions. It is built on **Angular** (frontend) and **NestJS** (backend API with GraphQL support).

Previously, setting up Webiu required manually cloning the repository, hand-editing environment files, configuring Angular, and managing Docker containers one by one. This CLI removes all of that friction. XD

---

## START HERE -- YOUR FIRST 5 COMMANDS

If you are brand new to Webiu, open your terminal and follow these steps in order:

```
STEP 1 -- Install the CLI globally (run this once, ever)
---------------------------------------------------------
npm install -g create-webiu


STEP 2 -- Create your new community portal
---------------------------------------------------------
webiu init


STEP 3 -- Enter your project folder
---------------------------------------------------------
cd your-project-name


STEP 4 -- Install project dependencies
---------------------------------------------------------
cd webiu-server && npm install && cd ../webiu-ui && npm install && cd ..


STEP 5 -- Start your local development server
---------------------------------------------------------
webiu dev

    Frontend UI  ->  http://localhost:4200
    Backend API  ->  http://localhost:3000
```

After Step 2, the interactive wizard will appear in your terminal and ask you a series of dropdown selection questions about your organization, database, branding, and deployment preferences. No manual file editing required.

---

## USING WITHOUT GLOBAL INSTALL

If you prefer not to install globally, you can use `npx` instead for every command:

```bash
npx create-webiu init        # replaces: webiu init
npx create-webiu dev         # replaces: webiu dev
npx create-webiu deploy      # replaces: webiu deploy
npx create-webiu help        # replaces: webiu help
```

The behavior is identical. The difference is that `npx` fetches the CLI from your local `node_modules` folder each time, while the global install makes the `webiu` command available system-wide in your terminal.

---

## ARCHITECTURE & WORKFLOW PIPELINE

1. **Initialization Phase (`webiu init`)**
   - User runs interactive CLI setup wizard in terminal.
   - Selects Organization metadata, DB strategy (Docker Postgres / Remote / SQLite), branding accent theme, and deployment target via dropdown menus.

2. **Scaffolding & Configuration Phase**
   - CLI automatically clones latest Webiu source code into a clean project directory.
   - Injects root `.env` and `webiu-server/.env` with database and secret credentials.
   - Configures Angular runtime settings in `webiu-ui/src/assets/config.json`.

3. **Development Phase (`webiu dev`)**
   - Concurrently launches Angular Frontend (`http://localhost:4200`) and NestJS API Backend (`http://localhost:5050`) with live hot-reloading.
   - Pre-flight checks if the database is reachable and warns if Docker is not running.

4. **Deployment Phase (`webiu deploy`)**
   - Interactively scaffolds tailored Infrastructure-as-Code manifests for Render, Railway, Vercel, or production Docker Compose.

---

## COMMAND REFERENCE MANUAL

Run `webiu help` at any time to display this in your terminal.

```
Usage: webiu [command]

Commands:
  init          Interactively initialize a new Webiu portal project
  dev           Start local development servers (Frontend + Backend concurrently)
  build         Build production assets for both webiu-ui and webiu-server
  config        Re-configure organization metadata, branding, DB, or admin credentials
  deploy        Launch interactive deployment generator for Render, Railway, Vercel, or Docker
  docker:up     Start local Docker containers (PostgreSQL database)
  docker:down   Stop and remove local Docker containers
  help          Display detailed command usage and instructions

Flags:
  -V, --version Output the current CLI version
  -h, --help    Display help information

Examples:
  $ webiu init
  $ webiu dev
  $ webiu deploy
  $ webiu -V
```

---

## DEPLOYMENT GENERATOR

Generates production-ready deployment configuration files for your target platform.

```bash
webiu deploy
```

Supported platforms and what gets generated:

- **Render**: `render.yaml` Blueprint for one-click fullstack deployment with managed PostgreSQL.
- **Railway**: `railway.json` container service configuration.
- **Vercel + Render**: `vercel.json` for Angular static hosting on Vercel, plus NestJS on Render.
- **Self-Hosted Docker**: `docker-compose.prod.yml` with Nginx reverse proxy and containerized database.

---

## FUTURE ROADMAP

Planned features for upcoming releases:

- [ ] Plugin and Extension Marketplace: `webiu add analytics`, `webiu add oauth-discord`
- [ ] Interactive Component Generator: `webiu generate component team-member`
- [ ] Database Migration Assistant: `webiu db:migrate`, `webiu db:seed`
- [ ] AI-Powered Setup Assistant: Automatically pull GitHub org metadata, logos, and repository stats during `webiu init`

---

## CREDITS AND MAINTAINERS

- **Creator and Lead Architect**: [Tarunya Kesharwani](https://github.com/TarunyaProgrammer/) XD
- **Maintainer Organization**: [C2SI (Ceylon Computer Science Institute)](https://github.com/c2siorg/Webiu/)

---

## LICENSE

This project is licensed under the **MIT License**. See the `LICENSE` file for details.