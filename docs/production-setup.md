# Production Setup Guide for **WebiU**

> **Purpose** – This document provides a step‑by‑step, hands‑on guide for the Project Administrator (PA) to get the WebiU stack live in production. It covers everything that must be configured **outside** the source repository (Render, GitHub Pages, secrets) and explains _why_ each step exists.

---

## 1️⃣ Prerequisites

| Item                                                                                               | Why we need it                                                                                         |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Node.js ≥ 18** & **npm**                                                                         | Required to run the NestJS backend locally and to install the Angular CLI during CI.                   |
| **Angular CLI** (`npm i -g @angular/cli`)                                                          | Used by the CI workflow to build the SPA.                                                              |
| **Docker** (optional)                                                                              | Allows the PA to spin up a full‑stack preview locally (`docker compose -f docker-compose.dev.yml up`). |
| **Render.com account**                                                                             | Host for the NestJS backend and PostgreSQL database.                                                   |
| **GitHub repository access**                                                                       | The PA must have admin rights to edit repository settings and secrets.                                 |
| **GitHub Actions secrets** (`RENDER_API_KEY`, `RENDER_SERVICE_ID`, `DATABASE_URL`, `DATABASE_SSL`) | Passed to Render during deployment; keep them secret!                                                  |

---

## 2️⃣ Backend – Render.com

### 2.1 Create a PostgreSQL instance

1. Log in to **Render** → **Databases** → _Create Database_.
2. Choose **PostgreSQL**, give it a name (e.g., `webiu-db`).
3. **Enable SSL** – Render will set `DATABASE_SSL=true` automatically.
4. Copy the generated **`DATABASE_URL`** connection string.

### 2.2 Create a Web Service for the NestJS API

1. In Render, click **New → Web Service**.
2. **Root Directory** → `webiu-server` (the NestJS project folder).
3. **Build Command** → `npm install && npm run build`.
4. **Start Command** → `npm run start:prod`.
5. **Environment Variables** – add:
   - `DATABASE_URL` – value from step 2.1.
   - `DATABASE_SSL=true` – ensures encrypted DB traffic.
   - `API_URL` – optional, overrides the default API endpoint used by the frontend.
6. **Health Check** → Path `/health`. Render will only promote the service when it returns **200 OK**.
7. **Deploy** – Render will pull the latest `main` branch, build, and start the container.

### 2.3 Verify Backend

```bash
curl https://<your-service>.onrender.com/health
```

You should see `{ "status": "ok" }`.

---

## 3️⃣ Frontend – GitHub Pages (automated via GitHub Actions)

### 3.1 How the CI workflow works

- The file **`.github/workflows/deploy-pages.yml`** runs on every push to the **`webiu-2026-gsoc`** branch, and can also be triggered manually from the Actions tab.
- Steps performed:
  1. **Checkout** repository.
  2. **Set up Node** and install dependencies (`npm ci`).
  3. **Build** the Angular app with the correct base‑href (`npx ng build --configuration production --base-href=/Webiu/`).
  4. **Copy** `index.html` → `404.html` so deep‑link refreshes work on the static host.
  5. **Upload Artifact** – packages the built files via `actions/upload-pages-artifact`.
  6. **Deploy to GitHub Pages** – deploys directly via `actions/deploy-pages` (no intermediate `gh-pages` branch needed).
- **Result:** GitHub Pages serves the build directly; no manual `ng build` or `npm run deploy` is ever required.

### 3.2 Repository Settings (once)

1. Navigate to **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions** from the dropdown.
3. Custom domain (optional) – configure if you have a vanity domain.

### 3.3 Overriding the API endpoint (optional)

If you need the frontend to point to a non‑default API URL, edit the workflow file and add a secret `CUSTOM_API_URL`. The workflow will then invoke:

```bash
npx ng build --configuration production --define.API_URL="\"${CUSTOM_API_URL}\""
```

The PA can set the secret under **Settings → Secrets and variables → Actions**.

---

## 4️⃣ GitHub Pages – Environment Protection Rules

> **Why this matters** – GitHub has a per-environment allowlist that controls which branches are permitted to deploy to GitHub Pages. If a branch is not in this list the deployment will be rejected with:
> `Branch "webiu-2026-gsoc" is not allowed to deploy to github-pages due to environment protection rules.`

### 4.1 Granting deployment permission to a branch

This is a **one-time, admin-only setting**. The repo owner or admin must do the following:

1. Open the `c2siorg/Webiu` repository on GitHub.
2. Go to **Settings → Environments**.
3. Click on the **`github-pages`** environment.
4. Under **Deployment branches and tags**, click **Add deployment branch or tag rule**.
5. Type `webiu-2026-gsoc` (or whatever branch the workflow runs from) and confirm.

That's it — the rule is saved instantly. No code change is needed.

### 4.2 Re-running the workflow after the fix

After the branch is added to the allowlist:

1. Go to the **Actions** tab of the repository.
2. Find the failed **Deploy to GitHub Pages** run.
3. Click **Re-run jobs** → **Re-run all jobs**.
4. The workflow will succeed and the live site will be published.

> **Alternatively**, push a new commit to `webiu-2026-gsoc` and the workflow triggers automatically.

---

## 5️⃣ End‑to‑End Validation

1. Open the live site: `https://<github‑username>.github.io/Webiu/`.
2. Verify that the UI loads and makes successful calls to the backend (`/api/...`).
3. Test a deep link (e.g., `https://<github‑username>.github.io/Webiu/projects`). It should _not_ return a 404 – the SPA router should handle it.
4. Check the backend health endpoint again.
5. Confirm that any admin‑only pages are protected by the NestJS auth guard.

---

## 6️⃣ Trouble‑shooting Common Issues

- **GitHub Actions fails on `npm ci`** – ensure the repo contains a valid `package-lock.json` and that the Node version used in the workflow matches the one declared in `engines`.
- **404 on deep links** – make sure the workflow copies `index.html` to `404.html` (line 466‑467 in `ARCHITECTURE.md`).
- **Backend cannot connect to DB** – double‑check the `DATABASE_URL` secret on Render and that `DATABASE_SSL=true` is set.
- **CORS errors** – the NestJS `app.enableCors()` is already configured for `*`; adjust if you need a tighter origin policy.

---

## 7️⃣ Summary Checklist (for the PA)

- [ ] Render PostgreSQL created → `DATABASE_URL` stored.
- [ ] Render Web Service configured (`webiu-server` root, build/start commands, env vars, health check).
- [ ] **Settings → Pages** source set to **GitHub Actions**.
- [ ] **Settings → Environments → github-pages** → `webiu-2026-gsoc` branch added to the deployment allowlist.
- [ ] GitHub Actions secret `CUSTOM_API_URL` (optional) added if needed.
- [ ] Push a commit to `webiu-2026-gsoc` (or manually trigger the workflow) → confirm the **Actions** tab shows a green `deploy-pages` run.
- [ ] Verify the live site loads and backend health endpoint returns `{ "status": "ok" }`.

With these steps completed, the WebiU stack is fully operational in production.
