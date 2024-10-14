const request = require('supertest');
const express = require('express');
const axios = require('axios'); 
const contributorController = require('../controllers/contributorController'); 

const app = express();
app.use(express.json());
app.get('/contributors', contributorController.getAllContributors); 

describe('GET /contributors', () => {
    it('should return a list of contributors', async () => {
        const response = await request(app).get('/contributors');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle errors', async () => {
        
        jest.spyOn(axios, 'get').mockImplementationOnce(() => {
            throw new Error('Failed to fetch repositories'); 
        });

        const response = await request(app).get('/contributors');

        expect(response.status).toBe(500);
        
        expect(response.body).toHaveProperty('error', 'Failed to fetch repositories'); 
    });
});
