# WebiU 2.0: C2SI/SCoRe Lab Website

<p align="center">
  <img width="400" height="auto" src="https://github.com/Grumpyyash/Webiu/blob/master/static/images/logo.png">
</p>

<p align="center">
  <strong>The official web application for C2SI and SCoRe Lab</strong><br>
  Showcasing open-source projects, contributors, and community activity.
</p>

---

## Project Summary

**WebiU 2.0** is a full-stack web application that provides a comprehensive interface for showcasing C2SI/SCoRe Lab's open-source ecosystem. It integrates directly with the GitHub API to display real-time project statistics, contributor leaderboards, and individual contribution activity.

**Key highlights:**

- **Real-time Project Data** — Fetches repository stats (stars, forks, language, issues, PRs) directly from GitHub.
- **Contributor Leaderboards** — Aggregates contributions across all repositories to rank contributors.
- **Contributor Search** — Look up any contributor to see their issues and pull requests within the organization.
- **Dark Mode** — Toggle between light and dark themes with persistent preference.
- **OAuth Sign-in** — Sign in with Google or GitHub accounts.
- **Modern Stack** — Built with Angular 17+ (standalone components) and NestJS.

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Installation & Setup](#installation--setup)
   - [Frontend Setup](#frontend-setup-webiu-ui)
   - [Backend Setup](#backend-setup-webiu-server)
   - [Running with Docker](#running-with-docker)
5. [Project Structure](#project-structure)
6. [API Endpoints](#api-endpoints)
7. [Linting & Code Quality](#linting--code-quality)
8. [Testing](#testing)
9. [Contributing](#contributing)
10. [Documentation](#documentation)
11. [License](#license)

## Features

| Feature | Description |
|---------|-------------|
| **Project Dashboard** | Browse all C2SI/SCoRe Lab repositories with stars, forks, language, open issues, and PR counts |
| **Contributor Leaderboards** | See aggregated contribution stats across every repository in the organization |
| **Contributor Search** | Search by GitHub username to view their issues and pull requests |
| **Publications** | Dedicated page for research publications |
| **GSoC** | Google Summer of Code information and project ideas |
| **Community** | Community information and resources |
| **Dark Mode** | System-wide light/dark theme toggle with localStorage persistence |
| **OAuth Authentication** | Sign in with Google or GitHub |
| **Responsive Design** | Fully responsive layout for desktop, tablet, and mobile |

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Angular 17+, TypeScript, SCSS, RxJS |
| **Backend** | NestJS 10, TypeScript, Express |
| **API Integration** | GitHub REST API via Axios |
| **Authentication** | JWT, Passport, Google OAuth 2.0, GitHub OAuth |
| **Email** | Nodemailer (Gmail) |
| **Containerization** | Docker, Docker Compose |
| **Code Quality** | ESLint, Prettier, Husky (pre-commit hooks) |
| **Testing** | Jest (backend), Karma + Jasmine (frontend) |

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18.x or higher — [Download](https://nodejs.org/)
- **npm** v9.x or higher (ships with Node.js)
- **Angular CLI** v17.x — Install globally: `npm install -g @angular/cli`
- **Git** — [Download](https://git-scm.com/)
- **Docker** (optional) — [Download](https://www.docker.com/) — only needed for containerized setup

You will also need a **GitHub Personal Access Token** for the backend to call the GitHub API. Generate one at [github.com/settings/tokens](https://github.com/settings/tokens) (no special scopes required for public repo data).

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/rajutkarsh07/Webiu.git
cd Webiu
```

### 2. Install Root Dependencies (Husky)

The repository root has its own `package.json` that installs **Husky** and sets up the Git pre-commit hooks. You **must** run this from the root directory:

```bash
npm install
```

> This runs the `prepare` script which initialises Husky. Without this step, the pre-commit lint hooks will not be active.

### 3. Frontend Setup (`webiu-ui`)

```bash
cd webiu-ui
npm install
ng serve
```

The frontend will be available at **http://localhost:4200**.

### 4. Backend Setup (`webiu-server`)

```bash
cd webiu-server
npm install
cp .env.example .env
```

Open `.env` and fill in the required values:

```plaintext
PORT=5050
JWT_SECRET=your_jwt_secret_here
GITHUB_ACCESS_TOKEN=your_github_personal_access_token
FRONTEND_BASE_URL=http://localhost:4200
```

At minimum, `JWT_SECRET` and `GITHUB_ACCESS_TOKEN` are required. OAuth and email features need their respective variables — see `.env.example` for the full list.

Start the backend:

```bash
npm start
```

The server will run on **http://localhost:5050**.

### 5. Running with Docker

From the repository root:

```bash
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:4200 |
| Backend | http://localhost:5050 |

## Project Structure

```
Webiu/
├── webiu-ui/                  # Angular frontend
│   └── src/app/
│       ├── components/        # Reusable UI components (navbar, cards)
│       ├── page/              # Page components (homepage, projects, contributors, etc.)
│       ├── services/          # Angular services (project caching, theming)
│       ├── common/            # Shared utilities
│       └── shared/            # Shared components (loading spinner)
│
├── webiu-server/              # NestJS backend
│   └── src/
│       ├── auth/              # Authentication (JWT + Google/GitHub OAuth)
│       ├── project/           # Project data endpoints
│       ├── contributor/       # Contributor data endpoints
│       ├── github/            # GitHub API wrapper
│       ├── user/              # User management
│       ├── email/             # Email service
│       └── common/            # Shared cache service
│
├── docker-compose.yml
├── ARCHITECTURE.md            # Detailed code structure & data flow documentation
├── CONTRIBUTING.md            # Contribution guidelines
└── README.md                  # This file
```

For a deep dive into the architecture, module system, data flow, and caching strategy, see **[ARCHITECTURE.md](ARCHITECTURE.md)**.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects/projects` | All repositories with PR counts |
| `GET` | `/api/issues/issuesAndPr?org=...&repo=...` | Issue and PR counts for a repo |
| `GET` | `/api/contributor/contributors` | Aggregated contributor leaderboard |
| `GET` | `/api/contributor/issues/:username` | Issues by a specific user |
| `GET` | `/api/contributor/pull-requests/:username` | PRs by a specific user |
| `GET` | `/api/contributor/stats/:username` | Combined issues + PRs for a user |
| `POST` | `/api/v1/auth/register` | Register a new account |
| `POST` | `/api/v1/auth/login` | Log in |
| `GET` | `/auth/google` | Google OAuth sign-in |
| `GET` | `/auth/github` | GitHub OAuth sign-in |

Full auth endpoint documentation is in [`webiu-server/docs/DOCUMENTATION.md`](webiu-server/docs/DOCUMENTATION.md).

## Linting & Code Quality

This project uses **ESLint**, **Prettier**, and **Husky** pre-commit hooks to maintain code quality. Commits that fail linting checks will be rejected automatically.

> **Important:** Husky is installed via `npm install` in the **root** directory (step 2 of setup). If you skipped that step, run it now from the repo root, otherwise pre-commit hooks will not fire.

Run linting manually:

```bash
# Frontend
cd webiu-ui && npm run lint

# Backend
cd webiu-server && npm run lint
```

## Testing

```bash
# Backend (Jest)
cd webiu-server && npm test

# Frontend (Karma + Jasmine)
cd webiu-ui && ng test
```

## Contributing

We welcome contributions! Please see **[CONTRIBUTING.md](CONTRIBUTING.md)** for guidelines on branching, code style, commit messages, and the pull request process.

## Documentation

| Document | Description |
|----------|-------------|
| [README.md](README.md) | Project overview, setup, and quick reference |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Code structure, module system, data flow, and caching |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute (branching, code style, PRs) |
| [webiu-server/docs/DOCUMENTATION.md](webiu-server/docs/DOCUMENTATION.md) | API documentation for auth endpoints |

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.