import { BadRequestException } from '@nestjs/common';
import { AnalyzerService } from './analyzer.service';
import { AnalyzerBreakdown } from './types';

describe('AnalyzerService', () => {
  let service: AnalyzerService;

  const mockConfigService = {
    get: jest.fn((key: string, fallback?: string) => {
      if (key === 'ANALYZER_SYNC_ENABLED') return 'false';
      if (key === 'GITHUB_ACCESS_TOKEN') return undefined;
      return fallback;
    }),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockStoreService = {
    createSyncRun: jest.fn(),
    updateSyncRun: jest.fn(),
    saveReport: jest.fn(),
    setRepoCursor: jest.fn(),
    getReports: jest.fn().mockReturnValue([]),
    getReport: jest.fn(),
    getSyncHistory: jest.fn().mockReturnValue([]),
    getRepoCursor: jest.fn(),
  };

  beforeEach(() => {
    service = new AnalyzerService(
      mockConfigService as any,
      mockCacheService as any,
      mockStoreService as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should classify low weighted score as Beginner', () => {
    const level = (service as any).classifyDifficulty(10, 20);
    expect(level).toBe('Beginner');
  });

  it('should classify medium weighted score as Intermediate', () => {
    const level = (service as any).classifyDifficulty(60, 50);
    expect(level).toBe('Intermediate');
  });

  it('should classify high weighted score as Advanced', () => {
    const level = (service as any).classifyDifficulty(90, 90);
    expect(level).toBe('Advanced');
  });

  it('should compute activity score within expected range', () => {
    const breakdown: AnalyzerBreakdown = {
      stars: 1000,
      forks: 100,
      contributors: 9,
      recentCommits30d: 30,
      recentIssues30d: 8,
      recentPrs30d: 9,
      languages: ['TypeScript', 'JavaScript'],
      fileCount: 200,
      dependencyFiles: ['package.json'],
    };

    const score = (service as any).computeActivityScore(breakdown);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should compute complexity score within expected range', () => {
    const breakdown: AnalyzerBreakdown = {
      stars: 15000,
      forks: 2000,
      contributors: 100,
      recentCommits30d: 100,
      recentIssues30d: 20,
      recentPrs30d: 40,
      languages: ['TypeScript', 'JavaScript', 'Shell', 'Python'],
      fileCount: 5000,
      dependencyFiles: ['package.json', 'package-lock.json', 'Dockerfile'],
    };

    const score = (service as any).computeComplexityScore(breakdown);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should parse valid GitHub repository URL', () => {
    const parsed = (service as any).parseRepositoryUrl(
      'https://github.com/nestjs/nest',
    );
    expect(parsed.fullName).toBe('nestjs/nest');
    expect(parsed.url).toBe('https://github.com/nestjs/nest');
  });

  it('should reject invalid repository URL', () => {
    expect(() =>
      (service as any).parseRepositoryUrl('https://example.com/not-github'),
    ).toThrow(BadRequestException);
  });
});
