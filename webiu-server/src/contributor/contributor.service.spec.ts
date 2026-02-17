import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ContributorService } from './contributor.service';
import { GithubService } from '../github/github.service';

describe('ContributorService', () => {
    let service: ContributorService;

    const mockGithubService = {
        org: 'c2siorg',
        getOrgRepos: jest.fn(),
        getRepoContributors: jest.fn(),
        searchUserIssues: jest.fn(),
        searchUserPullRequests: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ContributorService,
                { provide: GithubService, useValue: mockGithubService },
            ],
        }).compile();

        service = module.get<ContributorService>(ContributorService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getAllContributors', () => {
        it('should return empty array when no repositories exist', async () => {
            mockGithubService.getOrgRepos.mockResolvedValue([]);

            const result = await service.getAllContributors();

            expect(result).toEqual([]);
        });

        it('should aggregate contributors across repositories', async () => {
            mockGithubService.getOrgRepos.mockResolvedValue([
                { name: 'repo1' },
                { name: 'repo2' },
            ]);
            mockGithubService.getRepoContributors
                .mockResolvedValueOnce([
                    { login: 'user1', contributions: 10, avatar_url: 'http://avatar1' },
                    { login: 'user2', contributions: 5, avatar_url: 'http://avatar2' },
                ])
                .mockResolvedValueOnce([
                    { login: 'user1', contributions: 3, avatar_url: 'http://avatar1' },
                    { login: 'user3', contributions: 7, avatar_url: 'http://avatar3' },
                ]);

            const result = await service.getAllContributors();

            expect(result).toHaveLength(3);

            const user1 = result.find((c) => c.login === 'user1');
            expect(user1).toBeDefined();
            expect(user1.contributions).toBe(13);
            expect(user1.repos).toEqual(expect.arrayContaining(['repo1', 'repo2']));

            const user2 = result.find((c) => c.login === 'user2');
            expect(user2).toBeDefined();
            expect(user2.contributions).toBe(5);
            expect(user2.repos).toEqual(['repo1']);

            const user3 = result.find((c) => c.login === 'user3');
            expect(user3).toBeDefined();
            expect(user3.contributions).toBe(7);
            expect(user3.repos).toEqual(['repo2']);
        });

        it('should handle repos with no contributors', async () => {
            mockGithubService.getOrgRepos.mockResolvedValue([{ name: 'repo1' }]);
            mockGithubService.getRepoContributors.mockResolvedValue(null);

            const result = await service.getAllContributors();

            expect(result).toEqual([]);
        });

        it('should handle individual repo errors gracefully', async () => {
            mockGithubService.getOrgRepos.mockResolvedValue([
                { name: 'repo1' },
                { name: 'repo2' },
            ]);
            mockGithubService.getRepoContributors
                .mockRejectedValueOnce(new Error('API error'))
                .mockResolvedValueOnce([
                    { login: 'user1', contributions: 5, avatar_url: 'http://avatar1' },
                ]);

            const result = await service.getAllContributors();

            expect(result).toHaveLength(1);
            expect(result[0].login).toBe('user1');
        });

        it('should throw InternalServerErrorException when getOrgRepos fails', async () => {
            mockGithubService.getOrgRepos.mockRejectedValue(
                new Error('Network error'),
            );

            await expect(service.getAllContributors()).rejects.toThrow(
                InternalServerErrorException,
            );
        });

        it('should process repos in batches of 5', async () => {
            const repos = Array.from({ length: 7 }, (_, i) => ({
                name: `repo${i}`,
            }));
            mockGithubService.getOrgRepos.mockResolvedValue(repos);
            mockGithubService.getRepoContributors.mockResolvedValue([]);

            await service.getAllContributors();

            expect(mockGithubService.getRepoContributors).toHaveBeenCalledTimes(7);
        });
    });

    describe('getUserCreatedIssues', () => {
        it('should return issues for a username', async () => {
            const mockIssues = [
                { id: 1, title: 'Issue 1' },
                { id: 2, title: 'Issue 2' },
            ];
            mockGithubService.searchUserIssues.mockResolvedValue(mockIssues);

            const result = await service.getUserCreatedIssues('testuser');

            expect(result).toEqual({ issues: mockIssues });
            expect(mockGithubService.searchUserIssues).toHaveBeenCalledWith(
                'testuser',
            );
        });

        it('should throw InternalServerErrorException on error', async () => {
            mockGithubService.searchUserIssues.mockRejectedValue(
                new Error('API error'),
            );

            await expect(service.getUserCreatedIssues('testuser')).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('getUserCreatedPullRequests', () => {
        it('should return pull requests for a username', async () => {
            const mockPRs = [
                { id: 1, title: 'PR 1' },
                { id: 2, title: 'PR 2' },
            ];
            mockGithubService.searchUserPullRequests.mockResolvedValue(mockPRs);

            const result = await service.getUserCreatedPullRequests('testuser');

            expect(result).toEqual({ pullRequests: mockPRs });
            expect(mockGithubService.searchUserPullRequests).toHaveBeenCalledWith(
                'testuser',
            );
        });

        it('should throw InternalServerErrorException on error', async () => {
            mockGithubService.searchUserPullRequests.mockRejectedValue(
                new Error('API error'),
            );

            await expect(
                service.getUserCreatedPullRequests('testuser'),
            ).rejects.toThrow(InternalServerErrorException);
        });
    });
});