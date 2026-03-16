import { GithubIssue } from './github-issue.interface';

export interface GithubSearchResponse<T> {
  total_count: number;
  incomplete_results: boolean;
  items: T[];
}

export type GithubIssueSearchResponse = GithubSearchResponse<GithubIssue>;
/** Search API for PRs (/search/issues?type:pr) returns GithubIssue-shaped objects, not full GithubPullRequest */
export type GithubPullRequestSearchResponse = GithubSearchResponse<GithubIssue>;
