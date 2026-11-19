const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../src/app');
const { User } = require('../src/models/User');

const creds = {
    name: 'Test User',
    email: 'test@kasper.dev',
    password: 'Passw0rd!123',
};

const register = (body = creds) =>
    request(app).post('/api/auth/register').send(body);

describe('POST /api/auth/register', () => {
    it('creates a member without leaking the password and returns a valid JWT', async () => {
        const res = await register();

        expect(res.status).toBe(201);
        expect(res.body.status).toBe('success');
        expect(res.body.data.user.role).toBe('member');
        expect(res.body.data.user.email).toBe(creds.email);
        expect(res.body.data.user).not.toHaveProperty('password');
        expect(res.body.data.token.split('.')).toHaveLength(3);
    });

    it('normalizes email (trim + lowercase) and trims name', async () => {
        const res = await register({
            name: '  Ahmed Maher  ',
            email: '  TEST@Kasper.DEV  ',
            password: creds.password,
        });

        expect(res.status).toBe(201);
        expect(res.body.data.user.name).toBe('Ahmed Maher');
        expect(res.body.data.user.email).toBe('test@kasper.dev');
    });

    it('ignores role escalation attempts (role: admin / lead) in request body', async () => {
        const res = await register({ ...creds, role: 'admin' });

        expect(res.status).toBe(201);
        expect(res.body.data.user.role).toBe('member');
    });

    it('stores a bcrypt hash (12 rounds), never the plain password', async () => {
        await register();
        const user = await User.findOne({ email: creds.email }).select('+password');

        expect(user.password).not.toBe(creds.password);
        expect(user.password).toMatch(/^\$2[aby]\$12\$/);
    });

    it('returns 409 for a duplicate email (case-insensitive)', async () => {
        await register();
        const res = await register({ ...creds, email: 'TEST@KASPER.DEV' });

        expect(res.status).toBe(409);
        expect(res.body.status).toBe('fail');
        expect(res.body.message).toBe('Email is already registered');
    });

    it('returns 400 when required fields are missing', async () => {
        const res = await register({ email: creds.email });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('fail');
    });

    it('blocks non-string / NoSQL injection payloads with 400', async () => {
        const res = await register({
            name: { $ne: null },
            email: creds.email,
            password: creds.password,
        });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('fail');
    });

    it('returns 400 for password shorter than 8 characters', async () => {
        const res = await register({ ...creds, password: '1234567' });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/between 8 and 72/i);
    });

    it('returns 400 for password longer than 72 characters (bcrypt limit)', async () => {
        const res = await register({ ...creds, password: 'A'.repeat(73) });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/between 8 and 72/i);
    });

    it('returns 400 for invalid email format', async () => {
        const res = await register({ ...creds, email: 'not-an-email' });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('fail');
    });

    it('returns 400 when name is shorter than 2 or longer than 80 characters', async () => {
        const shortRes = await register({ ...creds, name: 'A' });
        expect(shortRes.status).toBe(400);

        const longRes = await register({ ...creds, name: 'A'.repeat(81) });
        expect(longRes.status).toBe(400);
    });
});

describe('POST /api/auth/login', () => {
    beforeEach(() => register());

    it('logs in with correct credentials, updates lastLoginAt, and hides password', async () => {
        const beforeUser = await User.findOne({ email: creds.email });
        expect(beforeUser.lastLoginAt).toBeNull();

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: creds.email, password: creds.password });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data.token).toBeDefined();
        expect(res.body.data.user).not.toHaveProperty('password');

        const afterUser = await User.findOne({ email: creds.email });
        expect(afterUser.lastLoginAt).toBeInstanceOf(Date);
    });

    it('allows login with uppercase / padded email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: '  TEST@KASPER.DEV  ', password: creds.password });

        expect(res.status).toBe(200);
        expect(res.body.data.token).toBeDefined();
    });

    it('returns 400 when email or password is missing', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: creds.email });

        expect(res.status).toBe(400);
    });

    it('blocks NoSQL injection payloads with 400', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: { $gt: '' }, password: 'anything' });

        expect(res.status).toBe(400);
    });

    it('returns 401 for wrong password with generic message', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: creds.email, password: 'WrongPassword!123' });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Invalid email or password');
    });

    it('returns 401 for non-existent email with generic message', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nobody@kasper.dev', password: creds.password });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Invalid email or password');
    });

    it('rejects an inactive user with 401', async () => {
        await User.updateOne({ email: creds.email }, { isActive: false });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: creds.email, password: creds.password });

        expect(res.status).toBe(401);
    });
});

describe('GET /api/auth/me', () => {
    it('returns current user profile without password or __v when given a valid token', async () => {
        const { body } = await register();

        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${body.data.token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.user.email).toBe(creds.email);
        expect(res.body.data.user).not.toHaveProperty('password');
        expect(res.body.data.user).not.toHaveProperty('__v');
        expect(res.body.data.user).toHaveProperty('lastLoginAt');
    });

    it('returns 401 when Authorization header is missing', async () => {
        const res = await request(app).get('/api/auth/me');

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Authentication required');
    });

    it('returns 401 when Authorization header does not start with Bearer', async () => {
        const { body } = await register();

        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Basic ${body.data.token}`);

        expect(res.status).toBe(401);
    });

    it('returns 401 for a malformed or tampered token', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer not.a.realtoken');

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Invalid or expired token');
    });

    it('returns 401 for a token signed with a different secret', async () => {
        const fakeToken = jwt.sign({ id: new mongoose.Types.ObjectId() }, 'wrong_secret');

        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${fakeToken}`);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Invalid or expired token');
    });

    it('returns 401 for an expired token', async () => {
        const expiredToken = jwt.sign(
            { id: new mongoose.Types.ObjectId() },
            process.env.JWT_SECRET,
            { expiresIn: '-10s' }
        );

        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${expiredToken}`);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Invalid or expired token');
    });

    it('returns 401 for a token with missing id payload', async () => {
        const badPayloadToken = jwt.sign({ foo: 'bar' }, process.env.JWT_SECRET);

        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${badPayloadToken}`);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Invalid token payload');
    });

    it('rejects a valid token of a deactivated user', async () => {
        const { body } = await register();
        await User.updateOne({ email: creds.email }, { isActive: false });

        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${body.data.token}`);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('User no longer exists or is inactive');
    });

    it('rejects a valid token if the user was deleted from the database', async () => {
        const { body } = await register();
        await User.deleteOne({ email: creds.email });

        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${body.data.token}`);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('User no longer exists or is inactive');
    });
});

describe('General Error Handling', () => {
    it('returns 400 when receiving malformed JSON body', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .set('Content-Type', 'application/json')
            .send('{ bad json');

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Malformed JSON body');
    });
});