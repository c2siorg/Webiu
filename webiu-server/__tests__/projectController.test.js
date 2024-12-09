const request = require('supertest');
const app = require('../app');
const axios = require('axios');
jest.mock('axios');

describe('GET /projects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a list of projects with pull request counts', async () => {
    const mockRepos = [
      { name: 'repo1', id: 1 },
      { name: 'repo2', id: 2 },
    ];
    const mockPRs1 = [{ id: 1 }, { id: 2 }];
    const mockPRs2 = [];

    axios.get
      .mockResolvedValueOnce({ data: mockRepos })
      .mockResolvedValueOnce({ data: mockPRs1 })
      .mockResolvedValueOnce({ data: mockPRs2 });

    const response = await request(app).get('/projects');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('repositories');
    expect(Array.isArray(response.body.repositories)).toBe(true);
    expect(response.body.repositories).toHaveLength(2);
    expect(response.body.repositories).toEqual([
      {
        name: 'repo1',
        pull_requests: 2,
        description: 'No description provided',
        open_issues_count: 0,
        stargazers_count: 0,
      },
      {
        name: 'repo2',
        pull_requests: 0,
        description: 'No description provided',
        open_issues_count: 0,
        stargazers_count: 0,
      },
    ]);
  });

  it('should handle errors when fetching pull requests for a repository', async () => {
    const mockRepos = [{ name: 'repo1', id: 1 }];
    axios.get
      .mockResolvedValueOnce({ data: mockRepos })
      .mockRejectedValueOnce(new Error('Failed to fetch pull requests'));

    const response = await request(app).get('/projects');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('repositories');
    expect(response.body.repositories).toHaveLength(1);
    expect(response.body.repositories[0]).toEqual({
      name: 'repo1',
      pull_requests: 'Error fetching PRs',
      description: 'No description available',
      open_issues_count: 0,
      stargazers_count: 0,
    });
  });

  it('should handle partial failures while fetching pull requests', async () => {
    const mockRepos = [
      { name: 'repo1', id: 1 },
      { name: 'repo2', id: 2 },
    ];
    const mockPRs1 = [{ id: 1 }, { id: 2 }];

    axios.get
      .mockResolvedValueOnce({ data: mockRepos })
      .mockResolvedValueOnce({ data: mockPRs1 })
      .mockRejectedValueOnce(new Error('Failed to fetch pull requests'));

    const response = await request(app).get('/projects');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('repositories');
    expect(response.body.repositories).toHaveLength(2);
    expect(response.body.repositories[0]).toEqual({
      name: 'repo1',
      pull_requests: 2,
      description: 'No description provided',
      open_issues_count: 0,
      stargazers_count: 0,
    });
    expect(response.body.repositories[1]).toEqual({
      name: 'repo2',
      pull_requests: 'Error fetching PRs',
      description: 'No description provided',
      open_issues_count: 0,
      stargazers_count: 0,
    });
  });
});