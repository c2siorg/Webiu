export interface GithubTeam {
  id: number;
  node_id: string;
  url: string;
  html_url: string;
  name: string;
  slug: string;
  description: string | null;
  privacy: string;
  permission: string;
  members_url: string;
  repositories_url: string;
  parent: GithubTeam | null;
}

export interface GithubAutoMerge {
  enabled_by: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    type: string;
  };
  merge_method: 'merge' | 'squash' | 'rebase';
  commit_title: string;
  commit_message: string;
}
