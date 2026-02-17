import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GithubService } from './github.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GithubService', () => {
    let service: GithubService;

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
        it('should fetch all organization repositories across pages', async () => {
            mockedAxios.get
                .mockResolvedValueOnce({ data: Array(100).fill({ name: 'repo' }) })
                .mockResolvedValueOnce({ data: [{ name: 'repo101' }] });

            const result = await service.getOrgRepos();

            expect(result).toHaveLength(101);
            expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        });

        it('should stop when a page returns less than 100 items', async () => {
            mockedAxios.get.mockResolvedValueOnce({
                data: [{ name: 'repo1' }, { name: 'repo2' }],
            });

            const result = await service.getOrgRepos();

            expect(result).toHaveLength(2);
            expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        });

        it('should return empty array when no repos', async () => {
            mockedAxios.get.mockResolvedValueOnce({ data: [] });

            const result = await service.getOrgRepos();

            expect(result).toEqual([]);
        });

        it('should propagate errors', async () => {
            mockedAxios.get.mockRejectedValue(new Error('API error'));
            await expect(service.getOrgRepos()).rejects.toThrow('API error');
        });
    });

    describe('getRepoPulls', () => {
        it('should fetch pull requests for a repo with pagination', async () => {
            mockedAxios.get.mockResolvedValueOnce({
                data: [{ id: 1, title: 'PR 1' }],
            });

            const result = await service.getRepoPulls('repo1');

            expect(result).toEqual([{ id: 1, title: 'PR 1' }]);
            expect(mockedAxios.get).toHaveBeenCalledWith(
                expect.stringContaining('/repos/c2siorg/repo1/pulls'),
                expect.any(Object),
            );
        });
    });

    describe('getRepoIssues', () => {
        it('should fetch issues for a repo', async () => {
            mockedAxios.get.mockResolvedValueOnce({
                data: [{ id: 1, title: 'Issue 1' }],
            });

            const result = await service.getRepoIssues('c2siorg', 'repo1');

            expect(result).toEqual([{ id: 1, title: 'Issue 1' }]);
            expect(mockedAxios.get).toHaveBeenCalledWith(
                expect.stringContaining('/repos/c2siorg/repo1/issues'),
                expect.any(Object),
            );
        });
    });

    describe('getRepoContributors', () => {
        it('should fetch contributors for a repo', async () => {
            const mockContributors = [
                { login: 'user1', contributions: 10, avatar_url: 'http://avatar1' },
            ];
            mockedAxios.get.mockResolvedValueOnce({ data: mockContributors });

            const result = await service.getRepoContributors('c2siorg', 'repo1');

            expect(result).toEqual(mockContributors);
        });

        it('should return null on error', async () => {
            mockedAxios.get.mockRejectedValue(new Error('API error'));

            const result = await service.getRepoContributors('c2siorg', 'repo1');

            expect(result).toBeNull();
        });
    });

    describe('searchUserIssues', () => {
        it('should fetch all user issues across search pages', async () => {
            mockedAxios.get
                .mockResolvedValueOnce({ data: { items: Array(100).fill({ id: 1 }) } })
                .mockResolvedValueOnce({ data: { items: [{ id: 101 }] } });

            const result = await service.searchUserIssues('testuser');

            expect(result).toHaveLength(101);
            expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        });

        it('should return empty array when no results', async () => {
            mockedAxios.get.mockResolvedValueOnce({ data: { items: [] } });

            const result = await service.searchUserIssues('testuser');

            expect(result).toEqual([]);
        });

        it('should include correct query params', async () => {
            mockedAxios.get.mockResolvedValueOnce({ data: { items: [] } });

            await service.searchUserIssues('testuser');

            expect(mockedAxios.get).toHaveBeenCalledWith(
                expect.stringContaining('author:testuser+org:c2siorg+type:issue'),
                expect.any(Object),
            );
        });
    });

    describe('searchUserPullRequests', () => {
        it('should fetch all user PRs across search pages', async () => {
            mockedAxios.get.mockResolvedValueOnce({
                data: { items: [{ id: 1, title: 'PR by user' }] },
            });

            const result = await service.searchUserPullRequests('testuser');

            expect(result).toEqual([{ id: 1, title: 'PR by user' }]);
            expect(mockedAxios.get).toHaveBeenCalledWith(
                expect.stringContaining('author:testuser+org:c2siorg+type:pr'),
                expect.any(Object),
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