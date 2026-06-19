# WebiU 2.0: C2SI/SCoRe Lab Website

<p align="center">
  <img width="400" height="auto" src="https://github.com/Grumpyyash/Webiu/blob/master/static/images/logo.png" alt="WebiU Logo">
</p>

<p align="center">
  <strong>The official web application for C2SI and SCoRe Lab</strong><br>
  Showcasing open-source projects, contributors, and community activity.
</p>

---

## Project Summary

**WebiU 2.0** is a full-stack web application designed to showcase C2SI and SCoRe Lab's open-source ecosystem. It syncs directly with GitHub to pull repository statistics, contributions, and contributor profiles into a local PostgreSQL database, enabling high-performance, real-time search and leaderboards without hitting GitHub API rate limits.

**Key Highlights:**

* **Database-Backed Sync** — Stores organization repository and contributor data in PostgreSQL to serve low-latency requests.
* **GitHub Webhook Integration** — Automatically updates the database when repositories are created, edited, archived, or deleted on GitHub.
* **Drift Reconciliation** — Runs a background cron job every 12 hours to reconcile any missed webhook events.
* **Administrator CMS Panel** — Secure dashboard to manage GSoC programs, project ideas, mentors, and global site settings.
* **Dark Mode** — Toggle between light and dark themes with persistent preference.
* **Modern Stack** — Built with Angular (standalone components) and NestJS.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Installation & Setup](#installation--setup)
   * [Backend Setup (webiu-server)](#backend-setup-webiu-server)
   * [Frontend Setup (webiu-ui)](#frontend-setup-webiu-ui)
   * [Running with Docker](#running-with-docker)
5. [Project Structure](#project-structure)
6. [API Endpoints](#api-endpoints)
7. [Linting & Code Quality](#linting--code-quality)
8. [Testing](#testing)
9. [Contributing](#contributing)
10. [Documentation](#documentation)
11. [License](#license)

---

## Features

| Feature | Description |
| :--- | :--- |
| **Project Dashboard** | Browse all repositories with real-time stats (stars, forks, languages, open issues, and PR counts). |
| **Contributor Leaderboards** | View aggregated contribution statistics across all repositories in the organization. |
| **Contributor Search** | Query by GitHub username to view individual issues and pull requests inside the organization. |
| **GSoC CMS & Explorer** | Manage GSoC programs, draft/publish project ideas, and map mentors dynamically from the admin panel. |
| **Admin Settings Panel** | Update the active GSoC year, site title, description, and toggle maintenance mode dynamically. |
| **Secure Admin Login** | Credentials-based administrator login secured with HttpOnly cookies and JWT sessions. |
| **Responsive Design** | Fully responsive layout optimized for desktop, tablet, and mobile browsers. |

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Angular 17+, TypeScript, SCSS, RxJS |
| **Backend** | NestJS 10, TypeScript, Express |
| **Database & ORM** | PostgreSQL, TypeORM |
| **API Integration** | GitHub REST API via Axios |
| **Authentication** | JWT Session via Secure HttpOnly Cookie |
| **Containerization** | Docker, Docker Compose |
| **Code Quality** | ESLint, Prettier, Husky (pre-commit hooks) |
| **Testing** | Jest (backend), Karma + Jasmine (frontend) |

---

## Prerequisites

Before you begin, ensure you have the following installed:

* **Node.js** v20.x or higher — [Download](https://nodejs.org/)
* **npm** v9.x or higher (ships with Node.js)
* **Angular CLI** v17.x or higher — Install globally: `npm install -g @angular/cli`
* **PostgreSQL** Database server (v14+) — [Download](https://www.postgresql.org/)
* **Git** — [Download](https://git-scm.com/)
* **Docker** (Optional for containerized run) — [Download](https://www.docker.com/)

You will also need:
1. A **GitHub Personal Access Token** (classic, no special scopes needed for public repo data) to raise rate limits. Get yours at [github.com/settings/tokens](https://github.com/settings/tokens).
2. A **GitHub Webhook Secret** (any custom secure string) if you plan to test webhook integration locally.

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/c2siorg/Webiu.git
cd Webiu
```

### 2. Install Root Dependencies (Husky)

The repository root manages **Husky** pre-commit hooks. Run this from the root directory:

```bash
npm install
```

---

### Backend Setup (`webiu-server`)

1. **Navigate to the server directory:**
   ```bash
   cd webiu-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in the required details:
   ```ini
   NODE_ENV=development
   PORT=5050
   JWT_SECRET=use_a_strong_random_secret_here
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=choose_a_secure_admin_password
   GITHUB_ACCESS_TOKEN=your_github_personal_access_token
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/webiu
   DATABASE_SSL=false
   GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
   FRONTEND_BASE_URL=http://localhost:4200
   ```

4. **Run Database Migrations:**
   TypeORM will automatically sync schemas in development, but you can run migrations manually:
   ```bash
   npm run migration:run
   ```

5. **Start the server:**
   ```bash
   npm run start:dev
   ```
   The backend will be available at **http://localhost:5050**.

---

### Frontend Setup (`webiu-ui`)

1. **Navigate to the UI directory:**
   ```bash
   cd ../webiu-ui
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local server:**
   ```bash
   ng serve
   ```
   Open **http://localhost:4200** in your browser.

---

### Running with Docker

You can run the entire stack (Angular, NestJS, and PostgreSQL) containerized.

#### Development Mode (With source-code watch support)
```bash
docker compose -f docker-compose.dev.yml up --build
```

#### Production Preview Mode (Serves UI via Nginx)
```bash
docker compose up --build
```

#### Docker Service URL Mapping
| Service | URL |
|---------|-----|
| Frontend | http://localhost:4200 |
| Backend | http://localhost:5050 |

---

## Project Structure

```
Webiu/
├── webiu-ui/                  # Angular frontend
│   └── src/app/
│       ├── components/        # Reusable UI components (navbar, cards)
│       ├── page/              # Page layouts (homepage, admin panel, CMS)
│       ├── services/          # Services (GSoC CMS API, theming, cache)
│       └── shared/            # Common UI elements (loading spinner)
│
├── webiu-server/              # NestJS backend
│   └── src/
│       ├── auth/              # Admin authentication & HttpOnly sessions
│       ├── database/          # PostgreSQL database entities & migrations
│       ├── github/            # GitHub API wrapper client
│       ├── github-webhook/    # GitHub Webhook webhook payload handler
│       ├── gsoc/              # GSoC CMS (programs, ideas, mentors)
│       ├── system-setting/    # Config settings (title, year, maintenance)
│       ├── project/           # Repository listing & sync logic
│       └── contributor/       # Contributor leaderboards & sync
│
├── docs/                      # Technical guides & specifications
│   ├── ARCHITECTURE.md        # High-level architecture & code flows
│   ├── API_DOCUMENTATION.md   # Endpoint inputs, outputs, and JSON formats
│   └── CONTRIBUTING.md        # Git guidelines & code style conventions
```

---

## API Endpoints

A quick overview of key REST routes:

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public | Login admin & set HttpOnly session cookie |
| `POST` | `/auth/logout` | Public | Clear admin session cookie |
| `GET` | `/auth/me` | Public | Check if current session cookie is valid |
| `GET` | `/api/v1/projects` | Public | Get cached list of org repositories |
| `GET` | `/api/v1/contributor/contributors` | Public | Retrieve contributor leaderboard data |
| `GET` | `/api/v1/contributor/stats/:username` | Public | Fetch contributor's issues and PR stats |
| `POST` | `/api/v1/github-webhook` | GitHub | GitHub Webhook event receiver |
| `GET` | `/gsoc/current` | Public | Fetch current GSoC year details |
| `GET` | `/gsoc/current/ideas` | Public | Get active GSoC project ideas |
| `GET` | `/admin/gsoc/programs` | Admin | List all GSoC programs |
| `POST` | `/admin/gsoc/ideas` | Admin | Create a new project idea draft |

For complete payload details, consult [API_DOCUMENTATION.md](file:///Users/tarunyakesh/Desktop/GSOC%2026/WebiU_Dev/docs/API_DOCUMENTATION.md).

---

## Linting & Code Quality

The project uses **ESLint** and **Prettier** formatting enforced automatically on commit via **Husky** hooks.

Run formatting checks manually:
```bash
# Lint frontend
cd webiu-ui && npm run lint

# Lint backend
cd webiu-server && npm run lint
```

---

## Testing

Run unit tests locally:
```bash
# Test backend
cd webiu-server && npm run test

# Test frontend
cd webiu-ui && npm run test
```

---

## Contributing

We welcome contributions! Please review our [CONTRIBUTING.md](file:///Users/tarunyakesh/Desktop/GSOC%2026/WebiU_Dev/docs/CONTRIBUTING.md) to understand our git branch structures, conventions, and merge practices.

---

## Documentation

| Document | Description |
| :--- | :--- |
| [README.md](README.md) | Project overview, setup, and quick reference |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Code structure, module system, data flow, and database schemas |
| [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) | Full API reference — endpoints, schemas, validation, and errors |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | How to contribute (git branch rules, code conventions) |
| [docs/webiu.postman_collection.json](docs/webiu.postman_collection.json) | Pre-configured Postman requests for rapid local testing |

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.