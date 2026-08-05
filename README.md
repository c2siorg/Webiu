# WEBIU CLI (`create-webiu`)

The Official Command Line Interface and Scaffolding Engine for Webiu Community Portals.

[![NPM Version](https://img.shields.io/npm/v/create-webiu.svg)](https://www.npmjs.com/package/create-webiu)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## OVERVIEW AND PREVIEW

![Webiu CLI Terminal Preview](./src-cli/assets/Webiu-CLI%20preview.png)

Webiu is an open-source community portal platform designed to help organizations showcase open-source projects, display member portfolios, coordinate Google Summer of Code (GSoC) activities, manage publications, and aggregate community contributions.

The platform is architected as a fullstack monorepo consisting of:
1. **Frontend Interface (`webiu-ui`)**: Built with modern Angular, providing responsive layouts, theme accent customization, dynamic component rendering, and client-side data binding.
2. **Backend API Service (`webiu-server`)**: Built with NestJS, offering REST endpoints, GraphQL queries, authentication middleware, and database connectivity.

Setting up a complete community portal manually requires cloning repositories, configuring database connection strings, managing environment variables across client and server environments, and setting up Docker containers.

The `create-webiu` CLI automates this end-to-end workflow into an interactive prompt wizard that scaffolds, builds, configures, and deploys your custom Webiu portal within minutes.

---

## QUICK START: GETTING STARTED IN 5 STEPS

Follow these instructions to create and launch a new Webiu portal on your local machine.

### Step 1: Install the CLI Globally

Install the CLI globally on your system using npm:

```bash
npm install -g create-webiu
```

### Step 2: Initialize a New Community Portal

Run the interactive setup wizard:

```bash
webiu init
```

Alternatively, specify a target directory name directly:

```bash
webiu init --name my-community-portal
```

During initialization, the CLI will guide you through an interactive setup wizard in your terminal:
- **Project Directory Name**: Name of the folder where the portal will be generated.
- **Organization Name**: The display name of your organization.
- **Organization Type**: Choose from Open Source Community, Non-Profit Organization, Startup / Personal Project, or Custom / Blank Setup.
- **GitHub Organization / Username**: GitHub handle used to pull repository metadata and contributors automatically.
- **Database Strategy**: Select between Local Docker PostgreSQL container (automatic setup) or Remote PostgreSQL URL.
- **Theme Accent Color**: Choose a primary branding color swatch (Ocean Blue, Emerald Green, Deep Purple, Sunset Crimson, Amber Gold, or Rose Pink).
- **Navbar Section Selector**: Interactively check which portal sections to enable (Projects, Publications, Contributors, Community, Opportunities, GSoC).
- **Admin Setup**: Configure administrator account credentials.

### Step 3: Navigate into the Project Folder

```bash
cd my-community-portal
```

### Step 4: Install Dependencies

Install required node modules for both the frontend UI and backend server:

```bash
cd webiu-server && npm install && cd ../webiu-ui && npm install && cd ..
```

### Step 5: Start Local Development Servers

Launch both frontend and backend development servers concurrently:

```bash
webiu dev
```

Once running, access your local application at:
- **Frontend Application UI**: http://localhost:4200
- **Backend API Service**: http://localhost:5050 (or http://localhost:3000)

---

## ZERO-INSTALL EXECUTION VIA NPX

If you prefer not to install the CLI globally, execute any command directly using `npx`:

```bash
npx create-webiu init        # Replaces: webiu init
npx create-webiu dev         # Replaces: webiu dev
npx create-webiu build       # Replaces: webiu build
npx create-webiu config      # Replaces: webiu config
npx create-webiu deploy      # Replaces: webiu deploy
npx create-webiu docker:up   # Replaces: webiu docker:up
npx create-webiu docker:down # Replaces: webiu docker:down
npx create-webiu help        # Replaces: webiu help
```

---

## ARCHITECTURE AND WORKFLOW PIPELINE

The CLI operates through a structured four-phase pipeline:

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ 1. INITIALIZATION PHASE (webiu init)                                              │
│    - Interactive terminal prompt wizard collects portal parameters                │
│    - Displays real-time live configuration summary card                           │
└───────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│ 2. SCAFFOLDING & INJECTION PHASE                                                  │
│    - Clones repository structure and template files                               │
│    - Injects root .env, webiu-server/.env, and webiu-ui/src/assets/config.json    │
│    - Configures database credentials and theme accent styling                     │
└───────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│ 3. DEVELOPMENT & TESTING PHASE (webiu dev / webiu docker:up)                      │
│    - Validates database connectivity and Docker container status                  │
│    - Concurrently runs Angular (port 4200) and NestJS (port 5050) with hot reload │
└───────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│ 4. DEPLOYMENT PHASE (webiu deploy)                                                │
│    - Scaffolds tailored Infrastructure-as-Code manifests                          │
│    - Supports Render, Railway, Vercel, and Production Docker Compose              │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## COMPLETE COMMAND REFERENCE MANUAL

```
Usage: webiu [command] [options]

Commands:
  init          Interactively initialize a new Webiu portal project
  dev           Start local development servers (Frontend + Backend concurrently)
  build         Build production assets for both webiu-ui and webiu-server
  config        Re-configure organization metadata, branding, DB, or admin credentials
  deploy        Launch interactive deployment generator for Render, Railway, Vercel, or Docker
  doctor        Run Homebrew-style self-diagnostics and project health check
  docker:up     Start local Docker containers (PostgreSQL database)
  docker:down   Stop and remove local Docker containers
  help          Display detailed command usage and instructions

Options:
  -V, --version Output the current CLI version
  -h, --help    Display help information
```

### Detailed Command Explanations

#### 1. `webiu init`
Initializes a new Webiu portal application using an ultra-aesthetic 8-step progress logger (`[1/8]` through `[8/8]`). Displays an interactive terminal setup wizard with real-time live summary updates and generates the project structure with configured environment files.

#### 2. `webiu doctor`
Runs a Homebrew-style (`brew doctor`) self-diagnostic audit of your system and workspace. Checks 8 critical operational pillars:
- **Node.js Environment**: Verifies Node.js version (`>= 18.0.0`).
- **Package Manager & Git**: Verifies `npm` and `git` binaries are accessible.
- **Docker Engine**: Probes Docker daemon readiness (`docker info`).
- **Webiu Workspace**: Validates `webiu-server`, `webiu-ui`, and root `.env`.
- **Framework Diagnostics**: Detects Angular (`@angular/core`) and NestJS (`@nestjs/core`) framework versions.
- **PostgreSQL Connectivity**: Probes database port (`5433` or parsed connection string) via TCP socket.
- **Environment & Secrets**: Validates `JWT_SECRET`, default admin credentials, and checks if `GITHUB_TOKEN` is present.

If issues are found, `webiu doctor` displays a clean remediation guide with exact steps to resolve warnings (`⚠`) and errors (`✘`).

#### 3. `webiu dev`
Executes pre-flight checks (database connectivity and Docker daemon state) and starts both Angular frontend (`http://localhost:4200`) and NestJS backend (`http://localhost:5050`) in parallel using hot-reloading development servers.

#### 4. `webiu build`
Triggers production compilation for both `webiu-ui` and `webiu-server`, placing optimized build artifacts ready for production deployment.

#### 5. `webiu config`
Launches the re-configuration utility on an existing Webiu project. Allows updating organization details, theme accent colors, active navbar sections, database connection settings, and admin passwords without re-cloning or re-scaffolding.

#### 6. `webiu deploy`
Generates platform-specific Infrastructure-as-Code deployment configurations based on interactive prompts.

Supported Deployment Targets:
- **Render**: Generates `render.yaml` blueprint file for single-click fullstack web service and database deployment.
- **Railway**: Generates `railway.json` infrastructure configuration.
- **Vercel + Render Hybrid**: Generates `vercel.json` for hosting the Angular frontend on Vercel while connecting to NestJS hosted on Render.
- **Self-Hosted Docker**: Generates `docker-compose.prod.yml` configured with an Nginx reverse proxy and containerized PostgreSQL database.

#### 7. `webiu docker:up`
Spins up local PostgreSQL database containers in detached mode using Docker Compose.

#### 8. `webiu docker:down`
Stops and removes local Docker database containers.

---

## AUTOMATED UPDATE NOTIFICATIONS

The CLI includes an automatic background update checker (`updater.ts`). Whenever a command is run, the CLI asynchronously checks the NPM registry for newer releases (cached locally for 24 hours). If an update is available, a clean update card is displayed at process completion:

```
╭─────────────────────────────────────────────────────────────╮
│  Update available!  v2.1.0 → v2.2.0                         │
│  Run: npm install -g create-webiu to update to latest       │
╰─────────────────────────────────────────────────────────────╯
```

---

## MAINTAINERS AND CREDITS

- **Creator and Lead Architect**: [Tarunya Kesharwani](https://github.com/TarunyaProgrammer/)
- **Maintainer Organization**: [Ceylon Computer Science Institute (C2SI)](https://github.com/c2siorg/Webiu/)

---

## LICENSE

This project is licensed under the **MIT License**. See the `LICENSE` file for details.