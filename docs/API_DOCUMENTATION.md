# WebiU 2.0 — API Documentation

**Base URL (local):** `http://localhost:5050`

All endpoints return JSON. Endpoints that call the GitHub API are cached for **5 minutes** on the backend (in-memory) and also send `Cache-Control: public, max-age=300` headers so browsers and proxies can cache responses too.

> **Postman Collection:** A ready-to-import Postman collection is available at [`webiu.postman_collection.json`](./webiu.postman_collection.json) (same folder as this file). See [Importing into Postman](#importing-into-postman) at the bottom of this document.

---

## Table of Contents

1. [Projects](#1-projects)
   - [GET /api/projects/projects](#get-apiprojectsprojects)
   - [GET /api/issues/issuesAndPr](#get-apiissuesissuesandpr)
2. [Contributors](#2-contributors)
   - [GET /api/contributor/contributors](#get-apicontributorcontributors)
   - [GET /api/contributor/issues/:username](#get-apicontributorissuesusername)
   - [GET /api/contributor/pull-requests/:username](#get-apicontributorpull-requestsusername)
   - [GET /api/contributor/stats/:username](#get-apicontributorstatsusername)
3. [Authentication](#3-authentication)
   - [POST /api/v1/auth/register](#post-apiv1authregister)
   - [POST /api/v1/auth/login](#post-apiv1authlogin)
   - [GET /api/v1/auth/verify-email](#get-apiv1authverify-email)
4. [OAuth](#4-oauth)
   - [GET /auth/google](#get-authgoogle)
   - [GET /auth/google/callback](#get-authgooglecallback)
   - [GET /auth/github](#get-authgithub)
   - [GET /auth/github/callback](#get-authgithubcallback)
5. [User](#5-user)
   - [GET /api/user/followersAndFollowing/:username](#get-apiuserfollowersandfollowingusername)
6. [Error Reference](#6-error-reference)
7. [Importing into Postman](#importing-into-postman)

---

## 1. Projects

### `GET /api/projects/projects`

Returns all repositories in the `c2siorg` GitHub organisation, enriched with open pull-request counts.

**Cache:** 5 minutes (backend in-memory + `Cache-Control` header)

**Request**

```
GET http://localhost:5050/api/projects/projects
```

No query parameters or request body required.

**Success Response — `200 OK`**

```json
{
  "repositories": [
    {
      "id": 123456789,
      "name": "Webiu",
      "full_name": "c2siorg/Webiu",
      "description": "The official website for C2SI and SCoRe Lab",
      "html_url": "https://github.com/c2siorg/Webiu",
      "stargazers_count": 42,
      "forks_count": 18,
      "open_issues_count": 5,
      "language": "TypeScript",
      "topics": ["angular", "nestjs", "open-source"],
      "visibility": "public",
      "default_branch": "master",
      "pull_requests": 3
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `repositories` | `array` | List of repository objects |
| `repositories[].id` | `number` | GitHub repository ID |
| `repositories[].name` | `string` | Repository name |
| `repositories[].full_name` | `string` | `org/repo` format |
| `repositories[].description` | `string \| null` | Repository description |
| `repositories[].html_url` | `string` | GitHub URL |
| `repositories[].stargazers_count` | `number` | Star count |
| `repositories[].forks_count` | `number` | Fork count |
| `repositories[].open_issues_count` | `number` | Open issues count |
| `repositories[].language` | `string \| null` | Primary language |
| `repositories[].pull_requests` | `number` | Open pull-request count |

**Error Responses**

| Status | Description |
|--------|-------------|
| `500 Internal Server Error` | GitHub API call failed |

---

### `GET /api/issues/issuesAndPr`

Returns the count of open issues and open pull requests for a specific repository.

**Cache:** 5 minutes per `org+repo` combination

**Request**

```
GET http://localhost:5050/api/issues/issuesAndPr?org=c2siorg&repo=Webiu
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

### `GET /api/contributor/contributors`

Returns an aggregated leaderboard of all contributors across every repository in the `c2siorg` organisation, sorted by total contributions.

**Cache:** 5 minutes

**Request**

```
GET http://localhost:5050/api/contributor/contributors
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

### `GET /api/contributor/issues/:username`

Returns all issues created by a specific GitHub user within the `c2siorg` organisation.

**Cache:** 5 minutes per username

**Request**

```
GET http://localhost:5050/api/contributor/issues/octocat
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

### `GET /api/contributor/pull-requests/:username`

Returns all pull requests created by a specific GitHub user within the `c2siorg` organisation. Includes merge status for closed PRs.

**Cache:** 5 minutes per username

**Request**

```
GET http://localhost:5050/api/contributor/pull-requests/octocat
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

### `GET /api/contributor/stats/:username`

Returns both issues and pull requests for a user in a single request. Equivalent to calling `/issues/:username` and `/pull-requests/:username` in parallel.

**Cache:** 5 minutes per username (each sub-query is independently cached)

**Request**

```
GET http://localhost:5050/api/contributor/stats/octocat
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

> ⚠️ **Note:** Email/password authentication endpoints (`register`, `login`, `verify-email`) currently return `501 Not Implemented` because they require a MongoDB database connection, which is not configured by default. These endpoints are scaffolded and ready to be enabled once a database is connected.

---

### `POST /api/v1/auth/register`

Registers a new user account.

**Request**

```
POST http://localhost:5050/api/v1/auth/register
Content-Type: application/json
```

**Request Body**

```json
{
  "name": "John Doe",
  "email": "johndoe@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "githubId": "johndoe"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | `string` | ✅ Yes | Non-empty string |
| `email` | `string` | ✅ Yes | Valid email format |
| `password` | `string` | ✅ Yes | Minimum 6 characters |
| `confirmPassword` | `string` | ✅ Yes | Must match `password` |
| `githubId` | `string` | ❌ No | Optional GitHub username |

**Success Response — `201 Created`**

```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "userId123",
      "name": "John Doe",
      "email": "johndoe@example.com"
    },
    "token": "<JWT_TOKEN>"
  }
}
```

**Error Responses**

| Status | Body | Description |
|--------|------|-------------|
| `400 Bad Request` | `{ "message": "Invalid email format" }` | Email validation failed |
| `400 Bad Request` | `{ "message": "Passwords do not match" }` | `password` ≠ `confirmPassword` |
| `400 Bad Request` | `{ "message": "User already exists" }` | Email already registered |
| `501 Not Implemented` | `{ "message": "Registration requires MongoDB..." }` | Database not connected |
| `500 Internal Server Error` | `{ "message": "..." }` | Unexpected server error |

---

### `POST /api/v1/auth/login`

Logs in an existing user and returns a JWT token.

**Request**

```
POST http://localhost:5050/api/v1/auth/login
Content-Type: application/json
```

**Request Body**

```json
{
  "email": "johndoe@example.com",
  "password": "password123"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | `string` | ✅ Yes | Valid email format |
| `password` | `string` | ✅ Yes | Non-empty string |

**Success Response — `200 OK`**

```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "userId123",
      "name": "John Doe",
      "email": "johndoe@example.com",
      "githubId": "johndoe"
    },
    "token": "<JWT_TOKEN>"
  }
}
```

**Error Responses**

| Status | Body | Description |
|--------|------|-------------|
| `400 Bad Request` | `{ "message": "Invalid email format" }` | Email validation failed |
| `401 Unauthorized` | `{ "message": "Invalid email or password" }` | Wrong credentials |
| `501 Not Implemented` | `{ "message": "Login requires MongoDB..." }` | Database not connected |
| `500 Internal Server Error` | `{ "message": "..." }` | Unexpected server error |

---

### `GET /api/v1/auth/verify-email`

Verifies a user's email address using the token sent in the verification email.

**Request**

```
GET http://localhost:5050/api/v1/auth/verify-email?token=<VERIFICATION_TOKEN>
```

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | `string` | ✅ Yes | Email verification token (sent via email on registration) |

**Success Response — `200 OK`**

```json
{
  "status": "success",
  "message": "Email verified successfully"
}
```

**Error Responses**

| Status | Description |
|--------|-------------|
| `400 Bad Request` | Token is invalid or expired |
| `501 Not Implemented` | Database not connected |

---

## 4. OAuth

OAuth endpoints redirect the browser — they are not JSON APIs. Use them by navigating to the URL directly (e.g. clicking a "Sign in with Google" button). After authorization, the backend redirects back to the frontend with user data encoded in the URL query string.

---

### `GET /auth/google`

Initiates the Google OAuth 2.0 authorization flow. Redirects the browser to Google's consent screen.

**Request**

```
GET http://localhost:5050/auth/google
```

**Behaviour:** Browser is redirected to `https://accounts.google.com/o/oauth2/v2/auth?...`

**Required environment variables:** `GOOGLE_CLIENT_ID`, `GOOGLE_REDIRECT_URI`

---

### `GET /auth/google/callback`

Google OAuth callback. Handled automatically by Google after the user grants permission. Exchanges the authorization code for tokens, verifies the ID token, and redirects to the frontend.

**Request** *(called by Google, not directly by the client)*

```
GET http://localhost:5050/auth/google/callback?code=<AUTH_CODE>
```

**On success:** Redirects to `http://localhost:4200?user=<URL_ENCODED_USER_JSON>`

The `user` query parameter contains a URL-encoded JSON object:

```json
{
  "id": "google-user-id",
  "email": "user@gmail.com",
  "name": "John Doe",
  "picture": "https://lh3.googleusercontent.com/..."
}
```

**Error Responses**

| Status | Description |
|--------|-------------|
| `400 Bad Request` | Authorization code missing |
| `500 Internal Server Error` | Token exchange or verification failed |

---

### `GET /auth/github`

Initiates the GitHub OAuth authorization flow. Redirects the browser to GitHub's authorization page.

**Request**

```
GET http://localhost:5050/auth/github
```

**Behaviour:** Browser is redirected to `https://github.com/login/oauth/authorize?...`

**Required environment variables:** `GITHUB_CLIENT_ID`, `GITHUB_REDIRECT_URI`

---

### `GET /auth/github/callback`

GitHub OAuth callback. Handled automatically by GitHub after the user grants permission. Exchanges the authorization code for an access token, fetches user info, and redirects to the frontend.

**Request** *(called by GitHub, not directly by the client)*

```
GET http://localhost:5050/auth/github/callback?code=<AUTH_CODE>
```

**On success:** Redirects to `http://localhost:4200?user=<URL_ENCODED_USER_JSON>`

The `user` query parameter contains a URL-encoded JSON object:

```json
{
  "login": "octocat",
  "id": 583231,
  "name": "The Octocat",
  "email": "octocat@github.com",
  "avatar_url": "https://avatars.githubusercontent.com/u/583231?v=4",
  "html_url": "https://github.com/octocat"
}
```

**Error Responses**

| Status | Description |
|--------|-------------|
| `400 Bad Request` | Authorization code missing |
| `500 Internal Server Error` | Token exchange or user info fetch failed |

---

## 5. User

### `GET /api/user/followersAndFollowing/:username`

> ⚠️ **Note:** This endpoint is currently a placeholder and returns a stub response. Full implementation is pending.

**Request**

```
GET http://localhost:5050/api/user/followersAndFollowing/octocat
```

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | `string` | ✅ Yes | GitHub username |

**Response — `200 OK` (stub)**

```json
{ "0": 0 }
```

---

## 6. Error Reference

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
