const request = require('supertest');
const express = require('express');
const axios = require('axios');
const projectController = require('../controllers/projectController');

jest.mock('axios');

const app = express();
app.use(express.json());
app.get('/projects', projectController.getAllProjects);

describe('GET /projects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  it('should return a list of projects with pull requests count', async () => {
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
      expect.objectContaining({
        name: 'repo1',
        id: 1,
        pull_requests: 2,
      }),
      expect.objectContaining({
        name: 'repo2',
        id: 2,
        pull_requests: 0,
      }),
    ]);

    expect(axios.get).toHaveBeenCalledTimes(3);
    expect(axios.get).toHaveBeenNthCalledWith(
      1,
      'https://api.github.com/orgs/c2siorg/repos',
      expect.any(Object)
    );
    expect(axios.get).toHaveBeenNthCalledWith(
      2,
      'https://api.github.com/repos/c2siorg/repo1/pulls',
      expect.any(Object)
    );
    expect(axios.get).toHaveBeenNthCalledWith(
      3,
      'https://api.github.com/repos/c2siorg/repo2/pulls',
      expect.any(Object)
    );
  });

  it('should handle errors when fetching repositories', async () => {
    axios.get.mockRejectedValueOnce(new Error('Failed to fetch repositories'));

    const response = await request(app).get('/projects');

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Internal server error');
    expect(console.error).toHaveBeenCalledWith(
      'Error fetching repositories or pull requests:',
      expect.stringContaining('Failed to fetch repositories')
    );
  });

  it('should handle errors when fetching pull requests', async () => {
    const mockRepos = [{ name: 'repo1', id: 1 }];
    axios.get
      .mockResolvedValueOnce({ data: mockRepos })
      .mockRejectedValueOnce(new Error('Failed to fetch pull requests'));

    const response = await request(app).get('/projects');

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Internal server error');
    expect(console.error).toHaveBeenCalledWith(
      'Error fetching repositories or pull requests:',
      expect.stringContaining('Failed to fetch pull requests')
    );
  });

  it('should handle empty repository list', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    const response = await request(app).get('/projects');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ repositories: [] });
  });
});
