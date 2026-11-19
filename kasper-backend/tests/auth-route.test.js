const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { protect, restrictTo } = require('../src/middlewares/auth-middleware');
const errorHandler = require('../src/middlewares/error-middleware');
const { UnauthorizedError, ForbiddenError } = require('../src/utils/errors');
const { User } = require('../src/models/User');

// Mini Express app to test protect + restrictTo chain end-to-end
const buildTestApp = () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.get('/lead-or-admin', protect, restrictTo('lead', 'admin'), (req, res) => {
        res.status(200).json({ status: 'success', role: req.user.role });
    });
    testApp.use(errorHandler);
    return testApp;
};

const createUserWithRole = async (role, isActive = true) => {
    const password = await bcrypt.hash('Passw0rd!123', 10);
    const user = await User.create({
        name: `${role} User`,
        email: `${role}_${Date.now()}@kasper.dev`,
        password,
        role,
        isActive,
    });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return { user, token };
};

describe('Unit: restrictTo middleware', () => {
    it('allows a single matching role', () => {
        const next = jest.fn();
        restrictTo('admin')({ user: { role: 'admin' } }, {}, next);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('allows any role included in multiple allowed roles', () => {
        const next = jest.fn();
        restrictTo('lead', 'admin')({ user: { role: 'lead' } }, {}, next);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('throws ForbiddenError when user role is not allowed', () => {
        expect(() =>
            restrictTo('lead', 'admin')({ user: { role: 'member' } }, {}, jest.fn())
        ).toThrow(ForbiddenError);
    });
});

describe('Unit: protect middleware', () => {
    it('throws UnauthorizedError if Authorization header is missing', async () => {
        const req = { headers: {} };
        await expect(protect(req, {}, jest.fn())).rejects.toThrow(UnauthorizedError);
    });

    it('attaches active user to req.user and calls next()', async () => {
        const { user, token } = await createUserWithRole('member', true);
        const req = { headers: { authorization: `Bearer ${token}` } };
        const next = jest.fn();

        await protect(req, {}, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.user._id.toString()).toBe(user._id.toString());
    });
});

describe('Integration: Protected RBAC Route (protect + restrictTo)', () => {
    const testApp = buildTestApp();

    it('returns 401 when unauthenticated', async () => {
        const res = await request(testApp).get('/lead-or-admin');
        expect(res.status).toBe(401);
    });

    it('returns 403 when authenticated as member', async () => {
        const { token } = await createUserWithRole('member');
        const res = await request(testApp)
            .get('/lead-or-admin')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(403);
        expect(res.body.message).toBe('You do not have permission to perform this action');
    });

    it('returns 200 when authenticated as lead', async () => {
        const { token } = await createUserWithRole('lead');
        const res = await request(testApp)
            .get('/lead-or-admin')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.role).toBe('lead');
    });

    it('returns 200 when authenticated as admin', async () => {
        const { token } = await createUserWithRole('admin');
        const res = await request(testApp)
            .get('/lead-or-admin')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.role).toBe('admin');
    });
});