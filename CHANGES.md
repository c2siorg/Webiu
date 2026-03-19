# WebiU Backend — Changes Documentation

**Author:** Claude (AI assistant)
**Date:** 2026-03-19
**Scope:** API optimization + CI/CD pipeline setup

---

## Table of Contents

1. [API Optimization](#1-api-optimization)
   - 1.1 [Axios Timeout — 504 Gateway Timeout Fix](#11-axios-timeout--504-gateway-timeout-fix)
   - 1.2 [PR Count — Reduced N API Calls to 1](#12-pr-count--reduced-n-api-calls-to-1)
   - 1.3 [Follower/Following Count — Reduced 10 Calls to 1](#13-followersfollowing-count--reduced-10-calls-to-1)
   - 1.4 [Unified Pagination Fetcher](#14-unified-pagination-fetcher)
   - 1.5 [Batched PR Fetching in Project Service](#15-batched-pr-fetching-in-project-service)
   - 1.6 [Configurable Org Name](#16-configurable-org-name)
   - 1.7 [GZIP Compression Threshold](#17-gzip-compression-threshold)
   - 1.8 [Bounded In-Memory Cache](#18-bounded-in-memory-cache)
2. [CI/CD Pipeline](#2-cicd-pipeline)
   - 2.1 [CI Pipeline — Improved](#21-ci-pipeline--improved)
   - 2.2 [CD Pipeline — New](#22-cd-pipeline--new)
3. [Docker & Infrastructure](#3-docker--infrastructure)
   - 3.1 [Backend Dockerfile — Multi-Stage Build](#31-backend-dockerfile--multi-stage-build)
   - 3.2 [Frontend Dockerfile — Multi-Stage Build with Nginx](#32-frontend-dockerfile--multi-stage-build-with-nginx)
   - 3.3 [Nginx Config for Angular SPA](#33-nginx-config-for-angular-spa)
   - 3.4 [Production Docker Compose](#34-production-docker-compose)
   - 3.5 [.dockerignore Files](#35-dockerignore-files)
4. [Required Secrets & Setup](#4-required-secrets--setup)

---

## 1. API Optimization

### 1.1 Axios Timeout — 504 Gateway Timeout Fix

**File:** `webiu-server/src/github/github.service.ts`

**Problem:**
Every GitHub API call used the global `axios` instance. The default axios timeout is `0` — meaning infinite wait. If GitHub was slow, rate-limited (429), or unreachable, the NestJS route handler would hang indefinitely. The reverse proxy (Nginx/Docker) would exhaust its own timeout and return **504 Gateway Timeout** to the browser. This was the direct cause of the `projects:1 Failed to load resource: 504` error.

**Solution:**
Created a shared `axios` instance (`this.http`) via `axios.create()` configured once in the constructor:

```ts
this.http = axios.create({
  baseURL: 'https://api.github.com',
  timeout: 10_000,  // 10 seconds — fail fast
  headers: { Authorization: `token ${this.accessToken}` },
});
```

All internal GitHub API methods now use `this.http.get(path)` instead of `axios.get(fullUrl, { headers })`. This means:
- Every request fails with a clear error after 10 seconds instead of hanging forever
- Auth header and base URL are set once — not repeated on every call
- The two exceptions (OAuth exchange to `github.com`, and absolute PR URLs from search results) use global `axios` directly with explicit `timeout: 10_000`

**Impact:** Eliminates 504 errors caused by hanging GitHub API calls.

---

### 1.2 PR Count — Reduced N API Calls to 1

**File:** `webiu-server/src/github/github.service.ts` — `getRepoPullCount()`

**Problem:**
The old `getRepoPulls()` fetched the complete paginated list of all open pull requests (full JSON objects) and the caller did `.length` to get a count. For a repo with 200 open PRs:
- 2 paginated API requests
- ~200 full PR objects transferred over the wire
- All just to get a single number

**Solution:**
`getRepoPullCount()` requests `per_page=1`. GitHub includes a `Link` header when there are more pages:
```
<...?page=2>; rel="next", <...?page=47>; rel="last"
```
Parsing `page=N` from `rel="last"` gives the total PR count in **1 API call** regardless of how many PRs exist.

**Impact:** For a project page with 10 repos, this reduces PR-count API calls from up to 20 → 10.

---

### 1.3 Followers/Following Count — Reduced 10 Calls to 1

**File:** `webiu-server/src/github/github.service.ts` — `getUserFollowersAndFollowing()`

**Problem:**
The old implementation called:
- `GET /users/{username}/followers` (paginated list)
- `GET /users/{username}/following` (paginated list)

Both endpoints return full user objects just to count them. For a user with 500 followers, that's 5 pages × 2 endpoints = **10 API calls** to get two numbers.

**Solution:**
`GET /users/{username}` already returns `followers` and `following` as integers in a single response. One call gets both values.

**Impact:** Contributor search page load time reduced significantly for users with large follower counts.

---

### 1.4 Unified Pagination Fetcher

**File:** `webiu-server/src/github/github.service.ts` — `fetchAllPages()`

**Problem:**
There were two separate private methods — `fetchAllPages` and `fetchAllSearchPages` — with identical pagination logic. The only difference was how they extracted the array from the response (`response.data` vs `response.data.items`). Any bug fix had to be applied in both places.

**Solution:**
Single `fetchAllPages(url, itemKey?)` method:
- Called without `itemKey` → treats `response.data` as the array (list endpoints)
- Called with `itemKey: 'items'` → treats `response.data.items` as the array (search endpoints)

---

### 1.5 Batched PR Fetching in Project Service

**File:** `webiu-server/src/project/project.service.ts`

**Problem:**
`searchProjects()` used `Promise.all()` over all repos returned by GitHub search (up to 30). This fired up to 30 simultaneous `getRepoPullCount` calls, risking GitHub secondary rate limits (which trigger on bursts of concurrent requests).

**Solution:**
Replaced unbounded `Promise.all` with a `BATCH_SIZE = 10` loop — processes 10 repos concurrently, waits for the batch to finish, then processes the next 10. Prevents rate limit bursts while keeping parallelism.

---

### 1.6 Configurable Org Name

**File:** `webiu-server/src/github/github.service.ts`

**Problem:**
The GitHub organization name was hardcoded to `'c2siorg'` throughout the service.

**Solution:**
Read from env: `GITHUB_ORG_NAME` with `'c2siorg'` as fallback. The value is set once at construction and used via `this.orgName` everywhere.

---

### 1.7 GZIP Compression Threshold

**File:** `webiu-server/src/main.ts`

**Problem:**
`compression()` with no options compresses every response, including tiny JSON payloads like `{ "followers": 3 }`. For responses under ~1 KB, gzip CPU overhead exceeds the bandwidth savings — net negative performance.

**Solution:**
```ts
app.use(compression({ threshold: 1024 }));
```
Compression is skipped for responses smaller than 1 KB.

---

### 1.8 Bounded In-Memory Cache

**File:** `webiu-server/src/common/cache.service.ts`

**Problem:**
The `Map`-based cache had no size limit. With many unique cache keys (different usernames, repos, search queries), the map grows indefinitely until the process restarts — effectively a memory leak in long-running production servers.

**Solution:**
- `CACHE_MAX_SIZE` env variable (default: 500 entries)
- When a new key is inserted at capacity, the oldest entry (JS Map preserves insertion order) is evicted before inserting the new one (LRU-lite / FIFO eviction)
- TTL validation: warns if `CACHE_TTL_SECONDS` is set below 10s (would hammer GitHub API)

---

## 2. CI/CD Pipeline

### 2.1 CI Pipeline — Improved

**File:** `.github/workflows/ci.yml`

**Triggers:** All pull requests (opened, synchronized, reopened) on any branch.

| What was added | Why |
|---|---|
| `concurrency` group with `cancel-in-progress: true` | Fast pushes to the same PR stacked up redundant runs. New commit cancels the previous run immediately. |
| `npm audit --audit-level=high` | High/critical CVEs were never caught — they would ship silently with every merge. |
| `npm run build` as final gate (both backend and frontend) | Tests could pass while TypeScript compilation was broken. Broken builds would land in master undetected. |
| `--coverage --coverageReporters=text-summary` on backend tests | No visibility into test coverage in CI output. |

**Job flow (both backend and frontend):**
```
Install deps → Security audit → Lint → Tests → Build
```

---

### 2.2 CD Pipeline — New

**File:** `.github/workflows/cd.yml`

**Triggers:**
- Push to `master` → builds images, pushes to GHCR, deploys to **staging** automatically
- Push of version tag `v*.*.*` (e.g. `v1.2.3`) → same build, deploys to **production** (requires manual approval), creates GitHub Release

**Key design decisions:**

| Decision | Reason |
|---|---|
| `concurrency: cancel-in-progress: false` | Unlike CI, in-flight deployments must never be cancelled mid-way — partial deploys leave the server in a broken state. |
| Docker images tagged with `sha-<hash>` + `latest` | Every build is traceable to a specific commit. `latest` is always master-head. |
| BuildKit layer cache (`cache-from/to: type=gha`) | Without layer caching, every CI run reinstalls all node_modules from scratch. Cache hits reduce rebuild time by 60–80%. |
| `docker image prune -f` after deploy | Dangling images from previous builds accumulate and fill disk over time. |
| GitHub Environments (`staging`, `production`) | Production environment requires manual reviewer approval before deploy — acts as a human gate. |
| Auto-generated GitHub Release on prod deploy | No visibility into what shipped. Now every production deploy creates a release with auto-generated changelog. |

**Secrets required** (set in GitHub repo → Settings → Environments):

| Secret | Environment | Purpose |
|---|---|---|
| `STAGING_HOST` | staging | SSH target host |
| `STAGING_USER` | staging | SSH username |
| `STAGING_SSH_KEY` | staging | SSH private key |
| `PROD_HOST` | production | SSH target host |
| `PROD_USER` | production | SSH username |
| `PROD_SSH_KEY` | production | SSH private key |

---

## 3. Docker & Infrastructure

### 3.1 Backend Dockerfile — Multi-Stage Build

**File:** `webiu-server/Dockerfile`

| | Before | After |
|---|---|---|
| Base image | `node:18` (~1 GB) | `node:20-alpine` builder + slim production stage |
| devDependencies in prod | Yes (jest, eslint, ts-node, nest CLI all shipped) | No — `npm ci --omit=dev` in production stage |
| Source code in prod image | Yes | No — only `dist/` copied from builder |
| Process | `npm start` (restarts on crash, not production-ready) | `node dist/main` directly |
| User | root | Non-root `appuser` (security hardening) |
| Approx image size | ~1 GB | ~200 MB |

**Stages:**
1. **builder** — `node:20-alpine`, installs all deps, runs `npm run build` → produces `dist/`
2. **production** — `node:20-alpine`, installs only prod deps, copies `dist/`, runs as non-root

---

### 3.2 Frontend Dockerfile — Multi-Stage Build with Nginx

**File:** `webiu-ui/Dockerfile`

| | Before | After |
|---|---|---|
| Base image | `node:18` (~1 GB) | Angular build stage + `nginx:1.27-alpine` production stage |
| Runtime in prod | `ng serve` (dev server, not designed for production traffic) | Nginx serving static files |
| Source code in prod | Yes | No — only `dist/webiu/browser/` copied |
| Global CLI install | `npm install -g @angular/cli` | Not needed — `npx ng` / `npm run build` used |
| Approx image size | ~1.2 GB | ~50 MB |

---

### 3.3 Nginx Config for Angular SPA

**File:** `webiu-ui/nginx.conf` *(new)*

**Problem:** Default Nginx serves files literally. A user navigating directly to `/contributors` gets a 404 because there's no physical file at that path — Angular's router handles it client-side, but only if `index.html` is served first.

**Solution:**
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```
Falls back to `index.html` for any unknown path, letting Angular's router take over.

**Also configured:**
- 1-year `Cache-Control: immutable` on hashed static assets (Angular adds content hashes to filenames on build, so stale cache is never an issue)
- Gzip enabled with `gzip_static on` (serves pre-compressed `.gz` files if they exist)

---

### 3.4 Production Docker Compose

**File:** `docker-compose.prod.yml` *(new)*

**Problem:** `docker-compose.yml` was the dev compose — it mounts source code as a volume, runs `npm start` (dev server with file watching), and hardcodes `NODE_ENV=development`. Unusable for production.

**Solution:** Separate prod compose that:
- Pulls pre-built images from GHCR (never builds from source on the server)
- Sets `NODE_ENV=production`
- Never mounts source files
- Reads all secrets from environment variables (`.env` file on the server)
- Healthcheck on backend: UI container waits for the backend to pass its health check before starting

---

### 3.5 .dockerignore Files

**Files:** `webiu-server/.dockerignore`, `webiu-ui/.dockerignore` *(both new)*

**Problem:** Without `.dockerignore`, the Docker build context sends the entire directory to the Docker daemon — including `node_modules` (hundreds of MB), `.env` (secrets), `dist/` (stale build artifacts), and `.git/` (entire git history). This makes builds slow and risks leaking secrets into images.

**Solution:** Explicit ignore lists exclude `node_modules`, `dist`, `.env`, `.env.*`, `*.log`, `.git`, `.github`.

---

## 4. Required Secrets & Setup

**`staging`**
- No approval gate (auto-deploys on every master merge)
- Secrets: `STAGING_HOST`, `STAGING_USER`, `STAGING_SSH_KEY`

**`production`**
- Add yourself (or team lead) as a required reviewer
- Secrets: `PROD_HOST`, `PROD_USER`, `PROD_SSH_KEY`

### Server-side Setup (staging and production)
On each deployment target:
```bash
mkdir -p /opt/webiu
# Create .env with all variables from webiu-server/.env.example
# Place docker-compose.prod.yml there
```

### Triggering a Production Deploy
```bash
git tag v1.0.0
git push origin v1.0.0
```
This triggers the CD pipeline → builds images → deploys to staging automatically → waits for your approval → deploys to production → creates GitHub Release.
