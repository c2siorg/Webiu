Here's a `CONTRIBUTING.md` file for your project:

---

# Contributing to Webiu

Thank you for your interest in contributing to Webiu! This guide will help you set up the project on your local machine and get started with development.

## Table of Contents

1. [Folder Structure](#folder-structure)
2. [Prerequisites](#prerequisites)
3. [Setting Up the Project](#setting-up-the-project)
   - [Frontend (webiu-ui)](#frontend-webiu-ui)
   - [Backend (webiu-server)](#backend-webiu-server)
4. [Running the Project](#running-the-project)
   - [Running with Docker](#running-with-docker)
5. [Submitting Contributions](#submitting-contributions)

## Folder Structure

The Webiu project is structured as follows:

```
webiu/
├── webiu-ui/        # Frontend - Angular 17
└── webiu-server/    # Backend - Node.js and Express
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.x.x or higher)
- **npm** (v9.x.x or higher)
- **Angular CLI** (v17.x.x)
- **Git** (for version control)
- **Docker** (optional, for containerized development)

## Setting Up the Project

### Frontend (webiu-ui)

1. **Navigate to the frontend directory:**

   ```bash
   cd webiu/webiu-ui
   ```

2. **Install Angular CLI globally:**

   ```bash
   npm install -g @angular/cli
   ```

3. **Install project dependencies:**

   ```bash
   npm install
   ```

4. **Run the frontend development server:**

   ```bash
   ng serve
   ```

   The application should now be running on `http://localhost:4200`.

### Backend (webiu-server)

1. **Navigate to the backend directory:**

   ```bash
   cd webiu/webiu-server
   ```

2. **Create a `.env` file:**

   In the root of the `webiu-server` directory, create a file named `.env` and add the following environment variables:

   ```plaintext
   PORT=5000
   GITHUB_ACCESS_TOKEN=
   ```

   - **PORT:** The port number where the backend server will run.
   - **GITHUB_ACCESS_TOKEN:** Your personal GitHub access token. You can create one [here](https://github.com/settings/tokens).

3. **Install project dependencies:**

   ```bash
   npm install
   ```

4. **Run the backend server:**

   ```bash
   npm start
   ```

   The server should now be running on `http://localhost:5000`.

## Running the Project with Docker

If you prefer to use Docker, follow these steps:

1. **Ensure Docker is installed on your system.**

2. **Build and start the Docker containers:**

   Navigate to the root directory of the project (`webiu/`) and run:

   ```bash
   docker-compose up --build
   ```

   This will build and start both the frontend and backend services.

3. **Access the services:**

   - Frontend: `http://localhost:4200`
   - Backend: `http://localhost:5000`

## Submitting Contributions

Once you've made changes to the project, follow these steps to submit your contributions:

1. **Fork the repository** and create a new branch for your feature or bug fix.

2. **Make your changes** and commit them with a descriptive commit message.

3. **Push your changes** to your forked repository:

   ```bash
   git push --set-upstream origin your-branch-name
   ```

4. **Submit a Pull Request** to the main repository and describe the changes you've made.

Thank you for contributing to Webiu! We look forward to your improvements.

---

This `CONTRIBUTING.md` file provides clear instructions for setting up and running the project, as well as guidelines for contributing.