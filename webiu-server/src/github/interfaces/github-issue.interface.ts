import { GithubUser } from './github-user.interface';
import { GithubRepository } from './github-repository.interface';

export interface GithubLabel {
  id: number;
  node_id: string;
  url: string;
  name: string;
  color: string;
  default: boolean;
  description: string | null;
}

export interface GithubMilestone {
  url: string;
  html_url: string;
  labels_url: string;
  id: number;
  node_id: string;
  number: number;
  title: string;
  description: string | null;
  creator: GithubUser;
  open_issues: number;
  closed_issues: number;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  due_on: string | null;
  closed_at: string | null;
}

export interface GithubIssue {
  id: number;
  node_id: string;
  url: string;
  repository_url: string;
  labels_url: string;
  comments_url: string;
  events_url: string;
  html_url: string;
  number: number;
  state: 'open' | 'closed';
  state_reason?: string | null;
  title: string;
  body: string | null;
  user: GithubUser;
  labels: GithubLabel[];
  assignee: GithubUser | null;
  assignees: GithubUser[];
  milestone: GithubMilestone | null;
  locked: boolean;
  active_lock_reason: string | null;
  comments: number;
  pull_request?: {
    url: string;
    html_url: string;
    diff_url: string;
    patch_url: string;
    merged_at?: string | null;
  };
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  closed_by?: GithubUser | null;
  author_association: string;
  repository?: GithubRepository;
  /** Set by GithubService enrichment for closed PRs returned via Search API */
  merged_at?: string | null;
}
