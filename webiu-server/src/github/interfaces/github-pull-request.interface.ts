import { GithubUser } from './github-user.interface';
import { GithubLabel, GithubMilestone } from './github-issue.interface';
import { GithubRepository } from './github-repository.interface';
import { GithubTeam, GithubAutoMerge } from './github-team.interface';

export interface GithubPullRequestRef {
  label: string;
  ref: string;
  sha: string;
  user: GithubUser;
  repo: GithubRepository | null;
}

export interface GithubPullRequestLinks {
  self: { href: string };
  html: { href: string };
  issue: { href: string };
  comments: { href: string };
  review_comments: { href: string };
  review_comment: { href: string };
  commits: { href: string };
  statuses: { href: string };
}

export interface GithubPullRequest {
  id: number;
  node_id: string;
  url: string;
  html_url: string;
  diff_url: string;
  patch_url: string;
  issue_url: string;
  number: number;
  state: 'open' | 'closed';
  locked: boolean;
  title: string;
  user: GithubUser;
  body: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  merge_commit_sha: string | null;
  assignee: GithubUser | null;
  assignees: GithubUser[];
  requested_reviewers: GithubUser[];
  requested_teams: GithubTeam[];
  labels: GithubLabel[];
  milestone: GithubMilestone | null;
  draft: boolean;
  commits_url: string;
  review_comments_url: string;
  review_comment_url: string;
  comments_url: string;
  statuses_url: string;
  head: GithubPullRequestRef;
  base: GithubPullRequestRef;
  _links: GithubPullRequestLinks;
  author_association: string;
  auto_merge: GithubAutoMerge | null;
  active_lock_reason: string | null;
  merged?: boolean;
  mergeable?: boolean | null;
  rebaseable?: boolean | null;
  mergeable_state?: string;
  merged_by?: GithubUser | null;
  comments?: number;
  review_comments?: number;
  maintainer_can_modify?: boolean;
  commits?: number;
  additions?: number;
  deletions?: number;
  changed_files?: number;
}
