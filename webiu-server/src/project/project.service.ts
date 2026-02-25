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
      // Use GitHub's native pagination instead of fetching everything
      const repositories = await this.githubService.getOrgRepos(page, limit);

      // Fetch PR counts in batches to avoid overwhelming the API
      const BATCH_SIZE = 10;
      const repositoriesWithPRs = [];
      for (let i = 0; i < repositories.length; i += BATCH_SIZE) {
        const batch = repositories.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async (repo) => {
            try {
              const pulls = await this.githubService.getRepoPulls(repo.name);
              return { ...repo, pull_requests: pulls.length };
            } catch {
              return { ...repo, pull_requests: 0 };
            }
          }),
        );
        repositoriesWithPRs.push(...batchResults);
      }

      // Get the true total number of public repositories to pass to frontend pagination
      const orgInfo = await this.githubService.getPublicUserProfile(
        this.githubService.org,
      );
      const total = orgInfo.public_repos || 0;

      const result = {
        total,
        page,
        limit,
        repositories: repositoriesWithPRs,
      };

      this.cacheService.set(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      this.logger.error(
        'Error fetching repositories or pull requests:',
        error.response ? error.response.data : error.message,
      );
      throw new InternalServerErrorException('Internal server error');
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
      // Fetch everything in parallel
      const [project, activity, release, languages, _issues] =
        await Promise.all([
          this.githubService.getRepo(name),
          this.githubService.getCommitActivity(name),
          this.githubService.getLatestRelease(name),
          this.githubService.getRepoLanguages(name),
          this.githubService
            .getRepoIssues(this.githubService.org, name)
            .catch(() => []),
        ]);

      if (!project) {
        throw new NotFoundException(`Project ${name} not found`);
      }

      // Calculate Derived Badges
      const now = new Date().getTime();
      const createdAt = new Date(project.created_at).getTime();
      const pushedAt = new Date(project.pushed_at).getTime();

      // 1. Maturity Badge
      const ageInYears = (now - createdAt) / (365 * 24 * 3600 * 1000);
      const maturity =
        project.stargazers_count > 50 && ageInYears > 1
          ? 'Mature'
          : 'Incubating';

      // 2. Maintenance Badge
      const daysSincePush = (now - pushedAt) / (24 * 3600 * 1000);
      const maintenance = daysSincePush < 90 ? 'Active' : 'Stale';

      // 3. Complexity Badge
      const languageCount = Object.keys(languages || {}).length;
      const isPolyglot = languageCount > 3;

      // 4. Activity Level
      const last4Weeks =
        activity && Array.isArray(activity) ? activity.slice(-4) : [];
      const recentCommits = last4Weeks.reduce(
        (acc, week) => acc + (week.total || 0),
        0,
      );
      let activityLevel = 'Low';
      if (recentCommits > 10) activityLevel = 'High';
      else if (recentCommits > 0) activityLevel = 'Medium';

      // 5. Repository Health (Issues Ratio)
      const openIssues = project.open_issues_count || 0;
      // Note: GitHub API 'issues' endpoint returns only open by default,
      // but we use simplified logic here using repo object + fetched list if needed.
      // For a better "Health" ratio, we'd need total historical issues.
      // We'll use a descriptive vibe based on open issues relative to repo age.
      const issuesPerYear = openIssues / Math.max(ageInYears, 1);
      const healthStatus =
        issuesPerYear < 5
          ? 'Healthy'
          : issuesPerYear < 20
            ? 'Moderate'
            : 'Busy';

      // 6. Repository Size Vibe
      const sizeInMB = ((project.size as number) || 0) / 1024;
      const vibe = sizeInMB > 50 ? 'Monolith' : 'Lightweight';

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
                ? 'Actively maintained with recent pushes within the last 90 days.'
                : 'No recent pushes detected in the last 90 days.',
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
          vibe: vibe,
          release_recency: releaseRecency,
        },
      };

      this.cacheService.set(cacheKey, result, 3600); // 1 hour internal cache
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
}
