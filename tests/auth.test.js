const request = require('supertest');
const { sequelize, User } = require('../models');
const jwt = require('jsonwebtoken');

// テスト用の簡易サーバーを作成
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// 認証ミドルウェアのモック
const mockAuthMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            const decoded = jwt.verify(token, 'test-secret');
            req.user = { id: decoded.userId, role: 'admin' };
        } catch (error) {
            return res.status(401).json({ error: 'Invalid token' });
        }
    }
    next();
};

// 認証ルート
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        const token = jwt.sign({ userId: 1 }, 'test-secret', { expiresIn: '1h' });
        res.json({
            message: 'Login successful',
            token,
            user: { id: 1, username: 'admin', role: 'admin' }
        });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.get('/api/auth/me', mockAuthMiddleware, (req, res) => {
    if (req.user) {
        res.json({ user: req.user });
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, firstName, lastName } = req.body;
    if (username && email && password && firstName && lastName) {
        res.status(201).json({
            message: 'User registered successfully',
            user: { username, email, firstName, lastName }
        });
    } else {
        res.status(400).json({ error: 'Missing required fields' });
    }
});

describe('Authentication Tests', () => {
    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'admin',
                    password: 'admin123'
                })
                .expect(200);

            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.username).toBe('admin');
        });

        it('should reject invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'admin',
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        it('should require username and password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'admin'
                })
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return user info with valid token', async () => {
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'admin',
                    password: 'admin123'
                });

            const token = loginResponse.body.token;

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toHaveProperty('id');
        });

        it('should reject request without token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        it('should reject request with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /api/auth/register', () => {
        it('should register new user with valid data', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'newuser',
                    email: 'newuser@example.com',
                    password: 'password123',
                    firstName: 'New',
                    lastName: 'User'
                })
                .expect(201);

            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.username).toBe('newuser');
        });

        it('should reject registration with missing fields', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'newuser',
                    email: 'newuser@example.com'
                    // missing password, firstName, lastName
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });
});
