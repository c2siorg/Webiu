# Architecture & Code Structure

This document explains how WebiU 2.0 is built, how the pieces fit together, and how data flows through the system. It is intended for developers who want to understand the codebase before contributing.

## Table of Contents

1. [High-Level Overview](#high-level-overview)
2. [Repository Layout](#repository-layout)
3. [Backend (`webiu-server`)](#backend-webiu-server)
   - [Module System](#module-system)
   - [GitHub Integration](#github-integration)
   - [Caching Strategy](#caching-strategy)
   - [Authentication & OAuth](#authentication--oauth)
   - [API Reference](#api-reference)
4. [Frontend (`webiu-ui`)](#frontend-webiu-ui)
   - [Component Architecture](#component-architecture)
   - [Routing](#routing)
   - [Services](#services)
   - [Styling & Theming](#styling--theming)
5. [Data Flow](#data-flow)
6. [DevOps & Tooling](#devops--tooling)
7. [Environment Variables](#environment-variables)

---

## High-Level Overview

WebiU 2.0 is a full-stack application that showcases C2SI/SCoRe Lab's open-source projects and contributors. It pulls data from the GitHub API, processes and caches it on the backend, and presents it through a responsive Angular frontend.

```
┌──────────────────┐         REST API         ┌──────────────────┐
│                  │  ──────────────────────►  │                  │
│   Angular 17+    │  http://localhost:5050    │     NestJS       │
│   Frontend       │  ◄──────────────────────  │     Backend      │
│   :4200          │                           │     :5050        │
└──────────────────┘                           └────────┬─────────┘
                                                        │
                                                        │ GitHub API
                                                        ▼
                                               ┌──────────────────┐
                                               │  api.github.com  │
                                               │  (c2siorg org)   │
                                               └──────────────────┘
```

- **Frontend** (`webiu-ui`) — Angular 17+ with standalone components, SCSS, and RxJS.
- **Backend** (`webiu-server`) — NestJS with modular architecture, in-memory caching, and GitHub API integration.
- **No database required** — MongoDB support is scaffolded but commented out. All runtime data comes from the GitHub API and is cached in memory.

---

## Repository Layout

```
Webiu/
├── webiu-ui/                  # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/    # Reusable UI components (navbar, cards)
│   │   │   ├── page/          # Route-level page components
│   │   │   ├── services/      # Angular services (caching, theming)
│   │   │   ├── common/        # Shared utilities
│   │   │   ├── shared/        # Shared components (loading spinner)
│   │   │   ├── app.routes.ts  # Route definitions
│   │   │   ├── app.config.ts  # Angular providers
│   │   │   └── app.component.ts
│   │   ├── assets/            # Static files (images, icons)
│   │   ├── environments/      # Environment-specific config
│   │   └── styles.scss        # Global styles
│   ├── Dockerfile
│   └── package.json
│
├── webiu-server/              # NestJS backend
│   ├── src/
│   │   ├── auth/              # Authentication (JWT, Google/GitHub OAuth)
│   │   ├── project/           # Project data endpoints
│   │   ├── contributor/       # Contributor data endpoints
│   │   ├── github/            # GitHub API wrapper service
│   │   ├── user/              # User management
│   │   ├── email/             # Email service (Nodemailer)
│   │   ├── common/            # Shared utilities (CacheService)
│   │   ├── app.module.ts      # Root module
│   │   └── main.ts            # Application entry point
│   ├── docs/                      ← you are here
│   │   ├── Architecture.md                # This file
│   │   ├── CONTRIBUTING.md                # Contribution guidelines
│   │   ├── API_DOCUMENTATION.md           # Full API reference (all endpoints)
│   │   └── webiu.postman_collection.json  # Postman collection (import-ready)
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml         # Multi-container orchestration
├── package.json               # Root (Husky pre-commit hooks)
└── README.md
```

---

## Backend (`webiu-server`)

The backend is a NestJS application that acts as a proxy and aggregation layer on top of the GitHub API.

### Module System

NestJS organizes code into **modules**, each encapsulating a feature domain. Every module bundles its own controller(s) and service(s).

```
AppModule (root)
├── ConfigModule          — Global environment variable access
├── CommonModule          — Shared CacheService (exported to all modules)
├── AuthModule            — JWT auth, Google/GitHub OAuth
├── ProjectModule         — Project listing and issue/PR counts
├── ContributorModule     — Contributor leaderboards and per-user stats
└── UserModule            — User management
```

**How modules connect:**

- `GithubModule` is imported by both `ProjectModule` and `ContributorModule` since they both need to call the GitHub API.
- `CommonModule` exports `CacheService`, which is injected into `GithubService`, `ProjectService`, and `ContributorService`.
- `ConfigModule` is global, so any service can inject `ConfigService` to read environment variables.

**Controller → Service pattern:**

Every HTTP request follows the same path:

```
HTTP Request → Controller (routing + validation) → Service (business logic) → GithubService (API calls)
```

### GitHub Integration

`GithubService` (`src/github/github.service.ts`) is the single point of contact with the GitHub API. It handles:

- **Authenticated requests** — Uses a personal access token from the `GITHUB_ACCESS_TOKEN` env variable.
- **Pagination** — Automatically fetches all pages (100 items per page) until no more data is returned.
- **Search API** — Uses GitHub's search endpoint for finding user issues and PRs within the `c2siorg` organization.
- **PR enrichment** — For closed PRs, fetches individual PR details to determine merge status (the search API does not include `merged_at`).
- **Caching** — Every API result is cached for 5 minutes via `CacheService` before making another external call.

**Batch processing** is used in `ProjectService` and `ContributorService` to avoid GitHub's abuse detection. Repositories are processed 10 at a time using `Promise.all` on each batch.

### Caching Strategy

The application uses a **two-tier caching** approach:

| Layer | Where | Mechanism | TTL |
|-------|-------|-----------|-----|
| **Backend in-memory** | `CacheService` | `Map<string, {data, expiresAt}>` | 5 minutes |
| **HTTP cache headers** | Controller `@Header` decorator | `Cache-Control: public, max-age=300` | 5 minutes |
| **Frontend in-memory** | `ProjectCacheService` | RxJS `shareReplay(1)` | Until page reload |

`CacheService` is a simple key-value store with TTL expiration. Keys are descriptive strings like `all_projects`, `pulls_c2siorg_repoName`, `search_issues_username_c2siorg`, etc.

### Authentication & OAuth

The auth system supports three flows:

1. **Email/Password** — Register and login via `POST /api/v1/auth/register` and `POST /api/v1/auth/login`. Passwords are hashed, and a JWT is returned on success. Email verification is supported.

2. **Google OAuth** — The user is redirected to Google's consent screen via `GET /auth/google`. After authorization, Google redirects to `GET /auth/google/callback`, where the backend exchanges the code for tokens, verifies the ID token, and redirects the user back to the frontend with user data in query parameters.

3. **GitHub OAuth** — Same flow as Google but using GitHub's OAuth endpoints. The backend exchanges the authorization code for an access token, fetches user info, and redirects to the frontend.

### API Reference

For full request/response documentation, validation rules, error codes, and example payloads, see **[`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md)**.

A **Postman collection** with all endpoints pre-configured is available at **[`webiu.postman_collection.json`](./webiu.postman_collection.json)**. Import it into Postman via **Import → File** to start testing immediately. The collection uses a `baseUrl` variable (default: `http://localhost:5050`) that you can override per-environment.

**Quick endpoint summary:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects/projects` | All org repos with PR counts |
| `GET` | `/api/issues/issuesAndPr?org=...&repo=...` | Issue and PR counts for a specific repo |
| `GET` | `/api/contributor/contributors` | Aggregated contributor data across all repos |
| `GET` | `/api/contributor/issues/:username` | Issues created by a user in the org |
| `GET` | `/api/contributor/pull-requests/:username` | PRs created by a user in the org |
| `GET` | `/api/contributor/stats/:username` | Combined issues + PRs for a user |
| `POST` | `/api/v1/auth/register` | Register a new user |
| `POST` | `/api/v1/auth/login` | Log in an existing user |
| `GET` | `/api/v1/auth/verify-email?token=...` | Verify email address |
| `GET` | `/auth/google` | Initiate Google OAuth |
| `GET` | `/auth/google/callback` | Google OAuth callback |
| `GET` | `/auth/github` | Initiate GitHub OAuth |
| `GET` | `/auth/github/callback` | GitHub OAuth callback |
| `GET` | `/api/user/followersAndFollowing/:username` | User followers/following (stub) |

---

## Frontend (`webiu-ui`)

The frontend is an Angular 17+ application using **standalone components** (no `NgModule` boilerplate).

### Component Architecture

Components are split into two categories:

**Page components** (`src/app/page/`) — Each page is a standalone component mapped to a route:

| Component | Route | Purpose |
|-----------|-------|---------|
| `HomepageComponent` | `/` | Landing page with hero section |
| `ProjectsComponent` | `/projects` | Grid of all org projects with stats |
| `PublicationsComponent` | `/publications` | Research publications |
| `ContributorsComponent` | `/contributors` | Contributor leaderboard |
| `ContributorSearchComponent` | `/search` | Search a contributor's issues and PRs |
| `CommunityComponent` | `/community` | Community information |
| `GsocComponent` | `/gsoc` | Google Summer of Code page |
| `GsocProjectIdeaComponent` | `/idea` | Individual GSoC project ideas |

**Reusable components** (`src/app/components/`) — Presentational components used across pages:

- `NavbarComponent` — Top navigation bar with dark mode toggle
- `ProjectsCardComponent` — Individual project card (stars, forks, language, PRs)
- `ProfileCardComponent` — Contributor profile card
- `PublicationsCardComponent` — Publication entry card

**Shared components** (`src/app/shared/`) — Generic UI utilities:

- `LoadingSpinnerComponent` — Spinner shown during API calls

### Routing

Routes are defined in `app.routes.ts` and provided via `provideRouter(routes)` in `app.config.ts`. Scroll position restoration and anchor scrolling are enabled globally:

```typescript
RouterModule.forRoot(routes, {
  scrollPositionRestoration: 'enabled',
  anchorScrolling: 'enabled',
});
```

### Services

| Service | Scope | Purpose |
|---------|-------|---------|
| `ProjectCacheService` | Root | Caches the project list using RxJS `shareReplay(1)` to avoid redundant API calls across components |
| `ThemeService` | Root | Manages dark/light mode via `data-theme` attribute on `<html>` and persists the preference in `localStorage` |
| `CommonUtilService` | Root | Shared utility functions |

**How `ProjectCacheService` works:** The first call to `getProjects()` triggers an HTTP GET to the backend. The response Observable is stored and replayed (`shareReplay(1)`) for all subsequent subscribers. Calling `clearCache()` resets it so the next call fetches fresh data.

### Styling & Theming

- **SCSS** is used for all component styles.
- **Global styles** are in `src/styles.scss`.
- **Dark mode** is implemented via CSS custom properties. The `ThemeService` toggles a `data-theme="dark"` attribute on `<html>`, and SCSS rules use `[data-theme='dark']` selectors to override colors.
- **FontAwesome** icons are used throughout the UI.

---

## Data Flow

Here is how data flows for the main use case — loading the Projects page:

```
1. User navigates to /projects

2. ProjectsComponent calls ProjectCacheService.getProjects()

3. ProjectCacheService checks if cache$ exists
   ├── YES → Returns cached Observable (no HTTP call)
   └── NO  → Makes HTTP GET to http://localhost:5050/api/projects/projects

4. Backend: ProjectController.getAllProjects()
   └── ProjectService.getAllProjects()
       ├── Checks CacheService for key "all_projects"
       │   ├── HIT  → Returns cached data immediately
       │   └── MISS → Calls GithubService.getOrgRepos()
       │              ├── Checks CacheService for key "org_repos_c2siorg"
       │              │   ├── HIT  → Returns cached repos
       │              │   └── MISS → Fetches all pages from GitHub API
       │              │              └── Caches result (5 min TTL)
       │              └── For each repo (batches of 10):
       │                  └── GithubService.getRepoPulls(repoName)
       │                      ├── Checks cache
       │                      └── Fetches from GitHub if not cached
       └── Caches final result under "all_projects" (5 min TTL)

5. Response sent to frontend as JSON

6. ProjectCacheService stores the Observable via shareReplay(1)

7. ProjectsComponent renders ProjectsCardComponent for each repo
```

A similar pattern applies for the Contributor page and Contributor Search page.

---

## DevOps & Tooling

### Docker

`docker-compose.yml` defines two services:

- **webiu-server** — Builds from `./webiu-server/Dockerfile`, exposes port `5050`.
- **webiu-ui** — Builds from `./webiu-ui/Dockerfile`, exposes port `4200`, depends on `webiu-server`.

Both use Node 18 base images. Running `docker-compose up --build` from the root starts the entire stack.

### Code Quality

| Tool | Purpose | Config |
|------|---------|--------|
| **ESLint** | Static analysis and linting | Configured per project |
| **Prettier** | Consistent code formatting | Configured per project |
| **Husky** | Git pre-commit hooks | Root `package.json` — runs lint checks before every commit |

### Testing

- **Backend** — Jest (configured via NestJS defaults). Run with `npm test` in `webiu-server/`.
- **Frontend** — Karma + Jasmine (configured via Angular CLI defaults). Run with `ng test` in `webiu-ui/`.

---

## Environment Variables

The backend requires a `.env` file. Copy `.env.example` to `.env` and fill in the values:

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: `5050`) |
| `MONGODB_URI` | No | MongoDB connection string (currently unused) |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `FRONTEND_BASE_URL` | No | Frontend URL for OAuth redirects (default: `http://localhost:4200`) |
| `GMAIL_USER` | No | Gmail address for sending emails |
| `GMAIL_PASSWORD` | No | Gmail app password for Nodemailer |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | No | Google OAuth callback URL |
| `GITHUB_CLIENT_ID` | No | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth app client secret |
| `GITHUB_REDIRECT_URI` | No | GitHub OAuth callback URL |
| `GITHUB_ACCESS_TOKEN` | Yes | GitHub personal access token for API calls |

At minimum, you need `JWT_SECRET` and `GITHUB_ACCESS_TOKEN` to run the application. OAuth and email features require their respective variables.

The frontend reads its config from `src/environments/environment.ts`. For production builds, create an `environment.prod.ts` with `production: true` and the deployed backend URL.