import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  TechStackDetectorService,
  TechStackResult,
} from './tech-stack-detector.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockConfigService = {
  get: jest.fn().mockReturnValue('mock-token'),
};

describe('TechStackDetectorService', () => {
  let service: TechStackDetectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechStackDetectorService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TechStackDetectorService>(TechStackDetectorService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should detect Node.js and React from package.json', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/contents')) {
        return Promise.resolve({
          data: [
            {
              type: 'file',
              name: 'package.json',
              download_url: 'http://mock/package.json',
            },
          ],
        });
      }
      if (url.includes('package.json')) {
        return Promise.resolve({
          data: {
            dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' },
            devDependencies: { typescript: '^5.0.0' },
          },
        });
      }
      return Promise.resolve({ data: [] });
    });

    const result: TechStackResult = await service.detectTechStack(
      'org',
      'repo',
      '2026-01-01T00:00:00Z',
    );

    const names = result.technologies.map((t) => t.name);
    expect(names).toContain('React');
    expect(names).toContain('Node.js');
    expect(names).toContain('TypeScript');
  });

  it('should detect Python and Flask from requirements.txt', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/contents')) {
        return Promise.resolve({
          data: [
            {
              type: 'file',
              name: 'requirements.txt',
              download_url: 'http://mock/requirements.txt',
            },
          ],
        });
      }
      if (url.includes('requirements.txt')) {
        return Promise.resolve({ data: 'flask==2.0.0\nrequests==2.28.0\n' });
      }
      return Promise.resolve({ data: [] });
    });

    const result = await service.detectTechStack(
      'org',
      'repo',
      '2026-01-01T00:00:00Z',
    );
    const names = result.technologies.map((t) => t.name);
    expect(names).toContain('Flask');
    expect(names).toContain('Python');
  });

  it('should detect Django from requirements.txt', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/contents')) {
        return Promise.resolve({
          data: [
            {
              type: 'file',
              name: 'requirements.txt',
              download_url: 'http://mock/requirements.txt',
            },
          ],
        });
      }
      if (url.includes('requirements.txt')) {
        return Promise.resolve({ data: 'django==4.2.0\npsycopg2==2.9.0\n' });
      }
      return Promise.resolve({ data: [] });
    });

    const result = await service.detectTechStack(
      'org',
      'repo',
      '2026-01-01T00:00:00Z',
    );
    const names = result.technologies.map((t) => t.name);
    expect(names).toContain('Django');
    expect(names).toContain('Python');
  });

  it('should detect Go from go.mod', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/contents')) {
        return Promise.resolve({
          data: [{ type: 'file', name: 'go.mod' }],
        });
      }
      return Promise.resolve({ data: [] });
    });

    const result = await service.detectTechStack(
      'org',
      'repo',
      '2026-01-01T00:00:00Z',
    );
    const names = result.technologies.map((t) => t.name);
    expect(names).toContain('Go');
  });

  it('should detect Docker from Dockerfile', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/contents')) {
        return Promise.resolve({
          data: [{ type: 'file', name: 'Dockerfile' }],
        });
      }
      return Promise.resolve({ data: [] });
    });

    const result = await service.detectTechStack(
      'org',
      'repo',
      '2026-01-01T00:00:00Z',
    );
    const names = result.technologies.map((t) => t.name);
    expect(names).toContain('Docker');
  });

  it('should detect NestJS from package.json', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/contents')) {
        return Promise.resolve({
          data: [
            {
              type: 'file',
              name: 'package.json',
              download_url: 'http://mock/package.json',
            },
          ],
        });
      }
      if (url.includes('package.json')) {
        return Promise.resolve({
          data: {
            dependencies: { '@nestjs/core': '^10.0.0' },
            devDependencies: {},
          },
        });
      }
      return Promise.resolve({ data: [] });
    });

    const result = await service.detectTechStack(
      'org',
      'repo',
      '2026-01-01T00:00:00Z',
    );
    const names = result.technologies.map((t) => t.name);
    expect(names).toContain('NestJS');
    expect(names).toContain('Node.js');
  });

  it('should detect Angular from package.json', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/contents')) {
        return Promise.resolve({
          data: [
            {
              type: 'file',
              name: 'package.json',
              download_url: 'http://mock/package.json',
            },
          ],
        });
      }
      if (url.includes('package.json')) {
        return Promise.resolve({
          data: {
            dependencies: { '@angular/core': '^17.0.0' },
            devDependencies: {},
          },
        });
      }
      return Promise.resolve({ data: [] });
    });

    const result = await service.detectTechStack(
      'org',
      'repo',
      '2026-01-01T00:00:00Z',
    );
    const names = result.technologies.map((t) => t.name);
    expect(names).toContain('Angular');
  });

  it('should return empty technologies when repo contents fetch fails', async () => {
    mockedAxios.get.mockRejectedValue({ response: { status: 404 } });

    const result = await service.detectTechStack(
      'org',
      'nonexistent-repo',
      '2026-01-01T00:00:00Z',
    );
    expect(result.technologies).toHaveLength(0);
    expect(result.org).toBe('org');
    expect(result.repo).toBe('nonexistent-repo');
  });

  it('should deduplicate technologies', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/contents')) {
        return Promise.resolve({
          data: [
            {
              type: 'file',
              name: 'package.json',
              download_url: 'http://mock/package.json',
            },
            { type: 'file', name: 'go.mod' },
          ],
        });
      }
      if (url.includes('package.json')) {
        return Promise.resolve({
          data: {
            dependencies: { '@nestjs/core': '^10.0.0' },
            devDependencies: {},
          },
        });
      }
      return Promise.resolve({ data: [] });
    });

    const result = await service.detectTechStack(
      'org',
      'repo',
      '2026-01-01T00:00:00Z',
    );
    const names = result.technologies.map((t) => t.name);
    const unique = new Set(names);
    expect(names.length).toBe(unique.size);
  });

  it('should handle missing dependencies gracefully', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/contents')) {
        return Promise.resolve({
          data: [
            {
              type: 'file',
              name: 'package.json',
              download_url: 'http://mock/package.json',
            },
          ],
        });
      }
      if (url.includes('package.json')) {
        return Promise.resolve({
          data: { name: 'my-project' },
        });
      }
      return Promise.resolve({ data: [] });
    });

    const result = await service.detectTechStack(
      'org',
      'repo',
      '2026-01-01T00:00:00Z',
    );
    expect(result.technologies).toBeDefined();
    expect(result.technologies.find((t) => t.name === 'Node.js')).toBeDefined();
  });

  it('should include pushedAt and detectedAt in result', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });

    const pushedAt = '2026-03-01T00:00:00Z';
    const result = await service.detectTechStack('org', 'repo', pushedAt);
    expect(result.pushedAt).toBe(pushedAt);
    expect(result.detectedAt).toBeDefined();
  });
});
