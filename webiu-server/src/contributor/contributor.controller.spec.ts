import { Test, TestingModule } from '@nestjs/testing';
import { ContributorController } from './contributor.controller';
import { ContributorService } from './contributor.service';

describe('ContributorController', () => {
    let controller: ContributorController;

    const mockContributorService = {
        getAllContributors: jest.fn(),
        getUserCreatedIssues: jest.fn(),
        getUserCreatedPullRequests: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ContributorController],
            providers: [
                { provide: ContributorService, useValue: mockContributorService },
            ],
        }).compile();

        controller = module.get<ContributorController>(ContributorController);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getAllContributors', () => {
        it('should return all contributors', async () => {
            const mockResult = [
                { login: 'user1', contributions: 10, repos: ['repo1'], avatar_url: 'http://avatar1' },
                { login: 'user2', contributions: 5, repos: ['repo2'], avatar_url: 'http://avatar2' },
            ];
            mockContributorService.getAllContributors.mockResolvedValue(mockResult);

            const result = await controller.getAllContributors();

            expect(result).toEqual(mockResult);
            expect(mockContributorService.getAllContributors).toHaveBeenCalledTimes(1);
        });
    });

    describe('userCreatedIssues', () => {
        it('should return issues for a given username', async () => {
            const mockResult = { issues: [{ id: 1, title: 'Issue 1' }] };
            mockContributorService.getUserCreatedIssues.mockResolvedValue(mockResult);

            const result = await controller.userCreatedIssues('testuser');

            expect(result).toEqual(mockResult);
            expect(mockContributorService.getUserCreatedIssues).toHaveBeenCalledWith(
                'testuser',
            );
        });
    });

    describe('userCreatedPullRequests', () => {
        it('should return pull requests for a given username', async () => {
            const mockResult = { pullRequests: [{ id: 1, title: 'PR 1' }] };
            mockContributorService.getUserCreatedPullRequests.mockResolvedValue(
                mockResult,
            );

            const result = await controller.userCreatedPullRequests('testuser');

            expect(result).toEqual(mockResult);
            expect(
                mockContributorService.getUserCreatedPullRequests,
            ).toHaveBeenCalledWith('testuser');
        });
    });
});