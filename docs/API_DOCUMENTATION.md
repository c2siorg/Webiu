# WebiU 2.0 — API Documentation Guide

This document describes all API endpoints exposed by the NestJS backend (`webiu-server`). 

All responses are formatted in JSON. Endpoints are divided into public clientside endpoints, webhook receivers, and restricted administrative panels.

> **Postman Collection:** A ready-to-import Postman collection is available at [`webiu.postman_collection.json`](./webiu.postman_collection.json) (same folder as this file). See [Importing into Postman](#importing-into-postman) at the bottom of this document.

---

## Table of Contents

1. [Authentication Endpoints](#1-authentication-endpoints)
   * [POST /auth/login](#post-authlogin)
   * [POST /auth/logout](#post-authlogout)
   * [GET /auth/me](#get-authme)
2. [Project & Repository Endpoints](#2-project--repository-endpoints)
   * [GET /api/v1/projects](#get-apiv1projects)
   * [GET /api/v1/projects/search](#get-apiv1projectssearch)
   * [GET /api/v1/projects/tech-stack/:repo](#get-apiv1projectstech-stackrepo)
   * [GET /api/v1/projects/:name](#get-apiv1projectsname)
   * [GET /api/v1/projects/:name/insights](#get-apiv1projectsnameinsights)
   * [GET /api/v1/projects/:name/contributors](#get-apiv1projectsnamecontributors)
   * [POST /api/v1/projects/sync](#post-apiv1projectssync)
   * [GET /api/v1/issues/issuesAndPr](#get-apiv1issuesissuesandpr)
3. [Contributor Endpoints](#3-contributor-endpoints)
   * [GET /api/v1/contributor/contributors](#get-apiv1contributorcontributors)
   * [GET /api/v1/contributor/issues/:username](#get-apiv1contributorissuesusername)
   * [GET /api/v1/contributor/pull-requests/:username](#get-apiv1contributorpull-requestsusername)
   * [GET /api/v1/contributor/stats/:username](#get-apiv1contributorstatsusername)
4. [GitHub Webhook Endpoint](#4-github-webhook-endpoint)
   * [POST /api/v1/github-webhook](#post-apiv1github-webhook)
5. [System Configuration Endpoints](#5-system-configuration-endpoints)
   * [GET /admin/settings](#get-adminsettings)
   * [PATCH /admin/settings](#patch-adminsettings)
   * [GET /admin/settings/public](#get-adminsettingspublic)
6. [Admin Profile Endpoints](#6-admin-profile-endpoints)
   * [GET /admin/profile](#get-adminprofile)
   * [PATCH /admin/profile/username](#patch-adminprofileusername)
   * [PATCH /admin/profile/password](#patch-adminprofilepassword)
7. [GSoC CMS Endpoints](#7-gsoc-cms-endpoints)
   * [GET /gsoc/current](#get-gsoccurrent)
   * [GET /gsoc/current/ideas](#get-gsoccurrentideas)
   * [GET /admin/gsoc/programs](#get-admingsocprograms)
   * [POST /admin/gsoc/programs](#post-admingsocprograms)
   * [PATCH /admin/gsoc/programs/:id](#patch-admingsocprogramsid)
   * [DELETE /admin/gsoc/programs/:id](#delete-admingsocprogramsid)
   * [GET /admin/gsoc/ideas](#get-admingsocideas)
   * [POST /admin/gsoc/ideas](#post-admingsocideas)
   * [PATCH /admin/gsoc/ideas/reorder](#patch-admingsocideasreorder)
   * [PATCH /admin/gsoc/ideas/:id](#patch-admingsocideasid)
   * [DELETE /admin/gsoc/ideas/:id](#delete-admingsocideasid)
   * [GET /admin/gsoc/mentors](#get-admingsocmentors)
   * [POST /admin/gsoc/mentors](#post-admingsocmentors)
   * [PATCH /admin/gsoc/mentors/:id](#patch-admingsocmentorsid)
   * [DELETE /admin/gsoc/mentors/:id](#delete-admingsocmentorsid)
8. [Audit Trail Endpoints](#8-audit-trail-endpoints)
   * [GET /admin/audit](#get-adminaudit)
   * [GET /admin/audit/:id](#get-adminauditid)
9. [Health & Diagnostics](#9-health--diagnostics)
   * [GET /health](#get-health)
   * [GET /ready](#get-ready)
10. [Importing into Postman](#importing-into-postman)

---

## 1. Authentication Endpoints

These routes manage session creation and deletion for admin accounts.

### `POST /auth/login`
* **Access**: Public
* **Purpose**: Authenticates credentials and issues a signed JWT cookie.
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "username": "admin",
    "password": "your_secure_password"
  }
  ```
* **Success Response (200 OK)**:
  * Sets cookie: `admin_session=<JWT_TOKEN>; HttpOnly; SameSite=Lax; Path=/`
  ```json
  {
    "success": true
  }
  ```

### `POST /auth/logout`
* **Access**: Public
* **Purpose**: Logs out the admin by clearing the session cookie.
* **Success Response (200 OK)**:
  * Clears cookie: `admin_session`
  ```json
  {
    "success": true
  }
  ```

### `GET /auth/me`
* **Access**: Public (Cookie verification check)
* **Purpose**: Checks if the caller has a valid, active session cookie.
* **Success Response (200 OK)**:
  ```json
  {
    "authenticated": true
  }
  ```

---

## 2. Project & Repository Endpoints

These endpoints serve data regarding GitHub repositories, backed by the PostgreSQL database.

### `GET /api/v1/projects`
* **Access**: Public
* **Cache**: `Cache-Control: public, max-age=300`
* **Purpose**: Lists repositories in the organization, paginated.
* **Query Parameters**:
  * `page` (optional): Page number (default: `1`)
  * `limit` (optional): Items per page (default: `10`, max `100`)
* **Success Response (200 OK)**:
  ```json
  {
    "total": 12,
    "page": 1,
    "limit": 10,
    "repositories": [
      {
        "id": "a90dfb22-83fc-46cd-ae38-92701dfc6a32",
        "githubRepoId": "12345678",
        "name": "Webiu",
        "description": "Showcasing open-source projects",
        "homepage": "https://c2siorg.github.io/Webiu",
        "topics": ["angular", "nestjs", "typescript"],
        "stars": 24,
        "forks": 12,
        "isActive": true,
        "pull_requests": 5
      }
    ]
  }
  ```

### `GET /api/v1/projects/search`
* **Access**: Public
* **Query Parameters**:
  * `q` (required): Search keyword (matches name or description).
  * `page`/`limit` (optional): Pagination modifiers.
* **Success Response (200 OK)**:
  * Returns a paginated list of matching repository profiles.

### `GET /api/v1/projects/tech-stack/:repo`
* **Access**: Public
* **Path Parameters**:
  * `repo`: Name of the repository.
* **Success Response (200 OK)**:
  ```json
  {
    "TypeScript": 85302,
    "HTML": 4301,
    "SCSS": 12391
  }
  ```

### `GET /api/v1/projects/:name`
* **Access**: Public
* **Path Parameters**:
  * `name`: Repository name.
* **Success Response (200 OK)**:
  * Detailed repository entity object including stars, forks, status, and dates.

### `GET /api/v1/projects/:name/insights`
* **Access**: Public
* **Purpose**: Returns repository complexity badges and recent commit activity arrays (last 52 weeks).
* **Success Response (200 OK)**:
  ```json
  {
    "complexity": "Medium",
    "activity": "High",
    "weeklyCommits": [0, 2, 5, 12, 1, 0]
  }
  ```

### `GET /api/v1/projects/:name/contributors`
* **Access**: Public
* **Purpose**: Lists contributors linked to this specific repository.
* **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "e43b2f2d-...",
      "username": "contrib-user",
      "displayName": "Contributor User",
      "avatarUrl": "https://avatars.githubusercontent.com/u/1",
      "profileUrl": "https://github.com/contrib-user",
      "contributionCount": 42
    }
  ]
  ```

### `POST /api/v1/projects/sync`
* **Access**: Admin Restricted (`AdminGuard` checks cookie)
* **Purpose**: Triggers a manual, immediate, full synchronization with the GitHub API.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Repositories synchronized successfully"
  }
  ```

### `GET /api/v1/issues/issuesAndPr`
* **Access**: Public
* **Query Parameters**:
  * `org` (required): GitHub organization.
  * `repo` (required): Repository name.
* **Success Response (200 OK)**:
  ```json
  {
    "issues": 5,
    "pullRequests": 3
  }
  ```

---

## 3. Contributor Endpoints

These routes fetch aggregated and per-user contribution metrics.

### `GET /api/v1/contributor/contributors`
* **Access**: Public
* **Rate Limit**: 5 requests per IP per minute
* **Purpose**: Returns the aggregated organization contribution leaderboard.
* **Success Response (200 OK)**:
  ```json
  [
    {
      "username": "contrib-user",
      "displayName": "Contributor User",
      "avatarUrl": "https://avatars.githubusercontent.com/u/1",
      "profileUrl": "https://github.com/contrib-user",
      "totalContributions": 204,
      "repositories": ["Webiu", "c2si-site"]
    }
  ]
  ```

### `GET /api/v1/contributor/issues/:username`
* **Access**: Public
* **Path Parameters**:
  * `username`: GitHub username.
* **Success Response (200 OK)**:
  * Array of issues created by the user within the organization.

### `GET /api/v1/contributor/pull-requests/:username`
* **Access**: Public
* **Success Response (200 OK)**:
  * Array of pull requests created by the user within the organization.

### `GET /api/v1/contributor/stats/:username`
* **Access**: Public
* **Purpose**: Combined wrapper returning both issues and pull requests lists for a user.

---

## 4. GitHub Webhook Endpoint

### `POST /api/v1/github-webhook`
* **Access**: Restricted (GitHub signature header validation)
* **Headers**: 
  * `x-hub-signature-256`: HMAC-SHA256 signature calculated over the request body using `GITHUB_WEBHOOK_SECRET`.
  * `x-github-event`: Webhook event type (only `repository` events are processed).
* **Payload Structure**: Standard GitHub repository webhook event JSON.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true
  }
  ```

---

## 5. System Configuration Endpoints

These endpoints manage global dynamic site variables in the database.

### `GET /admin/settings`
* **Access**: Admin Restricted
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "settings": {
      "gsoc.current_year": 2026,
      "gsoc.show_ideas_page": true,
      "gsoc.registration_open": true,
      "site.title": "WebiU",
      "site.description": "C2SI portal",
      "site.maintenance_mode": false
    }
  }
  ```

### `PATCH /admin/settings`
* **Access**: Admin Restricted
* **Request Body**: Partial settings object containing key-value configurations to update.
  ```json
  {
    "site.maintenance_mode": true,
    "gsoc.current_year": 2026
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Settings updated successfully.",
    "settings": { ... }
  }
  ```

### `GET /admin/settings/public`
* **Access**: Public
* **Purpose**: Retrieves all settings. Used by the client browser layout page to dynamically apply title, year, and holding screen states.
* **Success Response (200 OK)**: Similar settings map structure.

---

## 6. Admin Profile Endpoints

These routes allow administrators to manage their profile data and rotate credentials.

### `GET /admin/profile`
* **Access**: Admin Restricted (`AdminGuard` checks cookie)
* **Purpose**: Retrieves administrator details.
* **Success Response (200 OK)**:
  ```json
  {
    "username": "admin",
    "role": "administrator",
    "createdAt": "2026-06-20T00:34:14.000Z",
    "lastLoginAt": "2026-06-20T00:35:00.000Z"
  }
  ```

### `PATCH /admin/profile/username`
* **Access**: Admin Restricted (`AdminGuard` checks cookie)
* **Purpose**: Updates the username.
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "username": "new_admin_username"
  }
  ```
* **Success Response (200 OK)**:
  * Clears cookie: `admin_session` (invalidates session, forcing logout)
  ```json
  {
    "success": true,
    "message": "Username updated successfully. Please log in again."
  }
  ```

### `PATCH /admin/profile/password`
* **Access**: Admin Restricted (`AdminGuard` checks cookie)
* **Purpose**: Updates the administrator password.
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "currentPassword": "old_password",
    "newPassword": "new_secure_password",
    "confirmPassword": "new_secure_password"
  }
  ```
* **Success Response (200 OK)**:
  * Clears cookie: `admin_session` (invalidates session, forcing logout)
  ```json
  {
    "success": true,
    "message": "Password updated successfully. Please log in again."
  }
  ```

---

## 7. GSoC CMS Endpoints

These endpoints power the Summer of Code administration portal and public landing page.

### `GET /gsoc/current`
* **Access**: Public
* **Purpose**: Retrieves details of the currently published, active GSoC program year.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "program": {
      "id": "b328a2a1-...",
      "year": 2026,
      "title": "GSoC 2026",
      "description": "Welcome to GSoC 2026",
      "slackUrl": "https://c2si.slack.com",
      "proposalTemplateUrl": "https://docs.google.com/..."
    }
  }
  ```

### `GET /gsoc/current/ideas`
* **Access**: Public
* **Purpose**: Retrieves the list of published project ideas for the current active program.

---

### `GET /admin/gsoc/programs`
* **Access**: Admin Restricted
* **Purpose**: Lists all program years (draft, published, or archived).

### `POST /admin/gsoc/programs`
* **Access**: Admin Restricted
* **Request Body**:
  ```json
  {
    "year": 2026,
    "title": "GSoC 2026",
    "description": "Program description",
    "status": "DRAFT",
    "isActive": false
  }
  ```

### `PATCH /admin/gsoc/programs/:id`
* **Access**: Admin Restricted
* **Request Body**: Partial program updates.

### `DELETE /admin/gsoc/programs/:id`
* **Access**: Admin Restricted

---

### `GET /admin/gsoc/ideas`
* **Access**: Admin Restricted
* **Query Parameters**:
  * `programId` (optional): Filter ideas by program.

### `POST /admin/gsoc/ideas`
* **Access**: Admin Restricted
* **Request Body**:
  ```json
  {
    "programId": "b328a2a1-...",
    "projectNumber": 1,
    "title": "Build dynamic dashboards",
    "explanation": "Markdown description of project",
    "difficulty": "Medium",
    "durationHours": 175,
    "status": "DRAFT",
    "mentorIds": ["uuid-of-mentor"]
  }
  ```

### `PATCH /admin/gsoc/ideas/reorder`
* **Access**: Admin Restricted
* **Request Body**:
  ```json
  {
    "orderedIds": ["id-3", "id-1", "id-2"]
  }
  ```

### `PATCH /admin/gsoc/ideas/:id`
* **Access**: Admin Restricted
* **Request Body**: Partial idea updates.

### `DELETE /admin/gsoc/ideas/:id`
* **Access**: Admin Restricted

---

### `GET /admin/gsoc/mentors`
* **Access**: Admin Restricted

### `POST /admin/gsoc/mentors`
* **Access**: Admin Restricted
  ```json
  {
    "name": "Jane Doe",
    "githubHandle": "janedoe"
  }
  ```

### `PATCH /admin/gsoc/mentors/:id`
* **Access**: Admin Restricted

### `DELETE /admin/gsoc/mentors/:id`
* **Access**: Admin Restricted

---

## 8. Audit Trail Endpoints

These routes allow administrators to inspect dynamic configuration logs and profile credential histories.

### `GET /admin/audit`
* **Access**: Admin Restricted (`AdminGuard` checks cookie)
* **Purpose**: Retrieves a paginated list of administrative activity logs.
* **Query Parameters**:
  * `page` (optional): Page number (default: `1`)
  * `limit` (optional): Items per page (default: `20`, max `100`)
  * `action` (optional): Filter by action (e.g. `SETTING_UPDATED`)
  * `entityType` (optional): Filter by entity type (e.g. `settings`)
  * `startDate` (optional): Filter logs created after this ISO date
  * `endDate` (optional): Filter logs created before this ISO date
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "logs": [
      {
        "id": "e49dfb22-83fc-46cd-ae38-92701dfc6a99",
        "adminId": "a90dfb22-83fc-46cd-ae38-92701dfc6a32",
        "action": "SETTING_UPDATED",
        "entityType": "settings",
        "entityId": "gsoc.current_year",
        "oldValue": "2025",
        "newValue": "2026",
        "metadata": null,
        "createdAt": "2026-06-22T00:30:00.000Z",
        "admin": {
          "id": "a90dfb22-83fc-46cd-ae38-92701dfc6a32",
          "username": "admin"
        }
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
  ```

### `GET /admin/audit/:id`
* **Access**: Admin Restricted (`AdminGuard` checks cookie)
* **Purpose**: Retrieves specific detail for an audit log entry.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "log": {
      "id": "e49dfb22-83fc-46cd-ae38-92701dfc6a99",
      "adminId": "a90dfb22-83fc-46cd-ae38-92701dfc6a32",
      "action": "SETTING_UPDATED",
      "entityType": "settings",
      "entityId": "gsoc.current_year",
      "oldValue": "2025",
      "newValue": "2026",
      "metadata": null,
      "createdAt": "2026-06-22T00:30:00.000Z",
      "admin": {
        "id": "a90dfb22-83fc-46cd-ae38-92701dfc6a32",
        "username": "admin"
      }
    }
  }
  ```

---

## 9. Health & Diagnostics

### `GET /health`
* **Access**: Public
* **Purpose**: Polled by hosting environments (like Render) to verify container availability.
* **Success Response (200 OK)**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-06-19T17:15:32Z",
    "environment": "production"
  }
  ```

### `GET /ready`
* **Access**: Public
* **Success Response (200 OK)**:
  ```json
  {
    "ready": true,
    "timestamp": "2026-06-19T17:15:32Z"
  }
  ```

---

## 10. Importing into Postman

A pre-configured Postman Collection file with all these endpoints mapped out is located at:
```
docs/webiu.postman_collection.json
```

### Steps to Import:
1. Open your **Postman** desktop application or sign in on the web.
2. Click the **Import** button in the top-left navigation panel.
3. Choose **File** and upload `docs/webiu.postman_collection.json` from the repository root.
4. Click **Import** to confirm.
5. In Postman, go to the collection and select the **Variables** tab to configure your `baseUrl` (default value is `http://localhost:5050` for local runs).
