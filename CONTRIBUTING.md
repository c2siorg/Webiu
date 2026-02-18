# Contributing to Webiu 2.0

Thank you for your interest in contributing to **WebiU 2.0**! We welcome improvements, bug reports, and new features from the community.

Please take a moment to review this document to understand our development process and coding standards.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Prerequisites](#prerequisites)
3. [Setting Up for Development](#setting-up-for-development)
4. [Branching Strategy](#branching-strategy)
5. [Linting & Code Style](#linting--code-style)
6. [Submitting a Pull Request](#submitting-a-pull-request)
7. [Reporting Bugs & Requesting Features](#reporting-bugs--requesting-features)

## Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for all contributors. Please adhere to the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/0/code_of_conduct/).

## Prerequisites

Before contributing, please ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v18.x or higher)
*   [npm](https://www.npmjs.com/) (v9.x or higher)
*   [Angular CLI](https://angular.io/cli) (v17.x or higher)
*   [Git](https://git-scm.com/)

*Optional but recommended:*
*   [Docker](https://www.docker.com/) for containerized development.

## Setting Up for Development

1.  **Fork the Repository**: Click the "Fork" button on the top right of the repository page.

2.  **Clone Your Fork**:
    ```bash
    git clone https://github.com/YOUR-USERNAME/Webiu.git
    cd Webiu
    ```

3.  **Install Dependencies**:
    *   **Frontend**:
        ```bash
        cd webiu-ui
        npm install
        ```
    *   **Backend**:
        ```bash
        cd webiu-server
        npm install
        cp .env.example .env  # Configure your .env variables
        ```

4.  **Run the Project**:
    You can run the frontend and backend separately using `npm start` (backend) and `ng serve` (frontend), or use Docker Compose:
    ```bash
    docker-compose up
    ```

## Branching Strategy

We follow a simple feature-branch workflow:

1.  Create a **new branch** for your work. Do not work directly on `master`.
    ```bash
    git checkout -b feat/my-new-feature
    # or
    git checkout -b fix/issue-123
    ```
    *   Use `feat/` for new features.
    *   Use `fix/` for bug fixes.
    *   Use `docs/` for documentation updates.

## Linting & Code Style

We use **ESLint**, **Prettier**, and **Husky** to maintain high code quality.

*   **Pre-commit Hooks**: A git hook will automatically run when you try to commit your changes. It checks for linting errors in both the frontend and backend.
    *   If the hook fails, please fix the reported errors before committing again.
*   **Manual Checks**:
    *   Frontend: `cd webiu-ui && npm run lint`
    *   Backend: `cd webiu-server && npm run lint`

**Commit Messages**:
Please follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for your commit messages:
*   `feat: add user profile page`
*   `fix: resolve login timeout issue`
*   `docs: update README installation steps`

## Submitting a Pull Request

1.  **Push your branch** to your forked repository:
    ```bash
    git push origin feat/my-new-feature
    ```

2.  **Open a Pull Request (PR)**:
    *   Go to the [original repository](https://github.com/rajutkarsh07/Webiu).
    *   Click "New Pull Request".
    *   Select your fork and branch.
    *   Fill out the PR template completely. Describe your changes, link related issues, and provide testing details.

3.  **Code Review**:
    *   Maintainers will review your code.
    *   Address any feedback or requested changes by pushing new commits to your branch.

## Reporting Bugs & Requesting Features

*   **Bugs**: Use the **Bug Report** issue template to provide detailed reproduction steps.
*   **Features**: Use the **Feature Request** issue template to describe the proposed functionality and its use case.

Thank you for contributing! 🚀
