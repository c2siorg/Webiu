//__tests__/contributorController.test.js


const request = require('supertest');
const express = require('express');
const axios = require('axios'); // Import axios
const contributorController = require('../controllers/contributorController'); // Correct import

const app = express();
app.use(express.json());
app.get('/contributors', contributorController.getAllContributors); // Set up your route

describe('GET /contributors', () => {
    it('should return a list of contributors', async () => {
        const response = await request(app).get('/contributors');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle errors', async () => {
        // Mock the axios request to simulate an error
        jest.spyOn(axios, 'get').mockImplementationOnce(() => {
            throw new Error('Failed to fetch repositories'); // Simulate an error with the message
        });

        const response = await request(app).get('/contributors');

        expect(response.status).toBe(500);
        // Adjust the expected error message to match the actual controller response
        expect(response.body).toHaveProperty('error', 'Failed to fetch repositories'); // Ensure this matches your controller's response
    });
});
