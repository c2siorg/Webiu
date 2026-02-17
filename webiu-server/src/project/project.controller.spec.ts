import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController, IssuesController } from './project.controller';
import { ProjectService } from './project.service';

describe('ProjectController', () => {
    let controller: ProjectController;
    let projectService: ProjectService;

    const mockProjectService = {
        getAllProjects: jest.fn(),
        getIssuesAndPr: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ProjectController],
            providers: [
                { provide: ProjectService, useValue: mockProjectService },
            ],
        }).compile();

        controller = module.get<ProjectController>(ProjectController);
        projectService = module.get<ProjectService>(ProjectService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getAllProjects', () => {
        it('should return all projects from the service', async () => {
            const mockResult = {
                repositories: [
                    { name: 'repo1', pull_requests: 3 },
                    { name: 'repo2', pull_requests: 1 },
                ],
            };
            mockProjectService.getAllProjects.mockResolvedValue(mockResult);

            const result = await controller.getAllProjects();

            expect(result).toEqual(mockResult);
            expect(mockProjectService.getAllProjects).toHaveBeenCalledTimes(1);
        });
    });
});

describe('IssuesController', () => {
    let controller: IssuesController;

    const mockProjectService = {
        getAllProjects: jest.fn(),
        getIssuesAndPr: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [IssuesController],
            providers: [
                { provide: ProjectService, useValue: mockProjectService },
            ],
        }).compile();

        controller = module.get<IssuesController>(IssuesController);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getIssuesAndPr', () => {
        it('should return issues and PR counts', async () => {
            const mockResult = { issues: 5, pullRequests: 3 };
            mockProjectService.getIssuesAndPr.mockResolvedValue(mockResult);

            const result = await controller.getIssuesAndPr('c2siorg', 'repo1');

            expect(result).toEqual(mockResult);
            expect(mockProjectService.getIssuesAndPr).toHaveBeenCalledWith(
                'c2siorg',
                'repo1',
            );
        });
    });
});