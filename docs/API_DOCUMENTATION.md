# WebiU 2.0 — API Documentation

**Base URL (local):** `http://localhost:5050`

All endpoints return JSON. Repository and contributor list endpoints retrieve their data directly from the local PostgreSQL database, which is synchronized with GitHub in the background via webhooks and scheduled reconciliation. Other dynamic endpoints (e.g., tech stack, user issues and pull requests, stats) perform cached live GitHub API calls with a 5-minute TTL and send `Cache-Control: public, max-age=300` headers so browsers and proxies can cache responses.

> **Postman Collection:** A ready-to-import Postman collection is available at [`webiu.postman_collection.json`](./webiu.postman_collection.json) (same folder as this file). See [Importing into Postman](#importing-into-postman) at the bottom of this document.

---

## Table of Contents

1. [Projects](#1-projects)
   - [GET /api/v1/projects](#get-apiv1projects)
   - [GET /api/v1/projects/search](#get-apiv1projectssearch)
   - [GET /api/v1/projects/tech-stack/:repo](#get-apiv1projectstech-stackrepo)
   - [GET /api/v1/projects/:name](#get-apiv1projectsname)
   - [GET /api/v1/projects/:name/insights](#get-apiv1projectsnameinsights)
   - [GET /api/v1/projects/:name/contributors](#get-apiv1projectsnamecontributors)
   - [GET /api/v1/issues/issuesAndPr](#get-apiv1issuesissuesandpr)
2. [Contributors](#2-contributors)
   - [GET /api/v1/contributor/contributors](#get-apicontributorcontributors)
   - [GET /api/v1/contributor/issues/:username](#get-apicontributorissuesusername)
   - [GET /api/v1/contributor/pull-requests/:username](#get-apicontributorpull-requestsusername)
   - [GET /api/v1/contributor/stats/:username](#get-apicontributorstatsusername)
3. [Authentication](#3-authentication)
   - [POST /auth/login](#post-authlogin)
   - [POST /auth/logout](#post-authlogout)
   - [GET /auth/me](#get-authme)
4. [Error Reference](#4-error-reference)
5. [Importing into Postman](#importing-into-postman)

---

## 1. Projects

### `GET /api/v1/projects`

Returns all repositories in the `c2siorg` organization retrieved from the local database.

**Source:** Database-backed.

**Request**

```
GET http://localhost:5050/api/v1/projects?page=1&limit=10
```

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | `number` | ❌ No | Page number (default: 1) |
| `limit` | `number` | ❌ No | Number of items per page (default: 10) |

**Success Response — `200 OK`**

```json
{
  "total": 12,
  "page": 1,
  "limit": 10,
  "repositories": [
    {
      "id": "uuid-here",
      "githubRepoId": "123456789",
      "name": "Webiu",
      "description": "The official website for C2SI and SCoRe Lab",
      "homepage": "https://c2siorg.github.io/Webiu",
      "topics": ["angular", "nestjs", "open-source"],
      "stars": 42,
      "forks": 18,
      "isActive": true,
      "pull_requests": 3
    }
  ]
}
```

---

### `GET /api/v1/projects/search`

Searches repositories using in-memory filtering matching against names and descriptions.

**Request**

```
GET http://localhost:5050/api/v1/projects/search?q=webiu&page=1&limit=10
```

---

### `GET /api/v1/projects/tech-stack/:repo`

Returns the primary programming languages breakdown (languages list) for a repository.

**Request**

```
GET http://localhost:5050/api/v1/projects/tech-stack/Webiu
```

---

### `GET /api/v1/projects/:name`

Returns full details for a single repository.

**Request**

```
GET http://localhost:5050/api/v1/projects/Webiu
```

---

### `GET /api/v1/projects/:name/insights`

Returns repository analytical insights including derived activity and complexity badges.

**Request**

```
GET http://localhost:5050/api/v1/projects/Webiu/insights
```

---

### `GET /api/v1/projects/:name/contributors`

Returns repository contributor details.

**Request**

```
GET http://localhost:5050/api/v1/projects/Webiu/contributors
```

---

### `GET /api/v1/issues/issuesAndPr`

Returns the count of open issues and open pull requests for a specific repository.

**Request**

```
GET http://localhost:5050/api/v1/issues/issuesAndPr?org=c2siorg&repo=Webiu
```

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `org` | `string` | ✅ Yes | GitHub organisation name (e.g. `c2siorg`) |
| `repo` | `string` | ✅ Yes | Repository name (e.g. `Webiu`) |

**Success Response — `200 OK`**

```json
{
  "issues": 5,
  "pullRequests": 3
}
```

| Field | Type | Description |
|-------|------|-------------|
| `issues` | `number` | Number of open issues (excluding PRs) |
| `pullRequests` | `number` | Number of open pull requests |

**Error Responses**

| Status | Body | Description |
|--------|------|-------------|
| `400 Bad Request` | `{ "message": "Organization and repository are required" }` | `org` or `repo` query param is missing |
| `500 Internal Server Error` | `{ "message": "Failed to fetch issues and PRs" }` | GitHub API call failed |

---

## 2. Contributors

### `GET /api/v1/contributor/contributors`

Returns an aggregated leaderboard of all contributors across every repository in the `c2siorg` organisation, sorted by total contributions.

**Source:** Database-backed.

**Request**

```
GET http://localhost:5050/api/v1/contributor/contributors
```

**Success Response — `200 OK`**

```json
[
  {
    "login": "octocat",
    "contributions": 247,
    "repos": ["Webiu", "SCoRe-Lab-Website", "c2si-website"],
    "avatar_url": "https://avatars.githubusercontent.com/u/583231?v=4"
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `[].login` | `string` | GitHub username |
| `[].contributions` | `number` | Total commits across all org repos |
| `[].repos` | `string[]` | Names of repos the contributor has contributed to |
| `[].avatar_url` | `string` | GitHub avatar URL |

**Error Responses**

| Status | Description |
|--------|-------------|
| `500 Internal Server Error` | Failed to fetch repositories or contributor data |

---

### `GET /api/v1/contributor/issues/:username`

Returns all issues created by a specific GitHub user within the `c2siorg` organisation.

**Cache:** 5 minutes per username

**Request**

```
GET http://localhost:5050/api/v1/contributor/issues/octocat
```

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | `string` | ✅ Yes | GitHub username |

**Success Response — `200 OK`**

```json
{
  "issues": [
    {
      "id": 987654321,
      "number": 42,
      "title": "Fix navbar overflow on mobile",
      "html_url": "https://github.com/c2siorg/Webiu/issues/42",
      "state": "open",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-16T08:00:00Z",
      "repository_url": "https://api.github.com/repos/c2siorg/Webiu"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `issues` | `array` | List of issue objects from GitHub Search API |
| `issues[].id` | `number` | GitHub issue ID |
| `issues[].number` | `number` | Issue number within the repository |
| `issues[].title` | `string` | Issue title |
| `issues[].html_url` | `string` | Direct link to the issue |
| `issues[].state` | `"open" \| "closed"` | Issue state |
| `issues[].created_at` | `string` | ISO 8601 timestamp |

**Error Responses**

| Status | Description |
|--------|-------------|
| `500 Internal Server Error` | GitHub API call failed |

---

### `GET /api/v1/contributor/pull-requests/:username`

Returns all pull requests created by a specific GitHub user within the `c2siorg` organisation. Includes merge status for closed PRs.

**Cache:** 5 minutes per username

**Request**

```
GET http://localhost:5050/api/v1/contributor/pull-requests/octocat
```

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | `string` | ✅ Yes | GitHub username |

**Success Response — `200 OK`**

```json
{
  "pullRequests": [
    {
      "id": 111222333,
      "number": 17,
      "title": "feat: add dark mode toggle",
      "html_url": "https://github.com/c2siorg/Webiu/pull/17",
      "state": "closed",
      "merged_at": "2024-02-01T14:00:00Z",
      "created_at": "2024-01-28T09:00:00Z",
      "updated_at": "2024-02-01T14:00:00Z",
      "repository_url": "https://api.github.com/repos/c2siorg/Webiu"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `pullRequests` | `array` | List of pull request objects |
| `pullRequests[].merged_at` | `string \| null` | Merge timestamp; `null` if not merged |

**Error Responses**

| Status | Description |
|--------|-------------|
| `500 Internal Server Error` | GitHub API call failed |

---

### `GET /api/v1/contributor/stats/:username`

Returns both issues and pull requests for a user in a single request. Equivalent to calling `/issues/:username` and `/pull-requests/:username` in parallel.

**Cache:** 5 minutes per username (each sub-query is independently cached)

**Request**

```
GET http://localhost:5050/api/v1/contributor/stats/octocat
```

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | `string` | ✅ Yes | GitHub username |

**Success Response — `200 OK`**

```json
{
  "issues": [
    {
      "id": 987654321,
      "number": 42,
      "title": "Fix navbar overflow on mobile",
      "html_url": "https://github.com/c2siorg/Webiu/issues/42",
      "state": "open",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pullRequests": [
    {
      "id": 111222333,
      "number": 17,
      "title": "feat: add dark mode toggle",
      "html_url": "https://github.com/c2siorg/Webiu/pull/17",
      "state": "closed",
      "merged_at": "2024-02-01T14:00:00Z",
      "created_at": "2024-01-28T09:00:00Z"
    }
  ]
}
```

**Error Responses**

| Status | Description |
|--------|-------------|
| `500 Internal Server Error` | GitHub API call failed |

---

## 3. Authentication

The authentication endpoints manage administrative access to the WebiU backend.

### `POST /auth/login`

Authenticates an administrator and sets a secure HTTP-only cookie.

**Request**

```
POST http://localhost:5050/auth/login
Content-Type: application/json
```

**Request Body**

```json
{
  "username": "admin",
  "password": "your_secure_admin_password_here"
}
```

**Response — `200 OK`**

```json
{
  "success": true
}
```

---

### `POST /auth/logout`

Logs out the authenticated administrator by clearing the session cookie.

**Request**

```
POST http://localhost:5050/auth/logout
```

**Response — `200 OK`**

```json
{
  "success": true
}
```

---

### `GET /auth/me`

Checks if the current session cookie is valid and returns authentication status.

**Request**

```
GET http://localhost:5050/auth/me
```

**Response — `200 OK`**

```json
{
  "authenticated": true
}
```

---

## 4. User

Endpoints for retrieving user social data and GitHub profile statistics.

### `GET /api/v1/user/followersAndFollowing/:username`

Returns the count of followers and following for a GitHub user.

**Request**

```
GET http://localhost:5050/api/v1/user/followersAndFollowing/octocat
```

**Response — `200 OK`**

```json
{
  "followers": 1500,
  "following": 9
}
```

---

### `POST /api/v1/user/batch-social`

Returns followers/following counts in bulk for multiple usernames.

**Request**

```
POST http://localhost:5050/api/v1/user/batch-social
Content-Type: application/json
```

**Request Body**

```json
{
  "usernames": ["octocat", "torvalds"]
}
```

**Response — `201 Created`**

```json
{
  "octocat": {
    "followers": 1500,
    "following": 9
  },
  "torvalds": {
    "followers": 190000,
    "following": 0
  }
}
```

---

### `GET /api/v1/user/profile/:username`

Returns the public GitHub profile data for a specific user.

**Request**

```
GET http://localhost:5050/api/v1/user/profile/octocat
```

---

## 5. Error Reference

All error responses follow NestJS's default exception format:

```json
{
  "statusCode": 400,
  "message": "Human-readable error description",
  "error": "Bad Request"
}
```

| HTTP Status | Meaning |
|-------------|---------|
| `400 Bad Request` | Invalid input — missing or malformed parameters |
| `401 Unauthorized` | Authentication failed |
| `404 Not Found` | Resource does not exist |
| `500 Internal Server Error` | Unexpected server-side error (often a GitHub API failure) |
| `501 Not Implemented` | Feature requires a database that is not yet connected |

---

## Importing into Postman

A Postman collection with all endpoints pre-configured is available at:

```
webiu-server/docs/webiu.postman_collection.json
```

**Steps to import:**

1. Open **Postman**.
2. Click **Import** (top-left).
3. Select **File** → choose `webiu-server/docs/webiu.postman_collection.json` from the repo root.
4. Click **Import**.

The collection includes a `baseUrl` variable set to `http://localhost:5050`. To point it at a different environment:

1. Click the collection name → **Variables** tab.
2. Update the `baseUrl` **Current Value** to your target URL.
