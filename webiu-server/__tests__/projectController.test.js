//__tests__/projectController.test.js

const axios = require('axios');
const request = require('supertest');
const express = require('express');
const projectController = require('../controllers/projectController');

const app = express();
app.use(express.json());
app.get('/projects', projectController.getAllProjects);

describe('GET /projects', () => {
    it('should return a list of projects with pull requests count', async () => {
        const response = await request(app).get('/projects');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('repositories');
        expect(Array.isArray(response.body.repositories)).toBe(true);
    });

    it('should handle errors', async () => {
        // Mock the axios request here to simulate an error
        jest.spyOn(axios, 'get').mockImplementationOnce(() => {
            throw new Error('Failed to fetch repositories');
        });

        const response = await request(app).get('/projects');

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Internal server error'); // Ensure this matches your controller's response
    });
});
