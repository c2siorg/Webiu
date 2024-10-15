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
      { login: 'user1', contributions: 10 },
      { login: 'user2', contributions: 5 },
    ];
    const mockUserDetails = {
      login: 'user1',
      followers: 100,
      following: 50,
      avatar_url: 'https://example.com/avatar1.jpg',
    };

    axios.get
      .mockResolvedValueOnce({ data: mockRepos })
      .mockResolvedValueOnce({ data: mockContributors })
      .mockResolvedValueOnce({ data: mockContributors })
      .mockResolvedValueOnce({ data: mockUserDetails })
      .mockResolvedValueOnce({ data: mockUserDetails });

    const response = await request(app).get('/contributors');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toEqual({
      login: 'user1',
      contributions: 10,
      repos: ['repo1', 'repo1'],
      followers: 100,
      following: 50,
      avatar_url: 'https://example.com/avatar1.jpg',
    });
  });

  it('should handle errors when fetching repositories', async () => {
    axios.get.mockRejectedValueOnce(new Error('Failed to fetch repositories'));

    const response = await request(app).get('/contributors');

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty(
      'error',
      'Failed to fetch repositories'
    );
    expect(console.error).toHaveBeenCalledWith(
      'Error in fetching repositories',
      expect.any(Error)
    );
  });

  it('should handle errors when fetching contributors', async () => {
    const mockRepos = [{ name: 'repo1' }];
    axios.get
      .mockResolvedValueOnce({ data: mockRepos })
      .mockRejectedValueOnce(new Error('Failed to fetch contributors'));

    const response = await request(app).get('/contributors');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
    expect(console.error).toHaveBeenCalledWith(
      'Error in fetching contributors',
      expect.any(Error)
    );
  });

  it('should handle errors when fetching user details', async () => {
    const mockRepos = [{ name: 'repo1' }];
    const mockContributors = [{ login: 'user1', contributions: 10 }];
    axios.get
      .mockResolvedValueOnce({ data: mockRepos })
      .mockResolvedValueOnce({ data: mockContributors })
      .mockRejectedValueOnce(new Error('Failed to fetch user details'));

    const response = await request(app).get('/contributors');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
    expect(console.error).toHaveBeenCalledWith(
      'Error in fetching contributor details',
      expect.any(Error)
    );
  });
});
