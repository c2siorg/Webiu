export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface AnalyzerInputRepository {
  owner: string;
  repo: string;
  fullName: string;
  url: string;
}

export interface AnalyzerMetrics {
  activityScore: number;
  complexityScore: number;
  learningDifficulty: DifficultyLevel;
}

export interface AnalyzerBreakdown {
  stars: number;
  forks: number;
  contributors: number;
  recentCommits30d: number;
  recentIssues30d: number;
  recentPrs30d: number;
  languages: string[];
  fileCount: number;
  dependencyFiles: string[];
}

export type AnalyzerStatus = 'success' | 'partial' | 'failed';

export interface AnalyzerReport {
  owner: string;
  repo: string;
  fullName: string;
  url: string;
  generatedAt: string;
  status: AnalyzerStatus;
  metrics: AnalyzerMetrics;
  breakdown: AnalyzerBreakdown;
  limitations: string[];
  errorMessage?: string;
}

export interface AnalyzerPersistedState {
  reports: AnalyzerReport[];
  syncHistory: AnalyzerSyncRun[];
  repoSyncCursor: Record<string, string>;
}

export interface AnalyzerSyncRun {
  id: string;
  startedAt: string;
  endedAt?: string;
  status: 'running' | 'completed' | 'partial' | 'failed';
  repositoriesTotal: number;
  repositoriesSucceeded: number;
  repositoriesFailed: number;
  rateLimitRemaining?: number;
  errors: Array<{ repository: string; message: string }>;
}
