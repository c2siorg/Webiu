# WEBIU CLI (`create-webiu`)

> **The Official Command Line Interface & Scaffolding Engine for Webiu Community Portals.**

[![NPM Version](https://img.shields.io/npm/v/create-webiu.svg)](https://www.npmjs.com/package/create-webiu)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 EXECUTIVE SUMMARY

**Webiu** is an open-source community portal platform built to streamline developer community engagement, member management, project showcases, and open-source contribution tracking.

Historically, deploying a Webiu instance required manual repository cloning, manual environment file (`.env`) creation, manual Angular configuration edits, and local PostgreSQL container setup. 

With **`create-webiu`**, the entire process is condensed into a single interactive terminal CLI. Developers can initialize, customize, test locally, and scaffold production cloud deployments (Render, Railway, Vercel, Docker) directly from command line selection menus without touching raw configuration boilerplate! XD

---

## 📐 SYSTEM ARCHITECTURE

Webiu follows a decoupled microservice-like architecture composed of an **Angular Single Page Application (`webiu-ui`)**, a **NestJS Backend REST & GraphQL API (`webiu-server`)**, and the **TypeScript CLI Engine (`create-webiu`)**.

```
+-----------------------------------------------------------------------+
|                         npx create-webiu init                         |
+-----------------------------------------------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                    INTERACTIVE TERMINAL DROPDOWNS                     |
|  - Organization Metadata & Name                                       |
|  - Database Strategy (PostgreSQL Container / Remote / SQLite)           |
|  - UI Branding Accent Palette                                         |
|  - Cloud Deployment Target Selection                                  |
+-----------------------------------------------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                    PROJECT GENERATION & SCAFFOLDING                   |
|  - Injects dynamic environment variables into root .env               |
|  - Configures Angular UI runtime assets (webiu-ui)                    |
|  - Prepares NestJS backend API parameters (webiu-server)              |
+-----------------------------------------------------------------------+
                                    |
                  +-----------------+-----------------+
                  |                                   |
                  v                                   v
+-----------------------------------+   +-------------------------------+
|         npx webiu dev             |   |        npx webiu deploy       |
| Concurrently launches Frontend    |   | Interactively generates       |
| (Port 4200) & Backend (Port 3000) |   | Render, Railway, or Docker    |
+-----------------------------------+   +-------------------------------+
```

---

## ⚡ QUICK START & USAGE

### 1. Initialize a New Portal

Launch the interactive prompt wizard in your target workspace directory :D:

```bash
npx create-webiu init
```

*Short alias alternative:*
```bash
npx webiu init
```

The wizard will guide you through interactive selection menus:
- **Organization Type**: Open Source Community, Non-Profit, Startup, or Custom Setup.
- **Organization Metadata**: Organization Name and GitHub Org Username.
- **Database Connection**: Local PostgreSQL Docker container, Remote PostgreSQL connection string, or local SQLite light mode.
- **Branding Theme**: Primary color theme (Ocean Blue, Emerald Green, Deep Purple, Sunset Crimson).
- **Target Deployment Platform**: Render, Railway, Vercel + Render, or Self-Hosted Docker.

---

### 2. Local Development Execution

To start the full-stack local development environment with hot-reloading:

```bash
npx webiu dev
```

This command concurrently executes both sub-applications:
- **Angular Frontend UI**: Available at `http://localhost:4200`
- **NestJS REST & GraphQL Server API**: Available at `http://localhost:3000`

---

## 📖 COMMAND REFERENCE MANUAL

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

## 🚢 CLOUD DEPLOYMENT GENERATOR

Scaffold pre-configured deployment manifests with a single command:

```bash
npx webiu deploy
```

```
+-----------------------------------------------------------------------+
|                           npx webiu deploy                            |
+-----------------------------------------------------------------------+
                                    |
        +---------------------------+---------------------------+
        |                           |                           |
        v                           v                           v
+-------------------+       +--------------------+     +----------------+
|  RENDER PLATFORM  |       |  RAILWAY PLATFORM  |     |  DOCKER SWARM  |
| Generates         |       | Generates          |     | Generates      |
| render.yaml       |       | railway.json       |     | docker-compose |
+-------------------+       +--------------------+     +----------------+
```

### Supported Platforms:
1. **Render (Recommended)**: Auto-generates `render.yaml` for one-click Infrastructure-as-Code deployment.
2. **Railway**: Generates `railway.json` container configurations.
3. **Vercel + Render**: Prepares static Angular build for Vercel combined with NestJS REST API on Render.
4. **Self-Hosted Docker**: Generates production-ready `docker-compose.prod.yml` with containerized PostgreSQL and Nginx reverse proxy.

---

## 🔮 FUTURE ROADMAP & FEATURE PIPELINE

We are actively developing and refining new capabilities for upcoming CLI releases:

- [ ] **Plugin & Extension Marketplace**: Ability to install community add-ons (`npx webiu add analytics`, `npx webiu add oauth-discord`).
- [ ] **Interactive Component Generator**: CLI sub-commands to generate custom portal sections directly from terminal (`npx webiu generate component team-member`).
- [ ] **One-Command Database Migration Assistant**: Simplified CLI commands for database schema generation and seed management (`npx webiu db:migrate`, `npx webiu db:seed`).
- [ ] **AI-Powered Setup Assistant**: Optional integration with Gemini API to automatically pull GitHub organization metadata, logos, and repository stats during `npx webiu init`.

---

## 👤 CREDITS & MAINTAINERS

- **Creator & Lead Architect**: [Tarunya Kesharwani](https://github.com/TarunyaProgrammer/) XD
- **Maintainer Organization**: [C2SI (Community Software Infrastructure)](https://github.com/c2siorg/Webiu/)

---

## 📄 LICENSE

This project is licensed under the **MIT License**. See the `LICENSE` file for details.