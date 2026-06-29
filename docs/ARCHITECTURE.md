# WebiU 2.0 — Architecture & Code Structure

This document describes the high-level architecture, module design, data models, and deployment configurations of WebiU 2.0. It is written to be accessible to beginners while providing complete technical specifications for experienced developers.

---

## 1. High-Level Architecture Overview

WebiU 2.0 acts as a persistent database-backed aggregator and proxy for the **GitHub API (`api.github.com`)**. 

### How WebiU Interacts with GitHub
Instead of querying GitHub directly on every user action (which leads to slow page loads and rapid API rate limit exhaustion), WebiU employs a hybrid persistence-and-proxy model:

1. **Persistent Catalog**: Organization repositories, basic metrics (stars, forks), and the contributor leaderboard are stored in a local **PostgreSQL** database.
2. **Synchronization Events**: The database is kept in sync in real-time via **GitHub Webhooks** listening for repository modifications (creation, deletion, archiving, edits).
3. **Background Recovery (Drift Alignment)**: A background **Reconciliation Scheduler** cron job executes every 12 hours, querying `api.github.com` to scan for any changes missed during downtime.
4. **Live Cached Proxy**: For highly dynamic, individual user queries (like contributor issue/PR details, repository languages, and insights stats), the backend fetches data directly from `api.github.com` in real-time, caching responses locally for 5 minutes (`Cache-Control: public, max-age=300`) to guarantee high speed and efficiency.

### System Architecture Diagram

```
┌──────────────────┐         REST API (JSON)      ┌──────────────────┐
│                  │  ─────────────────────────►  │                  │
│   Angular 17+    │  http://localhost:5050       │     NestJS       │
│   Frontend       │  ◄─────────────────────────  │     Backend      │
│   (Port 4200)    │  (admin cookies included)    │     (Port 5050)  │
└──────────────────┘                              └────┬──────────┬──┘
                                                       │          │
                                            GitHub API │          │ TypeORM
                                            (Axios)    ▼          ▼
                                               ┌──────────────┐ ┌──────────────┐
                                               │api.github.com│ │  PostgreSQL  │
                                               │ (c2siorg org)│ │   Database   │
                                               └──────┬───────┘ └──────────────┘
                                                      │
                                                      │ GitHub Org Events
                                                      ▼ (HMAC Signature Verified)
                                               ┌──────────────┐
                                               │  Webhook     │
                                               │  Receiver    │
                                               └──────────────┘
```

---

## 2. Directory Structure & Layout

A breakdown of the project layout, highlighting all major source folders and configuration files:

```
Webiu/
├── webiu-ui/                          # Angular standalone application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/            # Reusable components (navbar, cards)
│   │   │   ├── page/                  # Route-level pages (homepage, admin-settings, gsoc)
│   │   │   ├── services/              # Angular services (GSoC CMS, theming, cache)
│   │   │   ├── common/                # Shared utilities & configurations
│   │   │   ├── shared/                # Common UI elements (loading spinner)
│   │   │   ├── app.routes.ts          # Route definitions
│   │   │   ├── app.config.ts          # Angular application configuration
│   │   │   └── app.component.ts       # Root UI template
│   │   ├── assets/                    # Images, icons, static files
│   │   ├── environments/              # Environment configurations (dev, prod)
│   │   └── styles.scss                # Global stylesheet (themes, colors)
│   ├── Dockerfile                     # Frontend containerization
│   ├── nginx.conf                     # Nginx static deployment routing rule
│   └── package.json                   # UI build dependencies
│
├── webiu-server/                      # NestJS REST backend
│   ├── src/
│   │   ├── auth/                      # JWT authentication & HttpOnly cookies
│   │   ├── database/                  # PostgreSQL entity models & migrations
│   │   ├── github/                    # GitHub REST client service
│   │   ├── github-webhook/            # Webhook signature validation & handler
│   │   ├── gsoc/                      # GSoC CMS (programs, ideas, mentors)
│   │   ├── system-setting/            # Runtime configurations
│   │   ├── project/                   # Repository listing & sync logic
│   │   ├── contributor/               # Contributor stats & leaderboards
│   │   ├── common/                    # Shared utilities & cache provider
│   │   ├── app.module.ts              # Root backend NestJS module
│   │   └── main.ts                    # Backend entrypoint file
│   ├── Dockerfile                     # Backend containerization
│   ├── .env.example                   # Env variable reference templates
│   └── package.json                   # Server build dependencies
│
├── docs/                              # Project guides & resources
│   ├── ARCHITECTURE.md                # This file (high-level layouts & flows)
│   ├── API_DOCUMENTATION.md           # REST API specification reference
│   ├── CONTRIBUTING.md                # Developer contribution rules
│   └── webiu.postman_collection.json  # Pre-configured requests for local testing
│
├── docker-compose.yml                 # Multi-container local deployment
└── README.md                          # Root README file
```

---

## 3. Data Models & Entity Relationships

We use **TypeORM** to manage our schemas. Below is a diagram showing how our persistent models are linked together in the PostgreSQL database:

```mermaid
erDiagram
    ADMIN {
        uuid id PK
        string username
        string passwordHash
        date createdAt
        date updatedAt
        date lastLoginAt
    }
    SYSTEM_SETTINGS {
        string key PK
        string value
    }
    REPOSITORY {
        uuid id PK
        string githubRepoId
        string name
        string description
        string homepage
        string topics
        int stars
        int forks
        boolean isActive
        string syncStatus
        string syncError
        string reconciliationSource
        date lastSyncedAt
        date lastWebhookAt
        date lastReconciliationAt
    }
    CONTRIBUTOR {
        uuid id PK
        string githubUserId
        string username
        string displayName
        string avatarUrl
        string profileUrl
        string bio
    }
    REPOSITORY_CONTRIBUTOR {
        uuid id PK
        uuid repositoryId FK
        uuid contributorId FK
        int contributionCount
    }
    GSOC_PROGRAM {
        uuid id PK
        int year
        string title
        string description
        string heroImageUrl
        string introHtml
        string slackUrl
        string proposalTemplateUrl
        string githubOrgUrl
        string status
        boolean isActive
    }
    GSOC_IDEA {
        uuid id PK
        uuid programId FK
        int projectNumber
        string title
        string explanation
        string expectedResults
        string prerequisites
        string difficulty
        int durationHours
        string slackChannel
        string githubUrl
        string status
        int displayOrder
    }
    GSOC_MENTOR {
        uuid id PK
        string name
        string githubHandle
    }
    GSOC_IDEA_MENTORS {
        uuid ideaId FK
        uuid mentorId FK
    }
    AUDIT_LOG {
        uuid id PK
        uuid adminId FK
        string action
        string entityType
        string entityId
        string oldValue
        string newValue
        jsonb metadata
        date createdAt
    }

    REPOSITORY ||--o{ REPOSITORY_CONTRIBUTOR : has
    CONTRIBUTOR ||--o{ REPOSITORY_CONTRIBUTOR : makes
    GSOC_PROGRAM ||--o{ GSOC_IDEA : contains
    GSOC_IDEA }o--o{ GSOC_MENTOR : managed_by
    ADMIN ||--o{ AUDIT_LOG : performs
```

---

## 4. Key Architectural Flows

### A. Administrator Authentication & Session Flow
We removed social OAuth flows to ensure administrative credentials are isolated and self-hosted. 

Admin login uses credentials validated against the `admins` table. Upon success, a signed JWT is returned in an **HttpOnly, SameSite=Lax** session cookie named `admin_session`. The browser automatically includes this cookie in subsequent API requests.

```mermaid
sequenceDiagram
    participant Browser as Admin Browser
    participant Server as NestJS Backend
    participant DB as PostgreSQL

    Browser->>Server: POST /auth/login { username, password }
    Server->>DB: Query admin user by username
    DB-->>Server: Return hashed credentials
    Note over Server: Validates password (bcrypt)
    Note over Server: Signs JWT token
    Server-->>Browser: Set-Cookie: admin_session=JWT (HttpOnly) & 200 OK
    
    Note over Browser: User visits /admin/settings
    Browser->>Server: GET /admin/gsoc/programs (Cookie included)
    Note over Server: AdminGuard verifies JWT signature
    Server-->>Browser: Return GSoC programs JSON (200 OK)
```

### B. Admin Profile & Session Invalidation Flow
Administrators can update their username or password. To ensure high security, any change to these credentials immediately invalidates all active sessions by clearing the HttpOnly session cookie (`admin_session`), forcing the user to log in again.

```mermaid
sequenceDiagram
    participant Browser as Admin Browser
    participant Server as NestJS Backend
    participant DB as PostgreSQL

    Note over Browser: User visits /admin/profile
    Browser->>Server: GET /admin/profile (Cookie included)
    Server-->>Browser: Return Profile Details
    
    Note over Browser: User updates Password
    Browser->>Server: PATCH /admin/profile/password { currentPassword, newPassword, confirmPassword }
    Server->>DB: Query Admin details
    DB-->>Server: Return Admin record
    Note over Server: Verifies current password (bcrypt)<br/>hashes new password
    Server->>DB: Save updated password hash
    DB-->>Server: Confirm saved
    Note over Server: Invalidate session: clear admin_session cookie
    Server-->>Browser: Clear-Cookie: admin_session & 200 OK
    Note over Browser: Browser redirects to /admin (Login)
```

---

### C. GitHub Webhook Ingest Flow
When a repository is modified on GitHub (e.g. created, edited, renamed, archived, or deleted), GitHub pushes a webhook event to our server. 

We verify the event source using a secure token payload hash check (`HMAC-SHA256`) before committing any changes to the database.

```mermaid
sequenceDiagram
    participant GitHub
    participant Server as NestJS Webhook Controller
    participant SyncService as Repository Sync Service
    participant DB as PostgreSQL

    GitHub->>Server: POST /api/v1/github-webhook (Header: x-hub-signature-256)
    Note over Server: Computes HMAC-SHA256 of body<br/>using GITHUB_WEBHOOK_SECRET
    Note over Server: Compares signature securely
    alt Signature Mismatch
        Server-->>GitHub: 401 Unauthorized
    else Signature Valid
        Server->>SyncService: Process repository event (payload)
        alt Action is 'created' / 'edited' / 'unarchived'
            SyncService->>DB: Query GitHub API & Upsert Repository & Contributors
        else Action is 'deleted' / 'archived'
            SyncService->>DB: Mark Repository as inactive (soft delete)
        end
        SyncService-->>Server: Complete
        Server-->>GitHub: 200 OK
    end
```

---

### D. Background Reconciliation & Drift Recovery
If the server is down or a webhook delivery fails, database "drift" can occur. To recover from this, a background NestJS scheduler cron job executes every 12 hours.

The cron job:
1. Downloads the full repository list from GitHub.
2. Compares properties (stars, forks, description, topics, archiving) with PostgreSQL records.
3. Synchronizes drifted properties and upserts missing records.
4. Identifies repositories in PostgreSQL that no longer exist on GitHub and deactivates them.

---

### E. Dynamic Configuration & System Settings
Instead of hardcoding details like the active year or site metadata, settings are stored in the database. 

The backend bootstrap phase seeds default keys. An admin can edit these keys dynamically from the admin panel, updating the site settings in real-time without server restarts or code updates.

Supported keys include:
* `gsoc.current_year`: Configures the public GSoC program view.
* `gsoc.show_ideas_page`: Globally toggles project ideas visibility.
* `gsoc.registration_open`: Shows/hides GSoC registration.
* `site.title` & `site.description`: Configures layout SEO headers.
* `site.maintenance_mode`: Toggles a public-facing holding screen.

---

### F. Audit Logging & Administrative Activity Tracking
To maintain accountability and operational visibility, WebiU tracks all major configuration modifications, security transactions, and GSoC CMS updates.

The audit pipeline runs synchronously with write requests:
1. When an admin makes a request (e.g. `PATCH /admin/settings`), `AdminGuard` decodes the token and attaches the admin's database primary key (`id`) to the request context.
2. The service queries the current state of the entity before applying updates.
3. Upon successfully writing changes to the database, `AuditLogService` is invoked to create a log entry documenting the administrator ID, action key (e.g., `SETTING_UPDATED`), entity descriptors, previous state string, and updated state string.
4. The logs are rendered on a dedicated dashboard in the administrator workspace (`/admin/audit`).

```mermaid
sequenceDiagram
    participant Browser as Admin Browser
    participant Server as NestJS Controller
    participant Service as GSoC Service
    participant Audit as AuditLog Service
    participant DB as PostgreSQL

    Browser->>Server: PATCH /admin/gsoc/programs/:id { title: "GSoC 2026 Updated" } (with Cookie)
    Note over Server: AdminGuard decodes session cookie<br/>attaches admin's UUID to request
    Server->>Service: update(id, dto, adminId)
    Service->>DB: Fetch program record before update
    DB-->>Service: Return old state JSON
    Service->>DB: Save updated program properties
    DB-->>Service: Confirm saved
    Service->>Audit: createLog({ adminId, action: 'PROGRAM_UPDATED', entityType: 'gsoc_program', entityId, oldValue, newValue })
    Audit->>DB: Insert into audit_logs table
    DB-->>Audit: Confirm log saved
    Service-->>Server: Return updated program
    Server-->>Browser: 200 OK
```

---

### G. Administrative Dashboard & Platform Insights
To provide administrators with a centralized control center, WebiU exposes an aggregated dashboard summary endpoint.

The dashboard service integrates data across multiple modules:
1. **Concurrency**: To maintain fast load times, `DashboardService` executes independent queries concurrently (using `Promise.all`), avoiding sequential database lookups.
2. **Aggregated Statuses**:
   - **Counts**: Collects total counts of repositories, contributors, GSoC programs, project ideas, and mentors.
   - **Ideas Breakdown**: Returns the respective counts of ideas in `PUBLISHED` vs. `DRAFT` status.
   - **Runtime Settings**: Retrieves dynamic configuration parameters (active GSoC year, maintenance mode) directly from database system settings.
   - **Sync Health**: Scans active repository synchronization records for failures (`syncStatus === 'failed'`). If failures exist, it reports `Warning`, otherwise `Healthy`.
3. **Audit Log Integration**: Collects the top 5 most recent administrator operations from the audit logging pipeline, formatting details (timestamp, action, target) and joining the acting administrator's username.

---

### H. Admin Contributor Intelligence & Aggregated Analytics Flow
To empower maintainers to monitor overall community health, track rankings, and review contribution patterns without client-side calculation overhead, WebiU implements a dedicated contributor intelligence analytics pipeline.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrator
    participant UI as AdminContributorsComponent
    participant Server as AnalyticsController
    participant Service as ContributorAnalyticsService
    participant DB as PostgreSQL (TypeORM)

    Admin->>UI: Open /admin/contributors page
    UI->>Server: GET /admin/contributors (with Cookie)
    Note over Server: AdminGuard decodes session cookie<br/>validates active role permissions
    Server->>Service: getContributorAnalytics()
    
    rect rgb(30, 30, 45)
        Note over Service: Concurrently execute SQL Aggregations
        Service->>DB: Count total contributors & active repositories
        Service->>DB: Calculate average contributors per repository
        Service->>DB: Calculate average contributions per contributor
        Service->>DB: Fetch top contributor total and largest community size
        Service->>DB: Query top 10 leaderboard & explorer list with counts
        Service->>DB: Fetch distribution buckets & community insights
        Service->>DB: List 10 most recent synced contributors (createdAt DESC)
        DB-->>Service: Return aggregated record results
    end
    
    Service->>Server: Return consolidated analytics object
    Server-->>UI: 200 OK (Single JSON Payload)
    Note over UI: Bind metrics to count-up directive<br/>Render Chart.js canvases (Participation & Distribution)
    UI-->>Admin: Render premium analytics dashboard
```

Key features of this pipeline include:
1. **SQL-Driven Aggregation**: Heavily groups and aggregates statistics (leaderboard metrics, buckets calculation, community sizes, average contributions) directly inside the database using optimized TypeORM QueryBuilder operations, ensuring high performance even with large contributor pools.
2. **Single Payload Execution**: Consolidates all metrics, charts data (repository participation horizontal bar, bucket distribution vertical bar), insights, top lists, paginated explorer mapping, and recent logs in one single payload, minimizing network round-trip overhead.
3. **Adaptive Visual Theme**: Dynamically translates HSL design tokens and listens to theme changes to redraw Chart.js canvas elements, rendering seamless dark-mode visual elements that align with the rest of WebiU's premium UI.

---

### I. Admin Repository Intelligence & Aggregated Analytics Flow
To empower maintainers to monitor overall repository health, popularity index, visibility, and technology stack distributions without client-side calculation overhead, WebiU implements a dedicated repository intelligence analytics pipeline.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrator
    participant UI as AdminRepositoriesComponent
    participant Server as RepositoryAnalyticsController
    participant Service as RepositoryAnalyticsService
    participant DB as PostgreSQL (TypeORM)

    Admin->>UI: Open /admin/repositories page
    UI->>Server: GET /admin/repositories (with Cookie)
    Note over Server: AdminGuard decodes session cookie<br/>validates active role permissions
    Server->>Service: getRepositoryAnalytics()
    
    rect rgb(30, 30, 45)
        Note over Service: Concurrently execute SQL Aggregations
        Service->>DB: Count total, public, private, and archived repositories
        Service->>DB: Calculate average stars, forks, and contributors per repo
        Service->>DB: Fetch top 10 popular repositories (stars DESC)
        Service->>DB: Query fork, contributor, topic, and language distributions
        Service->>DB: Fetch health insights (most starred, most forked, largest community)
        Service->>DB: Query complete explorer list with counts
        DB-->>Service: Return aggregated record results
    end
    
    Service->>Server: Return consolidated analytics object
    Server-->>UI: 200 OK (Single JSON Payload)
    Note over UI: Bind metrics to count-up directive<br/>Render Chart.js canvases (Amber stars, Purple contributors, Cyan forks, Lime languages)
    UI-->>Admin: Render premium analytics dashboard
```

Key features of this pipeline include:
1. **Consolidated Response Pipeline**: Aggregates total metrics, leaderboard rankings, multiple chart distributions (Popularity, Contributor, Fork, Topic, Language, and Visibility), highlighted health anomalies, and complete searchable table details in a single request.
2. **Dynamic Database Mapping**: Synchronizes visibility, archived states, and repository technologies (primary language, topics array) from GitHub directly into TypeORM entity fields during regular webhooks and reconciliation runs.
3. **Flexible Chart Updates**: Automatically registers to WebiU's custom reactive theme service, letting the dashboard redraw Chart.js canvas elements cleanly when administrators switch between light and dark modes.

---

## 5. Deployment Architectures

### A. Backend Deployment (Render.com)
The backend container runs on Render as a Web Service.
* **Working Directory Context**: Set `Root Directory` in Render to `webiu-server`. This ensures commands run inside the NestJS project folder.
* **Build Command**: `npm install && npm run build`
* **Start Command**: `npm run start:prod`
* **Health Checks**: Configure the Render health check path to `/health`. Render polls this during builds and only redirects user traffic once a `200 OK` response is received.
* **Database Connection**: Ensure `DATABASE_SSL=true` is set on Render to support encrypted database connections.

### B. Frontend Deployment (GitHub Pages)
The frontend is compiled into static HTML/CSS/JS files and hosted on GitHub Pages.
* **Build Action**: Built using `npx ng build --configuration production --base-href=/Webiu/`.
* **Custom API URL Injection**:
  * By default, the production build points to `https://api.c2si.org`.
  * You can override the API URL at build-time by supplying the `--define.API_URL` parameter to the Angular compiler:
    ```bash
    npx ng build --configuration production --define.API_URL="\"https://my-custom-api.com\""
    ```
* **SPA Routing Fallback (`404.html`)**:
  * Since GitHub Pages is a static file server, refreshing or directly entering a deep subroute (like `/projects` or `/admin`) returns a `404 Not Found` page instead of routing it to Angular.
  * **Solution**: Our build workflow copies `index.html` to `404.html` in the build output (`cp dist/webiu/browser/index.html dist/webiu/browser/404.html`).
  * When GitHub Pages encounters a subroute refresh, it serves `404.html`. The browser loads the Angular bundle, reads the URL path, and resolves the correct client component dynamically.