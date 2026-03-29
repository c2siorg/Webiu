import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig } from 'axios';
import { CacheService } from '../common/cache.service';
import { AnalyzerStoreService } from './analyzer.store.service';
import {
  AnalyzerBreakdown,
  AnalyzerInputRepository,
  AnalyzerMetrics,
  AnalyzerReport,
  AnalyzerSyncRun,
  DifficultyLevel,
} from './types';

const GITHUB_API_BASE = 'https://api.github.com';
const ANALYZER_CACHE_TTL_SECONDS = 600;
const DEFAULT_SYNC_INTERVAL_MINUTES = 60;
const MAX_REPOS_PER_REQUEST = 100;
const RECENT_WINDOW_DAYS = 30;

@Injectable()
export class AnalyzerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AnalyzerService.name);
  private readonly githubToken: string;
  private syncTimer?: NodeJS.Timeout;

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly storeService: AnalyzerStoreService,
  ) {
    this.githubToken = this.configService.get<string>('GITHUB_ACCESS_TOKEN');
  }

  onModuleInit(): void {
    const enabled =
      this.configService.get<string>('ANALYZER_SYNC_ENABLED', 'true') === 'true';
    if (!enabled) {
      return;
    }

    const rawInterval = this.configService.get<string>(
      'ANALYZER_SYNC_INTERVAL_MINUTES',
      String(DEFAULT_SYNC_INTERVAL_MINUTES),
    );
    const interval = Math.max(
      1,
      parseInt(rawInterval || String(DEFAULT_SYNC_INTERVAL_MINUTES), 10) ||
        DEFAULT_SYNC_INTERVAL_MINUTES,
    );

    this.syncTimer = setInterval(() => {
      this.syncStoredRepositories().catch((error) => {
        this.logger.warn(`Scheduled analyzer sync failed: ${error.message}`);
      });
    }, interval * 60_000);

    this.logger.log(`Analyzer scheduler started with ${interval} minute interval`);
  }

  onModuleDestroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
  }

  async analyzeRepositories(
    repositoryUrls: string[],
    options?: { forceRefresh?: boolean; persist?: boolean },
  ): Promise<{ reports: AnalyzerReport[]; syncRun?: AnalyzerSyncRun }> {
    if (!Array.isArray(repositoryUrls) || repositoryUrls.length === 0) {
      throw new BadRequestException('At least one repository URL is required');
    }
    if (repositoryUrls.length > MAX_REPOS_PER_REQUEST) {
      throw new BadRequestException(
        `Maximum ${MAX_REPOS_PER_REQUEST} repositories are allowed per request`,
      );
    }

    const repositories = repositoryUrls.map((url) => this.parseRepositoryUrl(url));
    const uniqueByFullName = new Map<string, AnalyzerInputRepository>();
    for (const repo of repositories) {
      uniqueByFullName.set(repo.fullName, repo);
    }

    const uniqueRepositories = [...uniqueByFullName.values()];
    const syncRun = this.storeService.createSyncRun(uniqueRepositories.length);
    const reports: AnalyzerReport[] = [];

    for (const repository of uniqueRepositories) {
      try {
        const report = await this.analyzeSingleRepository(repository, options);
        reports.push(report);
        syncRun.repositoriesSucceeded += 1;

        if (options?.persist !== false) {
          this.storeService.saveReport(report);
          this.storeService.setRepoCursor(repository.fullName, report.generatedAt);
        }
      } catch (error) {
        syncRun.repositoriesFailed += 1;
        const message = error?.message || 'Unknown error';
        syncRun.errors.push({ repository: repository.fullName, message });

        reports.push(this.createFailedReport(repository, message));
      }
    }

    syncRun.endedAt = new Date().toISOString();
    syncRun.status =
      syncRun.repositoriesFailed === 0
        ? 'completed'
        : syncRun.repositoriesSucceeded > 0
          ? 'partial'
          : 'failed';

    this.storeService.updateSyncRun(syncRun);

    return { reports, syncRun };
  }

  getStoredReports(page = 1, limit = 20): {
    total: number;
    page: number;
    limit: number;
    reports: AnalyzerReport[];
  } {
    const normalizedPage = Math.max(1, page || 1);
    const normalizedLimit = Math.min(100, Math.max(1, limit || 20));
    const allReports = this.storeService.getReports();

    const start = (normalizedPage - 1) * normalizedLimit;
    const reports = allReports.slice(start, start + normalizedLimit);

    return {
      total: allReports.length,
      page: normalizedPage,
      limit: normalizedLimit,
      reports,
    };
  }

  getStoredReport(owner: string, repo: string): AnalyzerReport | null {
    return this.storeService.getReport(owner, repo) || null;
  }

  getSyncHistory(limit = 20): AnalyzerSyncRun[] {
    return this.storeService.getSyncHistory(limit);
  }

  async syncStoredRepositories(): Promise<{ reports: AnalyzerReport[] }> {
    const stored = this.storeService.getReports();
    const urls = stored.map((report) => report.url);

    if (urls.length === 0) {
      return { reports: [] };
    }

    const { reports } = await this.analyzeRepositories(urls, {
      forceRefresh: true,
      persist: true,
    });
    return { reports };
  }

  private async analyzeSingleRepository(
    repository: AnalyzerInputRepository,
    options?: { forceRefresh?: boolean; persist?: boolean },
  ): Promise<AnalyzerReport> {
    const cacheKey = `analyzer_report_${repository.fullName}`;
    const canUseCache = !options?.forceRefresh;
    const cached = this.cacheService.get<AnalyzerReport>(cacheKey);

    if (canUseCache && cached) {
      return cached;
    }

    const repoDetails = await this.githubRequest<any>(
      `/repos/${repository.owner}/${repository.repo}`,
    );

    const sinceIso = this.getIncrementalSinceISO(repository.fullName);
    const sinceDate = sinceIso.slice(0, 10);
    const [contributors, languages, fileTree, recentCommits, recentIssues, recentPrs] =
      await Promise.all([
        this.getContributorCount(repository.owner, repository.repo),
        this.safe(() =>
          this.githubRequest<Record<string, number>>(
            `/repos/${repository.owner}/${repository.repo}/languages`,
          ),
        ).then((value) => value || {}),
        this.getRepositoryTree(
          repository.owner,
          repository.repo,
          repoDetails.default_branch,
        ),
        this.getRecentCommitCount(repository.owner, repository.repo, sinceIso),
        this.getRecentSearchCount(
          `repo:${repository.fullName} type:issue created:>=${sinceDate}`,
        ),
        this.getRecentSearchCount(
          `repo:${repository.fullName} type:pr created:>=${sinceDate}`,
        ),
      ]);

    const dependencyFiles = this.extractDependencyFiles(fileTree);

    const breakdown: AnalyzerBreakdown = {
      stars: repoDetails.stargazers_count || 0,
      forks: repoDetails.forks_count || 0,
      contributors,
      recentCommits30d: recentCommits,
      recentIssues30d: recentIssues,
      recentPrs30d: recentPrs,
      languages: Object.keys(languages || {}),
      fileCount: fileTree.length,
      dependencyFiles,
    };

    const metrics = this.computeMetrics(breakdown);

    const limitations: string[] = [];
    if (!this.githubToken) {
      limitations.push(
        'No GITHUB_ACCESS_TOKEN configured. Unauthenticated requests have lower rate limits.',
      );
    }
    if (breakdown.fileCount === 0) {
      limitations.push('Repository tree could not be resolved fully.');
    }
    if (breakdown.recentCommits30d === 0) {
      limitations.push('No commits detected in the recent analysis window.');
    }

    const report: AnalyzerReport = {
      owner: repository.owner,
      repo: repository.repo,
      fullName: repository.fullName,
      url: repository.url,
      generatedAt: new Date().toISOString(),
      status: limitations.length > 0 ? 'partial' : 'success',
      metrics,
      breakdown,
      limitations,
    };

    this.cacheService.set(cacheKey, report, ANALYZER_CACHE_TTL_SECONDS);
    return report;
  }

  private computeMetrics(breakdown: AnalyzerBreakdown): AnalyzerMetrics {
    const activityScore = this.computeActivityScore(breakdown);
    const complexityScore = this.computeComplexityScore(breakdown);
    const learningDifficulty = this.classifyDifficulty(
      activityScore,
      complexityScore,
    );

    return {
      activityScore,
      complexityScore,
      learningDifficulty,
    };
  }

  // Activity favors steady maintenance signals over absolute popularity.
  private computeActivityScore(breakdown: AnalyzerBreakdown): number {
    const commitsScore = Math.min(35, breakdown.recentCommits30d * 0.9);
    const contributorsScore = Math.min(20, breakdown.contributors * 2.2);
    const issuesScore = Math.min(20, breakdown.recentIssues30d * 1.2);
    const prsScore = Math.min(25, breakdown.recentPrs30d * 1.4);

    return Math.round(commitsScore + contributorsScore + issuesScore + prsScore);
  }

  // Complexity emphasizes breadth (files/languages/dependencies) over stars.
  private computeComplexityScore(breakdown: AnalyzerBreakdown): number {
    const fileCountScore = Math.min(40, Math.log10(breakdown.fileCount + 1) * 14);
    const languageDiversityScore = Math.min(25, breakdown.languages.length * 5);
    const dependencyScore = Math.min(25, breakdown.dependencyFiles.length * 6);
    const popularityBonus = Math.min(10, Math.log10(breakdown.stars + 1) * 4);

    return Math.round(
      fileCountScore +
        languageDiversityScore +
        dependencyScore +
        popularityBonus,
    );
  }

  private classifyDifficulty(
    activityScore: number,
    complexityScore: number,
  ): DifficultyLevel {
    const weighted = activityScore * 0.45 + complexityScore * 0.55;

    if (weighted < 35) {
      return 'Beginner';
    }
    if (weighted < 65) {
      return 'Intermediate';
    }
    return 'Advanced';
  }

  private createFailedReport(
    repository: AnalyzerInputRepository,
    errorMessage: string,
  ): AnalyzerReport {
    return {
      owner: repository.owner,
      repo: repository.repo,
      fullName: repository.fullName,
      url: repository.url,
      generatedAt: new Date().toISOString(),
      status: 'failed',
      metrics: {
        activityScore: 0,
        complexityScore: 0,
        learningDifficulty: 'Beginner',
      },
      breakdown: {
        stars: 0,
        forks: 0,
        contributors: 0,
        recentCommits30d: 0,
        recentIssues30d: 0,
        recentPrs30d: 0,
        languages: [],
        fileCount: 0,
        dependencyFiles: [],
      },
      limitations: ['Repository data could not be retrieved.'],
      errorMessage,
    };
  }

  private parseRepositoryUrl(url: string): AnalyzerInputRepository {
    const raw = (url || '').trim();

    const ghRegex = /^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)\/?/i;
    const match = raw.match(ghRegex);
    if (!match) {
      throw new BadRequestException(`Invalid GitHub repository URL: ${url}`);
    }

    const owner = match[1];
    const repo = match[2].replace(/\.git$/i, '');

    return {
      owner,
      repo,
      fullName: `${owner}/${repo}`,
      url: `https://github.com/${owner}/${repo}`,
    };
  }

  private async githubRequest<T>(
    path: string,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const headers = {
      ...(config?.headers || {}),
      ...(this.githubToken
        ? { Authorization: `token ${this.githubToken}` }
        : undefined),
      Accept: 'application/vnd.github+json',
    } as Record<string, string>;

    try {
      const response = await axios.get<T>(`${GITHUB_API_BASE}${path}`, {
        ...config,
        headers,
      });
      return response.data;
    } catch (error) {
      const status = error?.response?.status;
      const remaining = error?.response?.headers?.['x-ratelimit-remaining'];
      const reset = error?.response?.headers?.['x-ratelimit-reset'];

      if (status === 403 && remaining === '0') {
        const resetAt = reset
          ? new Date(parseInt(reset, 10) * 1000).toISOString()
          : 'unknown';
        throw new Error(`GitHub rate limit exhausted. Reset at ${resetAt}`);
      }

      const message =
        error?.response?.data?.message || error?.message || 'GitHub request failed';
      throw new Error(message);
    }
  }

  private async getRecentCommitCount(
    owner: string,
    repo: string,
    sinceIso: string,
  ): Promise<number> {
    let page = 1;
    let total = 0;
    const since = sinceIso;
    const maxPages = this.githubToken ? 10 : 1;

    while (true) {
      const commits = await this.githubRequest<any[]>(
        `/repos/${owner}/${repo}/commits?since=${since}&per_page=100&page=${page}`,
      );

      total += commits.length;
      if (commits.length < 100) break;
      if (page >= maxPages) break;
      page += 1;
    }

    return total;
  }

  private async getRecentSearchCount(query: string): Promise<number> {
    try {
      const response = await this.githubRequest<{ total_count: number }>(
        `/search/issues?q=${encodeURIComponent(query)}&per_page=1`,
      );
      return response.total_count || 0;
    } catch {
      return 0;
    }
  }

  private async getContributorCount(owner: string, repo: string): Promise<number> {
    try {
      const headers: Record<string, string> = {
        ...(this.githubToken
          ? { Authorization: `token ${this.githubToken}` }
          : undefined),
        Accept: 'application/vnd.github+json',
      };
      const response = await axios.get(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/contributors?anon=true&per_page=1`,
        { headers },
      );

      const linkHeader = response.headers?.link;
      if (!linkHeader) {
        return Array.isArray(response.data) ? response.data.length : 0;
      }

      const lastMatch = /[?&]page=(\d+)>; rel="last"/.exec(linkHeader);
      if (!lastMatch) {
        return Array.isArray(response.data) ? response.data.length : 0;
      }

      return parseInt(lastMatch[1], 10) || 0;
    } catch (error) {
      this.logger.warn(
        `Failed to fetch contributors count for ${owner}/${repo}: ${error.message}`,
      );
      return 0;
    }
  }

  private async getRepositoryTree(
    owner: string,
    repo: string,
    branch?: string,
  ): Promise<string[]> {
    try {
      const targetBranch = branch || 'main';
      const treeResponse = await this.githubRequest<{ tree: Array<{ path: string; type: string }> }>(
        `/repos/${owner}/${repo}/git/trees/${targetBranch}?recursive=1`,
      );

      return (treeResponse.tree || [])
        .filter((entry) => entry.type === 'blob')
        .map((entry) => entry.path);
    } catch (error) {
      this.logger.warn(
        `Failed to fetch tree for ${owner}/${repo}: ${error.message}`,
      );
      return [];
    }
  }

  private extractDependencyFiles(paths: string[]): string[] {
    const known = [
      'package.json',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      'requirements.txt',
      'pyproject.toml',
      'Pipfile',
      'poetry.lock',
      'pom.xml',
      'build.gradle',
      'build.gradle.kts',
      'go.mod',
      'Cargo.toml',
      'Gemfile',
      'composer.json',
    ];

    return known.filter((file) => paths.some((path) => path.endsWith(file)));
  }

  private getSinceDateISO(): string {
    const now = new Date();
    now.setUTCDate(now.getUTCDate() - RECENT_WINDOW_DAYS);
    return now.toISOString();
  }

  private getIncrementalSinceISO(fullName: string): string {
    const baseline = this.getSinceDateISO();
    const cursor = this.storeService.getRepoCursor(fullName);
    if (!cursor) {
      return baseline;
    }

    const cursorDate = new Date(cursor);
    const baselineDate = new Date(baseline);
    if (isNaN(cursorDate.getTime())) {
      return baseline;
    }

    return cursorDate > baselineDate ? cursorDate.toISOString() : baseline;
  }

  private async safe<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch {
      return null;
    }
  }
}
