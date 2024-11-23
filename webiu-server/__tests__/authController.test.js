const request = require('supertest');
const express = require('express');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');
const authController = require('../controllers/authController');

jest.mock('../utils/jwt', () => ({
  signToken: jest.fn().mockReturnValue('mockedToken'), 
}));

const app = express();
app.use(express.json());
app.post('/register', authController.register);
app.post('/login', authController.login);

describe('Auth Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks(); 
  });

  // Test successful user registration
  it('should register a user successfully', async () => {
    const mockUser = {
      _id: '60d6f96a9b1f8f001c8f27c5', 
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: 'password123',
    };

    User.findOne = jest.fn().mockResolvedValue(null); 
    User.prototype.save = jest.fn().mockResolvedValue(mockUser);

    const response = await request(app).post('/register').send({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    response.body.data.user.id = mockUser._id;

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(response.body.data.user).toEqual({
      id: mockUser._id, 
      name: mockUser.name,
      email: mockUser.email,
    });
    expect(response.body.data.token).toBe('mockedToken');
  });

  // Test failed user registration - email already exists
  it('should return an error when email already exists during registration', async () => {
    const mockUser = {
      _id: '60d6f96a9b1f8f001c8f27c5',
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: 'password123',
    };

    User.findOne = jest.fn().mockResolvedValue(mockUser);

    const response = await request(app).post('/register').send({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('User already exists');
  });

  // Test failed user registration - password mismatch
  it('should return an error when passwords do not match', async () => {
    const response = await request(app).post('/register').send({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: 'password123',
      confirmPassword: 'password456', 
    });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('Passwords do not match');
  });

  // Test successful user login
  it('should login a user successfully', async () => {
    const mockUser = {
      _id: '60d6f96a9b1f8f001c8f27c5',
      email: 'johndoe@example.com',
      password: 'password123',
      matchPassword: jest.fn().mockResolvedValue(true),
      githubId: 'john-github',
    };

    User.findOne = jest.fn().mockResolvedValue(mockUser);

    const response = await request(app).post('/login').send({
      email: 'johndoe@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.user).toEqual({
      id: mockUser._id,
      name: mockUser.name,
      email: mockUser.email,
      githubId: mockUser.githubId,
    });
    expect(response.body.data.token).toBe('mockedToken');
  });

  // Test failed user login - incorrect password
  it('should return an error for incorrect password during login', async () => {
    const mockUser = {
      _id: '60d6f96a9b1f8f001c8f27c5',
      email: 'johndoe@example.com',
      password: 'password123',
      matchPassword: jest.fn().mockResolvedValue(false), 
    };

    User.findOne = jest.fn().mockResolvedValue(mockUser);

    const response = await request(app).post('/login').send({
      email: 'johndoe@example.com',
      password: 'wrongPassword',
    });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('Invalid email or password');
  });

  // Test failed user login - user not found
  it('should return an error if user is not found during login', async () => {
    User.findOne = jest.fn().mockResolvedValue(null); 

    const response = await request(app).post('/login').send({
      email: 'nonexistentuser@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('User not found');
  });

  // Test failed user registration - invalid email format
  it('should return an error for invalid email format during registration', async () => {
    const response = await request(app).post('/register').send({
      name: 'John Doe',
      email: 'invalid-email',
      password: 'password123',
      confirmPassword: 'password123',
    });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('Invalid email format');
  });

  // Test failed user login - missing fields
  it('should return an error if required fields are missing during login', async () => {
    const response = await request(app).post('/login').send({
      email: 'johndoe@example.com', 
    });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('User not found');
  });
});
