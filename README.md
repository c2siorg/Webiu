# WEBIU CLI (`create-webiu`)

Interactive Command Line Tool and NPM Package to generate, configure, run, and deploy Webiu Open-Source Community Portals.

---

## ARCHITECTURE OVERVIEW

Webiu turns a complex web application codebase into a simple, single-command terminal generator. Instead of manually cloning repositories, editing environment files, and setting up databases by hand, developers can run a single interactive CLI wizard.

+-----------------------------------------------------------------------+
|                       npx create-webiu init                           |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                    INTERACTIVE TERMINAL DROPDOWNS                     |
|  - Organization Name & Metadata                                       |
|  - Database Strategy (PostgreSQL Container / Remote / SQLite)          |
|  - Branding Accent Color Theme                                        |
|  - Deployment Platform Selection                                      |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                    PROJECT GENERATION & SCAFFOLDING                   |
|  - Injects dynamic environment variables into .env                    |
|  - Scaffolds webiu-ui Angular configuration                           |
|  - Configures webiu-server NestJS API endpoints                       |
+-----------------------------------------------------------------------+
                                   |
                  +----------------+----------------+
                  |                                 |
                  v                                 v
+-----------------------------------+   +-------------------------------+
|         npx webiu dev             |   |        npx webiu deploy       |
| Spins up Frontend (Port 4200)     |   | Generates Render, Railway,    |
| & Backend (Port 3000) concurrently|   | or Docker deployment files    |
+-----------------------------------+   +-------------------------------+

---

## QUICK START

### 1. Initialize Project
Run the interactive wizard in your terminal :D:

```bash
npx create-webiu init
```
or
```bash
npx webiu init
```

### 2. Start Local Development
Launch both the Angular UI and NestJS API server concurrently:

```bash
npx webiu dev
```

- **Frontend UI**: http://localhost:4200
- **Backend API**: http://localhost:3000

---

## COMMAND REFERENCE MANUAL

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
```

---

## DEPLOYMENT GENERATOR

Generates production-ready deployment manifests tailored to your platform of choice.

```bash
npx webiu deploy
```

+-----------------------------------------------------------------------+
|                           npx webiu deploy                            |
+-----------------------------------------------------------------------+
                                   |
        +--------------------------+--------------------------+
        |                          |                          |
        v                          v                          v
+------------------+     +-------------------+     +--------------------+
|  RENDER PLATFORM |     |  RAILWAY PLATFORM |     | SELF-HOSTED DOCKER |
| Generates        |     | Generates         |     | Generates          |
| render.yaml      |     | railway.json      |     | docker-compose.prod|
+------------------+     +-------------------+     +--------------------+

---

## CREDITS AND MAINTAINERS

- **Creator & Lead Developer**: [Tarunya Kesharwani](https://github.com/TarunyaProgrammer/) XD
- **Organization & Sponsor**: [C2SI Organization (Community Software Infrastructure)](https://github.com/c2siorg/Webiu/)

---

## LICENSE

Distributed under the MIT License. See LICENSE for more information.