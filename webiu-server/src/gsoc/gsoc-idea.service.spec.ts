import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GsocIdeaService } from './gsoc-idea.service';
import { GsocIdea } from '../database/entities/gsoc-idea.entity';
import { GsocProgram } from '../database/entities/gsoc-program.entity';
import { GsocMentor } from '../database/entities/gsoc-mentor.entity';
import { SystemSettingService } from '../system-setting/system-setting.service';
import { BadRequestException } from '@nestjs/common';
import { AuditLogService } from '../audit-log/audit-log.service';

describe('GsocIdeaService', () => {
  let service: GsocIdeaService;
  let ideaRepository: jest.Mocked<Repository<GsocIdea>>;
  let programRepository: jest.Mocked<Repository<GsocProgram>>;

  const mockIdeaRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockProgramRepository = {
    findOne: jest.fn(),
  };

  const mockMentorRepository = {
    find: jest.fn(),
  };

  const mockSystemSettingService = {
    getSettingNumber: jest.fn(),
  };

  const mockAuditLogService = {
    createLog: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GsocIdeaService,
        {
          provide: getRepositoryToken(GsocIdea),
          useValue: mockIdeaRepository,
        },
        {
          provide: getRepositoryToken(GsocProgram),
          useValue: mockProgramRepository,
        },
        {
          provide: getRepositoryToken(GsocMentor),
          useValue: mockMentorRepository,
        },
        {
          provide: SystemSettingService,
          useValue: mockSystemSettingService,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<GsocIdeaService>(GsocIdeaService);
    ideaRepository = module.get(getRepositoryToken(GsocIdea));
    programRepository = module.get(getRepositoryToken(GsocProgram));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw BadRequestException if program does not exist', async () => {
      programRepository.findOne.mockResolvedValueOnce(null);
      await expect(
        service.create({
          programId: 'invalid-id',
          projectNumber: 1,
          title: 'Idea Title',
          explanation: 'Desc',
          difficulty: 'Easy',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create an idea and save it', async () => {
      programRepository.findOne.mockResolvedValueOnce({ id: 'prog-id' } as any);
      ideaRepository.findOne.mockResolvedValueOnce(null); // No max display order
      ideaRepository.create.mockReturnValueOnce({ title: 'Idea Title' } as any);
      ideaRepository.save.mockResolvedValueOnce({
        id: 'idea-id',
        title: 'Idea Title',
      } as any);

      const result = await service.create({
        programId: 'prog-id',
        projectNumber: 1,
        title: 'Idea Title',
        explanation: 'Desc',
        difficulty: 'Easy',
      });
      expect(result.title).toBe('Idea Title');
      expect(ideaRepository.save).toHaveBeenCalled();
    });
  });
});
