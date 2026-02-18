# WebiU 2.0: C2SI/SCoRe Lab Website

<p align="center">
  <img width="400" height="auto" src="https://github.com/Grumpyyash/Webiu/blob/master/static/images/logo.png">
</p>

## Project Summary

**WebiU 2.0** is the official web application for C2SI and SCoRe Lab, designed to provide a comprehensive and visually appealing interface for showcasing the organization's projects and contributors. It offers detailed insights into project tech stacks, issue counts, contributor activity, forks, and stars.

Key features include:
- **Real-time Project Data**: Integrates with the GitHub API to fetch and display up-to-date project statistics.
- **Contributor Spotlights**: Highlights individual contributions to recognize community efforts.
- **Modern Tech Stack**: Built with **Angular 17+** (Frontend) and **NestJS** (Backend).

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Installation & Setup](#installation--setup)
    - [Frontend Setup](#frontend-setup-webiu-ui)
    - [Backend Setup](#backend-setup-webiu-server)
    - [Running with Docker](#running-with-docker)
5. [Linting & Code Quality](#linting--code-quality)
6. [Contributing](#contributing)
7. [License](#license)

## Features

- **Project Dashboard**: View detailed metrics for all C2SI/SCoRe Lab projects.
- **Contributor Leaderboards**: Track and display top contributors across repositories.
- **Search & Filter**: Easily find projects by language, topic, or popularity.
- **Responsive Design**: Optimized for both desktop and mobile viewing.

## Tech Stack

- **Frontend**: Angular 17+, TypeScript, SCSS
- **Backend**: NestJS, TypeScript, MongoDB
- **Tools**: Docker, ESLint, Prettier, Husky (Git Hooks)

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18.x.x or higher)
- **npm** (v9.x.x or higher)
- **Angular CLI** (v17.x.x)
- **Git**
- **Docker** (optional, for containerized setup)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/rajutkarsh07/Webiu.git
cd Webiu
```

### 2. Frontend Setup (`webiu-ui`)

 Navigate to the frontend directory and install dependencies:

```bash
cd webiu-ui
npm install
```

Start the development server:

```bash
ng serve
```
The application will be available at `http://localhost:4200`.

### 3. Backend Setup (`webiu-server`)

Navigate to the backend directory and install dependencies:

```bash
cd ../webiu-server
npm install
```

**Environment Configuration:**

Create a `.env` file in the `webiu-server` root directory:

```plaintext
PORT=5050
GITHUB_ACCESS_TOKEN=your_github_token
MONGO_URI=your_mongodb_connection_string
```
*Note: You can generate a GitHub Access Token [here](https://github.com/settings/tokens).*

Start the backend server:

```bash
npm start
```
The server will run on `http://localhost:5050`.

### 4. Running with Docker

You can spin up the entire application stack using Docker Compose:

```bash
# From the root directory
docker-compose up --build
```
- **Frontend**: `http://localhost:4200`
- **Backend**: `http://localhost:5050`

## Linting & Code Quality

This project enforces code quality using **ESLint**, **Prettier**, and **Husky** pre-commit hooks.

- **Check Frontend Linting**:
  ```bash
  cd webiu-ui
  npm run lint
  ```

- **Check Backend Linting**:
  ```bash
  cd webiu-server
  npm run lint
  ```

*Note: Pre-commit hooks will automatically prevent you from committing code that fails linting checks.*

## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on how to propose bug fixes and new features.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
