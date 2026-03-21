export type CacheKey =
  | `org_repos_${string}`
  | `pulls_${string}_${string}`
  | `issues_${string}_${string}`
  | `contributors_${string}_${string}`
  | `search_issues:${string}:${string}`
  | `search_prs:${string}:${string}`
  | `user_profile_${string}`
  | `user_social:${string}`
  | `projects_p${number}_pp${number}`
  | `issues_pr_count_${string}_${string}`
  | `projects_search_${string}`
  | `search_repos:${string}:${string}`
  | 'all_contributors';

export interface GithubAbstractUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: string;
}

export interface GithubIssue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  user: GithubAbstractUser;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  html_url: string;
  body?: string;
  pull_request?: {
    url: string;
    html_url: string;
    diff_url: string;
    patch_url: string;
  };
}

export interface GithubPullRequest extends GithubIssue {
  merged_at: string | null;
  draft?: boolean;
}

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
}

export interface GithubContributor extends GithubAbstractUser {
  contributions: number;
}

export interface GithubUserProfile extends GithubAbstractUser {
  name: string | null;
  company: string | null;
  blog: string;
  location: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

export interface GithubOauthResponse {
  access_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
}

export type CacheValue<K extends CacheKey> = K extends `org_repos_${string}`
  ? GithubRepo[]
  : K extends `pulls_${string}`
    ? GithubPullRequest[]
    : K extends `issues_pr_count_${string}_${string}`
      ? { issues: number; pullRequests: number }
      : K extends `issues_${string}`
        ? GithubIssue[]
        : K extends `contributors_${string}`
          ? GithubContributor[]
          : K extends `search_issues:${string}`
            ? GithubIssue[]
            : K extends `search_prs:${string}`
              ? GithubPullRequest[]
              : K extends `user_profile_${string}`
                ? GithubUserProfile
                : K extends `user_social:${string}`
                  ? { followers: number; following: number }
                  : K extends `projects_p${number}_pp${number}`
                    ? {
                        total: number;
                        page: number;
                        limit: number;
                        repositories: (GithubRepo & {
                          pull_requests: number;
                        })[];
                      }
                    : K extends 'all_contributors'
                      ? {
                          login: string;
                          contributions: number;
                          repos: string[];
                          avatar_url: string;
                        }[]
                      : K extends `projects_search_${string}`
                        ? {
                            total: number;
                            repositories: (GithubRepo & {
                              pull_requests: number;
                            })[];
                          }
                        : K extends `search_repos:${string}`
                          ? GithubRepo[]
                          : never;

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
