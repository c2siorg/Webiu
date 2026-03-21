export interface GithubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  archived: boolean;
  fork: boolean;
  created_at: string;
  pushed_at: string;
  size?: number;
  [key: string]: unknown;
}

export interface GithubIssue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  closed_at?: string;
  user?: {
    login: string;
  };
  repository_url: string;
  html_url: string;
  [key: string]: unknown;
}

export interface GithubPullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  closed_at?: string;
  merged_at?: string;
  draft?: boolean;
  user?: {
    login: string;
  };
  repository_url: string;
  html_url: string;
  pull_request?: {
    url: string;
  };
  [key: string]: unknown;
}

export interface GithubUserProfile {
  login: string;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  followers: number;
  following: number;
  created_at: string;
  [key: string]: unknown;
}

export interface GithubContributor {
  login: string;
  contributions: number;
  avatar_url: string;
  html_url: string;
  merged_prs?: number;
  closed_prs?: number;
  open_prs?: number;
  issues_created?: number;
  followers?: number; // ← Added for type-safety
  following?: number; // ← Added for type-safety
  [key: string]: unknown;
}
