const request = require('supertest');
const app = require('../src/app');
const { User } = require('../src/models/User');

const creds = { name: 'Test User', email: 'test@kasper.dev', password: 'Passw0rd!123' };
const register = (body = creds) => request(app).post('/api/auth/register').send(body);

describe('POST /api/auth/register', () => {
    it('creates a member without leaking the password', async () => {
        const res = await register();
        expect(res.status).toBe(201);
        expect(res.body.data.user.role).toBe('member');
        expect(res.body.data.user).not.toHaveProperty('password');
        expect(res.body.data.token.split('.')).toHaveLength(3);
    });

    it('ignores role: admin in the body', async () => {
        const res = await register({ ...creds, role: 'admin' });
        expect(res.body.data.user.role).toBe('member');
    });

    it('stores a bcrypt hash, not the plain password', async () => {
        await register();
        const user = await User.findOne({ email: creds.email }).select('+password');
        expect(user.password).not.toBe(creds.password);
        expect(user.password).toMatch(/^\$2[aby]\$12\$/);
    });

    it('returns 409 for a duplicate email', async () => {
        await register();
        expect((await register()).status).toBe(409);
    });
});

describe('POST /api/auth/login', () => {
    beforeEach(() => register());

    it('logs in with correct credentials', async () => {
        const res = await request(app).post('/api/auth/login').send(creds);
        expect(res.status).toBe(200);
        expect(res.body.data.token).toBeDefined();
    });

    it('blocks NoSQL injection', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: { $gt: '' }, password: 'anything' });
        expect(res.status).toBe(400);
    });

    it('rejects an inactive user', async () => {
        await User.updateOne({ email: creds.email }, { isActive: false });
        const res = await request(app).post('/api/auth/login').send(creds);
        expect(res.status).toBe(401);
    });
});

describe('GET /api/auth/me', () => {
    it('works with a valid token', async () => {
        const { body } = await register();
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${body.data.token}`);
        expect(res.status).toBe(200);
        expect(res.body.data.user.email).toBe(creds.email);
    });

    it('rejects a valid token of a deactivated user', async () => {
        const { body } = await register();
        await User.updateOne({ email: creds.email }, { isActive: false });
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${body.data.token}`);
        expect(res.status).toBe(401);
    });
});