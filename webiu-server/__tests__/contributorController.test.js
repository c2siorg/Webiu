const request = require('supertest');
const express = require('express');
const axios = require('axios');
const contributorController = require('../controllers/contributorController');

jest.mock('axios');

const app = express();
app.use(express.json());
app.get('/contributors', contributorController.getAllContributors);

describe('GET /contributors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  it('should return a list of contributors', async () => {
    const mockRepos = [{ name: 'repo1' }, { name: 'repo2' }];
    const mockContributors = [
      {
        login: 'user1',
        contributions: 10,
        avatar_url: 'https://example.com/avatar1.jpg',
      },
      {
        login: 'user2',
        contributions: 5,
        avatar_url: 'https://example.com/avatar2.jpg',
      },
    ];

    axios.get
      .mockResolvedValueOnce({ data: mockRepos })
      .mockResolvedValueOnce({ data: mockContributors })
      .mockResolvedValueOnce({ data: mockContributors });

    const response = await request(app).get('/contributors');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          login: 'user1',
          contributions: 20,
          repos: expect.arrayContaining(['repo1', 'repo2']),
          avatar_url: 'https://example.com/avatar1.jpg',
        }),
        expect.objectContaining({
          login: 'user2',
          contributions: 10,
          repos: expect.arrayContaining(['repo1', 'repo2']),
          avatar_url: 'https://example.com/avatar2.jpg',
        }),
      ])
    );
  });

  it('should handle errors when fetching repositories', async () => {
    axios.get.mockRejectedValueOnce(new Error('Failed to fetch repositories'));

    const response = await request(app).get('/contributors');

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty(
      'error',
      'Failed to fetch repositories'
    );
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle errors when fetching contributors', async () => {
    const mockRepos = [{ name: 'repo1' }];
    axios.get
      .mockResolvedValueOnce({ data: mockRepos })
      .mockRejectedValueOnce(new Error('Failed to fetch contributors'));

    const response = await request(app).get('/contributors');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(0);
    expect(console.error).toHaveBeenCalled();
  });

  it('should return empty array when no repositories found', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    const response = await request(app).get('/contributors');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
