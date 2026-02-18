# Contributing to WebiU 2.0

Thank you for your interest in contributing to **WebiU 2.0**! We welcome improvements, bug reports, and new features from the community.

Please take a moment to review this document to understand our development process and coding standards.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Prerequisites](#prerequisites)
3. [Understanding the Codebase](#understanding-the-codebase)
4. [Setting Up for Development](#setting-up-for-development)
5. [Where to Make Changes](#where-to-make-changes)
6. [Branching Strategy](#branching-strategy)
7. [Linting & Code Style](#linting--code-style)
8. [Testing Your Changes](#testing-your-changes)
9. [Submitting a Pull Request](#submitting-a-pull-request)
10. [Reporting Bugs & Requesting Features](#reporting-bugs--requesting-features)

## Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for all contributors. Please adhere to the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/0/code_of_conduct/).

## Prerequisites

Before contributing, please ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18.x or higher)
- [npm](https://www.npmjs.com/) (v9.x or higher)
- [Angular CLI](https://angular.dev/cli) (v17.x or higher) — `npm install -g @angular/cli`
- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) (optional, for containerized development)

You will also need a **GitHub Personal Access Token** for the backend. Generate one at [github.com/settings/tokens](https://github.com/settings/tokens).

## Understanding the Codebase

Before making changes, read **[ARCHITECTURE.md](ARCHITECTURE.md)** to understand:

- How the frontend and backend communicate via REST API
- The NestJS module system (controllers, services, dependency injection)
- How the GitHub API wrapper works with pagination and caching
- The two-tier caching strategy (backend in-memory + frontend RxJS)
- The OAuth authentication flow

This will save you time and help you write code that fits the existing patterns.

## Setting Up for Development

1. **Fork the repository** — Click the "Fork" button on the top right of the repository page.

2. **Clone your fork:**

   ```bash
   git clone https://github.com/YOUR-USERNAME/Webiu.git
   cd Webiu
   ```

3. **Install root dependencies (Husky):**

   The repository root has its own `package.json` that installs **Husky** and registers the Git pre-commit hooks. Run this **from the repo root** before anything else:

   ```bash
   npm install
   ```

   > Without this step, Husky's pre-commit lint hooks will not be active and your commits will bypass the quality checks.

4. **Install dependencies for both projects:**

   ```bash
   # Frontend
   cd webiu-ui
   npm install

   # Backend
   cd ../webiu-server
   npm install
   cp .env.example .env
   ```

5. **Configure the backend** — Open `webiu-server/.env` and set at minimum:

   ```plaintext
   JWT_SECRET=any_secret_string
   GITHUB_ACCESS_TOKEN=your_github_token
   ```

6. **Start both servers** (in separate terminals):

   ```bash
   # Terminal 1: Backend
   cd webiu-server
   npm start          # Runs on http://localhost:5050

   # Terminal 2: Frontend
   cd webiu-ui
   ng serve           # Runs on http://localhost:4200
   ```

   Or use Docker Compose from the root: `docker-compose up --build`

7. **Verify** — Open http://localhost:4200. You should see the homepage load with project data.

## Where to Make Changes

Here is a quick reference for locating code:

| I want to... | Look in... |
|---------------|------------|
| Add a new page | `webiu-ui/src/app/page/` — create a standalone component, then add a route in `app.routes.ts` |
| Add a reusable UI component | `webiu-ui/src/app/components/` |
| Modify the navbar | `webiu-ui/src/app/components/navbar/` |
| Change global styles or theme | `webiu-ui/src/styles.scss` and `ThemeService` |
| Add a new backend endpoint | Create or extend a module in `webiu-server/src/`. Follow the Controller → Service pattern |
| Modify GitHub API calls | `webiu-server/src/github/github.service.ts` |
| Change caching behavior | `webiu-server/src/common/cache.service.ts` (backend) or `webiu-ui/src/app/services/project-cache.service.ts` (frontend) |
| Update environment config | `webiu-server/.env.example` and `webiu-ui/src/environments/environment.ts` |
| Modify auth or OAuth | `webiu-server/src/auth/` |

### Adding a New Backend Module

NestJS follows a modular pattern. To add a new feature:

1. Generate the module: `nest g module feature-name`
2. Generate the controller: `nest g controller feature-name`
3. Generate the service: `nest g service feature-name`
4. Import your module in `app.module.ts`
5. Inject `GithubService` or `CacheService` if needed (import their modules)

### Adding a New Frontend Page

Angular uses standalone components:

1. Generate the component: `ng g component page/new-page --standalone`
2. Add a route in `webiu-ui/src/app/app.routes.ts`
3. Inject `HttpClient` or existing services as needed
4. Add navigation links in `NavbarComponent` if appropriate

## Branching Strategy

We follow a feature-branch workflow. **Never commit directly to `master`.**

1. Create a new branch from `master`:

   ```bash
   git checkout master
   git pull origin master
   git checkout -b feat/my-new-feature
   ```

2. Use descriptive branch prefixes:

   | Prefix | Use for |
   |--------|---------|
   | `feat/` | New features |
   | `fix/` | Bug fixes |
   | `docs/` | Documentation updates |
   | `refactor/` | Code refactoring (no behavior change) |
   | `test/` | Adding or updating tests |
   | `chore/` | Build config, dependencies, tooling |

## Linting & Code Style

We use **ESLint**, **Prettier**, and **Husky** to maintain consistent code quality.

### Pre-commit Hooks

Husky runs lint checks automatically when you try to commit. If the hook fails, fix the reported errors before committing again.

> **Reminder:** Husky is installed by running `npm install` in the **root** directory (step 3 of setup above). If you skipped that step, run it now — otherwise commits will not be checked automatically.

### Running Lint Manually

```bash
# Frontend
cd webiu-ui && npm run lint

# Backend
cd webiu-server && npm run lint
```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short description>
```

**Examples:**

- `feat(ui): add contributor search page`
- `fix(server): handle empty repo list in contributor service`
- `docs: update ARCHITECTURE.md with caching details`
- `refactor(github): extract pagination into helper method`
- `chore: update Angular to v17.3`

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`, `perf`, `ci`

**Scope** is optional but encouraged — use `ui`, `server`, `github`, `auth`, `docker`, etc.

## Testing Your Changes

Before submitting a PR, verify your changes work:

1. **Run linting** — Make sure both frontend and backend pass lint checks.

2. **Run tests:**

   ```bash
   # Backend
   cd webiu-server && npm test

   # Frontend
   cd webiu-ui && ng test
   ```

3. **Manual verification:**
   - Start both servers and navigate through the affected pages.
   - Check the browser console for errors.
   - Test on different screen sizes if you changed the UI.
   - Verify dark mode still works if you touched styles.

## Submitting a Pull Request

1. **Push your branch** to your fork:

   ```bash
   git push origin feat/my-new-feature
   ```

2. **Open a Pull Request:**
   - Go to the [original repository](https://github.com/rajutkarsh07/Webiu).
   - Click "New Pull Request".
   - Select your fork and branch.
   - Fill out the PR template. Include:
     - **What** you changed and **why**
     - Related issue number (e.g., `Closes #42`)
     - Screenshots if you changed the UI
     - Steps to test your changes

3. **Code Review:**
   - A maintainer will review your PR.
   - Address feedback by pushing new commits to your branch (avoid force-pushing).
   - Once approved, a maintainer will merge your PR.

### PR Checklist

Before requesting review, confirm:

- [ ] Code compiles without errors
- [ ] Lint checks pass (`npm run lint` in both projects)
- [ ] Existing tests pass
- [ ] New features include appropriate error handling
- [ ] No secrets or tokens are committed
- [ ] PR description explains the changes clearly

## Reporting Bugs & Requesting Features

- **Bugs** — Use the [Bug Report](https://github.com/rajutkarsh07/Webiu/issues/new?template=bug_report.md) issue template. Include reproduction steps, expected vs. actual behavior, and your environment.
- **Features** — Use the [Feature Request](https://github.com/rajutkarsh07/Webiu/issues/new?template=feature_request.md) issue template. Describe the use case and proposed solution.

---

Thank you for contributing!