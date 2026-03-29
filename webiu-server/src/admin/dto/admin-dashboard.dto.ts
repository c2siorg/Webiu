export interface AdminStatCard {
  label: string;
  value: number;
}

export interface AdminActivityItem {
  type: 'issue' | 'pull-request';
  title: string;
  author: string;
  url: string;
  createdAt: string;
  state: string;
}

export interface AdminDashboardResponse {
  generatedAt: string;
  stats: AdminStatCard[];
  recentActivity: AdminActivityItem[];
}
