import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GithubService } from './github.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GithubService', () => {
  let service: GithubService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'GITHUB_ACCESS_TOKEN') return 'test-token';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<GithubService>(GithubService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('org', () => {
    it('should return the organization name', () => {
      expect(service.org).toBe('c2siorg');
    });
  });

  describe('getOrgRepos', () => {
    it('should fetch organization repositories', async () => {
      const mockRepos = [
        { name: 'repo1', full_name: 'c2siorg/repo1' },
        { name: 'repo2', full_name: 'c2siorg/repo2' },
      ];
      mockedAxios.get.mockResolvedValue({ data: mockRepos });

      const result = await service.getOrgRepos();

      expect(result).toEqual(mockRepos);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.github.com/orgs/c2siorg/repos',
        { headers: { Authorization: 'token test-token' } },
      );
    });

    it('should propagate errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API error'));
      await expect(service.getOrgRepos()).rejects.toThrow('API error');
    });
  });

  describe('getRepoPulls', () => {
    it('should fetch pull requests for a repo', async () => {
      const mockPulls = [{ id: 1, title: 'PR 1' }];
      mockedAxios.get.mockResolvedValue({ data: mockPulls });

      const result = await service.getRepoPulls('repo1');

      expect(result).toEqual(mockPulls);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.github.com/repos/c2siorg/repo1/pulls',
        { headers: { Authorization: 'token test-token' } },
      );
    });
  });

  describe('getRepoIssues', () => {
    it('should fetch issues for a repo', async () => {
      const mockIssues = [{ id: 1, title: 'Issue 1' }];
      mockedAxios.get.mockResolvedValue({ data: mockIssues });

      const result = await service.getRepoIssues('c2siorg', 'repo1');

      expect(result).toEqual(mockIssues);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.github.com/repos/c2siorg/repo1/issues',
        { headers: { Authorization: 'token test-token' } },
      );
    });
  });

  describe('getRepoContributors', () => {
    it('should fetch contributors for a repo', async () => {
      const mockContributors = [
        { login: 'user1', contributions: 10, avatar_url: 'http://avatar1' },
      ];
      mockedAxios.get.mockResolvedValue({ data: mockContributors });

      const result = await service.getRepoContributors('c2siorg', 'repo1');

      expect(result).toEqual(mockContributors);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.github.com/repos/c2siorg/repo1/contributors',
        { headers: { Authorization: 'token test-token' } },
      );
    });

    it('should return null on error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API error'));

      const result = await service.getRepoContributors('c2siorg', 'repo1');

      expect(result).toBeNull();
    });
  });

  describe('searchUserIssues', () => {
    it('should search for user-created issues', async () => {
      const mockItems = [{ id: 1, title: 'Issue by user' }];
      mockedAxios.get.mockResolvedValue({ data: { items: mockItems } });

      const result = await service.searchUserIssues('testuser');

      expect(result).toEqual(mockItems);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.github.com/search/issues?q=author:testuser+org:c2siorg+type:issue',
        { headers: { Authorization: 'token test-token' } },
      );
    });

    it('should return empty array when items is undefined', async () => {
      mockedAxios.get.mockResolvedValue({ data: {} });

      const result = await service.searchUserIssues('testuser');

      expect(result).toEqual([]);
    });
  });

  describe('searchUserPullRequests', () => {
    it('should search for user-created pull requests', async () => {
      const mockItems = [{ id: 1, title: 'PR by user' }];
      mockedAxios.get.mockResolvedValue({ data: { items: mockItems } });

      const result = await service.searchUserPullRequests('testuser');

      expect(result).toEqual(mockItems);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.github.com/search/issues?q=author:testuser+org:c2siorg+type:pr',
        { headers: { Authorization: 'token test-token' } },
      );
    });
  });

  describe('getUserInfo', () => {
    it('should fetch user info with provided access token', async () => {
      const mockUser = { login: 'testuser', name: 'Test User' };
      mockedAxios.get.mockResolvedValue({ data: mockUser });

      const result = await service.getUserInfo('user-access-token');

      expect(result).toEqual(mockUser);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.github.com/user',
        { headers: { Authorization: 'Bearer user-access-token' } },
      );
    });
  });

  describe('exchangeGithubCode', () => {
    it('should exchange authorization code for access token', async () => {
      const mockTokenData = { access_token: 'gh-token', token_type: 'bearer' };
      mockedAxios.post.mockResolvedValue({ data: mockTokenData });

      const result = await service.exchangeGithubCode(
        'client-id',
        'client-secret',
        'auth-code',
        'http://redirect-uri',
      );

      expect(result).toEqual(mockTokenData);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://github.com/login/oauth/access_token',
        expect.any(String),
        { headers: { Accept: 'application/json' } },
      );
    });
  });
});