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
npx webiu dev                # replaces: webiu dev
npx webiu deploy             # replaces: webiu deploy
npx webiu help               # replaces: webiu help
```

The behavior is identical. The difference is that `npx` fetches the CLI from your local `node_modules` folder each time, while the global install makes the `webiu` command available system-wide in your terminal.

---

## SYSTEM ARCHITECTURE

Webiu follows a decoupled architecture with three components:

```
+-----------------------------------------------------------------------+
|               webiu init  (Interactive Setup Wizard)                  |
+-----------------------------------------------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                    INTERACTIVE TERMINAL DROPDOWNS                     |
|  - Organization Metadata and Name                                     |
|  - Database Engine (PostgreSQL Container / Remote / SQLite)           |
|  - UI Branding Accent Color Theme                                     |
|  - Cloud Deployment Target Platform                                   |
+-----------------------------------------------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|              PROJECT CLONING AND CONFIGURATION                        |
|  - Clones Webiu source from GitHub                                    |
|  - Injects .env files for backend (webiu-server)                      |
|  - Configures Angular runtime assets (webiu-ui/src/assets/config.json)|
+-----------------------------------------------------------------------+
                                    |
                   +----------------+----------------+
                   |                                 |
                   v                                 v
+-----------------------------------+ +-------------------------------+
|         webiu dev                 | |       webiu deploy            |
| Concurrently launches:            | | Interactively generates       |
|   Frontend  ->  http://localhost:4200| Render, Railway, or Docker |
|   Backend   ->  http://localhost:3000| deployment configuration   |
+-----------------------------------+ +-------------------------------+
```

---

## COMMAND REFERENCE MANUAL

Run `webiu help` at any time to display this in your terminal.

```
====================================================================
                        WEBIU CLI TOOL - HELP MANUAL
====================================================================

Usage: webiu [command] [options]

Commands:
  init          Interactively initialize a new Webiu portal project
  dev           Start local development server (Frontend + Backend concurrently)
  build         Build production assets for both webiu-ui and webiu-server
  config        Re-configure Organization metadata, branding, or environment variables
  deploy        Launch interactive deployment generator for Render, Railway, Vercel, or Docker
  docker:up     Spin up containerized development environment using Docker Compose
  docker:down   Stop and remove running local Docker containers
  help          Display detailed command usage and architectural instructions

Options:
  -v, --version Output the current version of webiu
  -h, --help    Display help information for command

Examples:
  $ webiu init
  $ webiu dev
  $ webiu deploy
  $ webiu help
```

---

## DEPLOYMENT GENERATOR

Generates production-ready deployment configuration files for your target platform.

```bash
webiu deploy
```

```
+-----------------------------------------------------------------------+
|                         webiu deploy                                  |
+-----------------------------------------------------------------------+
                                    |
        +--------------------------+--------------------------+
        |                          |                          |
        v                          v                          v
+-------------------+   +--------------------+   +--------------------+
|  RENDER PLATFORM  |   |  RAILWAY PLATFORM  |   |  DOCKER SELF-HOST  |
| Generates         |   | Generates          |   | Generates          |
| render.yaml       |   | railway.json       |   | docker-compose.    |
|                   |   |                    |   | prod.yml           |
+-------------------+   +--------------------+   +--------------------+
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