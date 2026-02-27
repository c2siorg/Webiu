import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { GithubService } from '../github/github.service';
import { CacheService } from '../common/cache.service';
import { AxiosError } from 'axios';

const CACHE_TTL = 300; // 5 minutes
const INSIGHTS_CACHE_TTL = 3600; // 1 hour

// Badge thresholds for project insights
const MATURITY_MIN_STARS = 50;
const MATURITY_MIN_AGE_YEARS = 1;
const MAINTENANCE_STALE_DAYS = 90;
const POLYGLOT_MIN_LANGUAGES = 3;
const ACTIVITY_HIGH_COMMITS = 10;
const HEALTH_HEALTHY_ISSUES_PER_YEAR = 5;
const HEALTH_MODERATE_ISSUES_PER_YEAR = 20;
const SIZE_LARGE_THRESHOLD_MB = 50;

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    private githubService: GithubService,
    private cacheService: CacheService,
  ) {}

  async getAllProjects(page = 1, limit = 10) {
    const cacheKey = `projects_p${page}_pp${limit}`;
    const cached = this.cacheService.get<{
      total: number;
      page: number;
      limit: number;
      repositories: any[];
    }>(cacheKey);
    if (cached) return cached;

    try {
      const allRepos = await this.githubService.getAllOrgReposSorted();
      const total = allRepos.length;

      const startIndex = (page - 1) * limit;
      const pageRepos = allRepos.slice(startIndex, startIndex + limit);

      const enriched = await this.enrichWithPullCounts(pageRepos);

      const result = { total, page, limit, repositories: enriched };
      this.cacheService.set(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      this.logger.error(
        'Error fetching repositories:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async getRepoTechStack(repoName: string) {
    if (!repoName) {
      throw new BadRequestException('Repository name is required');
    }

    const cacheKey = `tech_stack_${repoName}`;
    const cached = this.cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const langMap = await this.githubService.getRepoLanguages(repoName);
      const result = { languages: Object.keys(langMap) };
      this.cacheService.set(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      console.error(
        'Error fetching tech stack:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException('Failed to fetch tech stack');
    }
  }

  async getIssuesAndPr(org: string, repo: string) {
    if (!org || !repo) {
      throw new BadRequestException('Organization and repository are required');
    }

    const cacheKey = `issues_pr_count_${org}_${repo}`;
    const cached = this.cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.githubService.getRepoIssues(org, repo);

      const issues = data.filter((item) => !item.pull_request).length;
      const pullRequests = data.filter((item) => item.pull_request).length;

      const result = { issues, pullRequests };
      this.cacheService.set(cacheKey, result);
      return result;
    } catch (error) {
      this.logger.error(
        'Error fetching issues and PRs:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException('Failed to fetch issues and PRs');
    }
  }

  /**
   * Retrieves enriched metadata for a single project by name.
   * Directly fetches the individual repository to optimize performance.
   */
  async getProjectByName(name: string) {
    // Validate repository name format (alphanumeric, hyphens, underscores)
    if (!name || !/^[a-zA-Z0-9-_\.]+$/.test(name)) {
      throw new BadRequestException('Invalid project name provided');
    }

    const cacheKey = `project_details_${name}`;
    const cached = this.cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      // Direct fetch of a single repo as requested by maintainers
      const project = await this.githubService.getRepo(name);

      if (!project) {
        throw new NotFoundException(`Project ${name} not found`);
      }

      // Fetch languages and PR counts
      const [languages, pulls] = await Promise.all([
        this.githubService.getRepoLanguages(name),
        this.githubService.getRepoPulls(name).catch(() => []),
      ]);

      const result = {
        ...project,
        languages,
        pull_requests: pulls.length,
      };

      this.cacheService.set(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;

      if (error instanceof AxiosError && error.response?.status === 404) {
        throw new NotFoundException(`Project ${name} not found on GitHub`);
      }

      this.logger.error(
        `Error fetching project details for ${name}:`,
        (error as Error).message,
      );
      throw new InternalServerErrorException('Failed to fetch project details');
    }
  }

  /**
   * Generates analytical insights and metadata for a repository.
   * Includes commit activity, release info, and derived badges.
   */
  async getProjectInsights(name: string) {
    // Validate repository name format (alphanumeric, hyphens, underscores)
    if (!name || !/^[a-zA-Z0-9-_\.]+$/.test(name)) {
      throw new BadRequestException('Invalid project name provided');
    }

    const cacheKey = `project_insights_v2_${name}`;
    const cached = this.cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const [project, activity, release, languages] = await Promise.all([
        this.githubService.getRepo(name),
        this.githubService.getCommitActivity(name),
        this.githubService.getLatestRelease(name),
        this.githubService.getRepoLanguages(name),
      ]);

      if (!project) {
        throw new NotFoundException(`Project ${name} not found`);
      }

      // Calculate Derived Badges
      const now = new Date().getTime();
      const createdAt = new Date(project.created_at).getTime();
      const pushedAt = new Date(project.pushed_at).getTime();

      const ageInYears = (now - createdAt) / (365 * 24 * 3600 * 1000);
      const maturity =
        project.stargazers_count > MATURITY_MIN_STARS &&
        ageInYears > MATURITY_MIN_AGE_YEARS
          ? 'Mature'
          : 'Incubating';

      const daysSincePush = (now - pushedAt) / (24 * 3600 * 1000);
      const maintenance =
        daysSincePush < MAINTENANCE_STALE_DAYS ? 'Active' : 'Stale';

      const languageCount = Object.keys(languages || {}).length;
      const isPolyglot = languageCount > POLYGLOT_MIN_LANGUAGES;

      const last4Weeks =
        activity && Array.isArray(activity) ? activity.slice(-4) : [];
      const recentCommits = last4Weeks.reduce(
        (acc, week) => acc + (week.total || 0),
        0,
      );
      let activityLevel = 'Low';
      if (recentCommits > ACTIVITY_HIGH_COMMITS) activityLevel = 'High';
      else if (recentCommits > 0) activityLevel = 'Medium';

      const openIssues = project.open_issues_count || 0;
      const issuesPerYear = openIssues / Math.max(ageInYears, 1);
      const healthStatus =
        issuesPerYear < HEALTH_HEALTHY_ISSUES_PER_YEAR
          ? 'Healthy'
          : issuesPerYear < HEALTH_MODERATE_ISSUES_PER_YEAR
            ? 'Moderate'
            : 'Busy';

      const sizeInMB = ((project.size as number) || 0) / 1024;
      const sizeLabel =
        sizeInMB > SIZE_LARGE_THRESHOLD_MB ? 'Large' : 'Compact';

      // 7. Latest Release Formatting
      let releaseRecency = 'Rolling';
      if (release && release.published_at) {
        const publishedDate = new Date(release.published_at).getTime();
        const diffDays = Math.floor((now - publishedDate) / (24 * 3600 * 1000));
        releaseRecency = diffDays === 0 ? 'Today' : `${diffDays} days ago`;
      }

      const result = {
        commit_activity: activity || [],
        latest_release: release,
        badges: {
          maturity: {
            label: maturity,
            description:
              maturity === 'Mature'
                ? 'Project is over 1 year old and has significant community interest (> 50 stars).'
                : 'Project is in early stages of development and growth.',
          },
          maintenance: {
            label: maintenance,
            description:
              maintenance === 'Active'
                ? `Actively maintained with recent pushes within the last ${MAINTENANCE_STALE_DAYS} days.`
                : `No recent pushes detected in the last ${MAINTENANCE_STALE_DAYS} days.`,
          },
          complexity: {
            label: isPolyglot ? 'Polyglot' : 'Focused',
            description: isPolyglot
              ? 'Multi-language project showing high technical diversity.'
              : 'Specialized project focused on a small set of core languages.',
          },
          activity_level: {
            label: activityLevel,
            description: `Activity based on commit frequency: ${recentCommits} commits in the last 4 weeks.`,
          },
        },
        stats: {
          age_years: parseFloat(ageInYears.toFixed(1)),
          recent_commits: recentCommits,
          total_languages: languageCount,
          open_issues: openIssues,
          health: healthStatus,
          size_mb: parseFloat(sizeInMB.toFixed(1)),
          size_label: sizeLabel,
          release_recency: releaseRecency,
        },
      };

      this.cacheService.set(cacheKey, result, INSIGHTS_CACHE_TTL);
      return result;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `Error generating insights for ${name}:`,
        (error as Error).message,
      );
      throw new InternalServerErrorException('Failed to generate insights');
    }
  }

  /**
   * Fetches the list of contributors for a specific repository.
   * Results are cached to optimize performance.
   */
  async getProjectContributors(name: string) {
    if (!name || !/^[a-zA-Z0-9-_\.]+$/.test(name)) {
      throw new BadRequestException('Invalid project name provided');
    }

    const cacheKey = `project_contributors_${name}`;
    const cached = this.cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const contributors = await this.githubService.getRepoContributors(
        this.githubService.org,
        name,
      );

      if (!contributors) {
        return [];
      }

      this.cacheService.set(cacheKey, contributors, CACHE_TTL);
      return contributors;
    } catch (error) {
      this.logger.error(
        `Error fetching contributors for ${name}:`,
        (error as Error).message,
      );
      throw new InternalServerErrorException('Failed to fetch contributors');
    }
  }

  /**
   * Searches repositories from the cached full list using in-memory filtering.
   * Matches against name and description, avoiding extra GitHub Search API calls.
   */
  async searchProjects(query: string, page = 1, limit = 10) {
    if (!query) {
      throw new BadRequestException('Search query is required');
    }

    const normalizedQuery = query.toLowerCase();
    const cacheKey = `projects_search_${normalizedQuery}_p${page}_pp${limit}`;
    const cached = this.cacheService.get<{
      total: number;
      page: number;
      limit: number;
      repositories: any[];
    }>(cacheKey);
    if (cached) return cached;

    try {
      const allRepos = await this.githubService.getAllOrgReposSorted();

      const filtered = allRepos.filter((repo) => {
        const name = repo.name.toLowerCase();
        const desc = (repo.description || '').toLowerCase();
        return name.includes(normalizedQuery) || desc.includes(normalizedQuery);
      });

      const total = filtered.length;
      const startIndex = (page - 1) * limit;
      const pageRepos = filtered.slice(startIndex, startIndex + limit);

      const enriched = await this.enrichWithPullCounts(pageRepos);

      const result = { total, page, limit, repositories: enriched };
      this.cacheService.set(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      this.logger.error(
        'Error searching repositories:',
        (error as Error).message,
      );
      throw new InternalServerErrorException('Failed to search projects');
    }
  }

  private async enrichWithPullCounts(repos: any[]): Promise<any[]> {
    const BATCH_SIZE = 10;
    const enriched: any[] = [];
    for (let i = 0; i < repos.length; i += BATCH_SIZE) {
      const batch = repos.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (repo) => {
          try {
            const count = await this.githubService.getRepoPullCount(repo.name);
            return { ...repo, pull_requests: count };
          } catch {
            return { ...repo, pull_requests: 0 };
          }
        }),
      );
      enriched.push(...batchResults);
    }
    return enriched;
  }
}
