/**
 * githubResponseSanitizer.ts
 * Schema-aware sanitization layer for GitHub API responses
 * Fixes Issue #547 — Arush Kumar
 */

export function sanitizeRepository(repo: any) {
    if (!repo || typeof repo !== 'object') return null;
    return {
        id: repo.id ?? null,
        name: repo.name ?? null,
        full_name: repo.full_name ?? null,
        description: repo.description ?? null,
        html_url: repo.html_url ?? null,
        stargazers_count: repo.stargazers_count ?? 0,
        forks_count: repo.forks_count ?? 0,
        open_issues_count: repo.open_issues_count ?? 0,
        language: repo.language ?? null,
        topics: Array.isArray(repo.topics) ? repo.topics : [],
        updated_at: repo.updated_at ?? null,
        archived: repo.archived ?? false,
    };
}

export function sanitizeContributor(contributor: any) {
    if (!contributor || typeof contributor !== 'object') return null;
    return {
        login: contributor.login ?? null,
        id: contributor.id ?? null,
        avatar_url: contributor.avatar_url ?? null,
        html_url: contributor.html_url ?? null,
        contributions: contributor.contributions ?? 0,
        type: contributor.type ?? null,
    };
}

export function sanitizeIssue(issue: any) {
    if (!issue || typeof issue !== 'object') return null;
    return {
        id: issue.id ?? null,
        number: issue.number ?? null,
        title: issue.title ?? null,
        html_url: issue.html_url ?? null,
        state: issue.state ?? null,
        created_at: issue.created_at ?? null,
        updated_at: issue.updated_at ?? null,
        pull_request: issue.pull_request ? true : undefined,
        labels: Array.isArray(issue.labels)
            ? issue.labels.map((l: any) => ({
                name: l.name ?? null,
                color: l.color ?? null,
            }))
            : [],
    };
}

export function sanitizePullRequest(pr: any) {
    if (!pr || typeof pr !== 'object') return null;
    return {
        id: pr.id ?? null,
        number: pr.number ?? null,
        title: pr.title ?? null,
        html_url: pr.html_url ?? null,
        state: pr.state ?? null,
        created_at: pr.created_at ?? null,
        updated_at: pr.updated_at ?? null,
        merged_at: pr.merged_at ?? null,
    };
}