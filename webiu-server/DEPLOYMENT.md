# WebiU Backend Deployment & Setup Guide

This document describes how to configure, run, and deploy the NestJS-based WebiU backend (`webiu-server`).

---

## 1. Local Development Setup

To run `webiu-server` locally:

1. **Navigate to the server directory:**
   ```bash
   cd webiu-server
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure the environment file:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in the required values (see [Environment Variables](#2-environment-variables) below).
4. **Start the application in development mode:**
   ```bash
   npm run start:dev
   ```
   The server will start listening on port `5050` by default.

---

## 2. Environment Variables

The backend relies on the following environment variables. Ensure these are defined in your local `.env` file or in your hosting provider's dashboard:

| Variable | Required / Critical | Purpose / Example Value |
|----------|---------------------|--------------------------|
| `NODE_ENV` | Yes | App environment (`development`, `production`, `test`) |
| `PORT` | No | Server port (defaults to `5050` if omitted) |
| `JWT_SECRET` | **Yes (Critical)** | Secret key used to sign session/admin JWTs |
| `ADMIN_USERNAME` | **Yes (Critical)** | Administrator login username |
| `ADMIN_PASSWORD` | **Yes (Critical)** | Administrator login password |
| `GITHUB_ACCESS_TOKEN` | **Yes (Critical)** | Personal Access Token to query GitHub API rates without limits |
| `GITHUB_ORG_NAME` | No | GitHub Organization to query (defaults to `c2siorg` if omitted) |
| `FRONTEND_BASE_URL` | Yes | Comma-separated list of allowed CORS origins (e.g. `http://localhost:4200,https://c2siorg.github.io`) |
| `DATABASE_URL` | No (Future) | PostgreSQL connection URI for persistence layer |
| `BACKEND_BASE_URL` | Yes | Public absolute URL of this backend (used for transactional email links) |
| `GMAIL_USER` | No | Google Account address for nodemailer SMTP server |
| `GMAIL_PASSWORD` | No | App password for Gmail SMTP authentication |

---

## 3. Startup Validation

The backend performs validation of **critical** environment variables upon startup. 
If `GITHUB_ACCESS_TOKEN`, `JWT_SECRET`, `ADMIN_USERNAME`, or `ADMIN_PASSWORD` is missing, the bootstrap process will log a clear error message:
```
[Startup Failure] Critical environment variables are missing: GITHUB_ACCESS_TOKEN, JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD
```
And the process will exit immediately with code `1` to prevent running in an unauthenticated or non-functional state.

---

## 4. Render.com Deployment Guide

Deploying `webiu-server` to [Render](https://render.com/) is straightforward. Follow these instructions:

### Render Web Service Configuration
1. **New Web Service:** Create a new Web Service on Render and link it to your GitHub repository.
2. **Root Directory:** Set this to `webiu-server`. Since the backend resides in a subdirectory of the monorepo, specifying this ensures Render changes directory and runs commands inside `webiu-server/` context.
3. **Runtime:** Select `Node`.
4. **Build Command:**
   ```bash
   npm install && npm run build
   ```
5. **Start Command:**
   ```bash
   npm run start:prod
   ```
6. **Environment Variables:**
   * Go to the **Environment** tab in your Render service dashboard.
   * Define the required environment variables listed in the [Environment Variables](#2-environment-variables) section above (specifically ensure `NODE_ENV=production` and `FRONTEND_BASE_URL` matches your deployed Angular frontend address on GitHub Pages).
7. **Health Check Path:**
   * Under **Advanced**, configure the Health Check Path to `/health`. Render will automatically query this route (`GET /health`) during builds to verify successful deployment before cutting over traffic.
