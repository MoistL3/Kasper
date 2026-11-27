const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// الإيميل مبيتبعتش فعليًا في التيستات؛ بنلقط الكود من استدعاء الدالة
jest.mock('../src/services/mail-service');

const app = require('../src/app');
const { User } = require('../src/models/User');
const { send_verification_email } = require('../src/services/mail-service');

const creds = {
    name: 'Test User',
    email: 'test@kasper.dev',
    password: 'Passw0rd!123',
    college: 'Computers & AI',
    department: 'Computer Science',
};

const INVALID_CODE_MESSAGE = 'Invalid or expired verification code';

beforeEach(() => jest.clearAllMocks());

const register = (body = creds) =>
    request(app).post('/api/auth/register').send(body);

const verify = (email, code) =>
    request(app).post('/api/auth/verify-email').send({ email, code });

const resend = (email) =>
    request(app).post('/api/auth/resend-code').send({ email });

// آخر كود اتبعت (الباراميتر التاني في send_verification_email(to, code, ...))
const last_code = () => {
    const { calls } = send_verification_email.mock;
    return calls[calls.length - 1][1];
};

const wrong_code = () => (last_code() === '000000' ? '111111' : '000000');

// بنرجّع وقت آخر إرسال للخلف عشان نتخطى الـ cooldown من غير ما نستنى 60 ثانية
const skip_cooldown = (email) =>
    User.updateOne({ email }, { verificationSentAt: new Date(Date.now() - 2 * 60 * 1000) });

const register_and_verify = async (body = creds) => {
    await register(body);
    return verify(body.email, last_code());
};

describe('POST /api/auth/register', () => {
    it('creates an unverified student, sends a code, and returns no token', async () => {
        const res = await register();

        expect(res.status).toBe(201);
        expect(res.body.status).toBe('success');
        expect(res.body.data).toEqual({ email: creds.email, requiresVerification: true });
        expect(res.body.data).not.toHaveProperty('token');

        expect(send_verification_email).toHaveBeenCalledTimes(1);
        expect(send_verification_email.mock.calls[0][0]).toBe(creds.email);
        expect(last_code()).toMatch(/^\d{6}$/);

        const user = await User.findOne({ email: creds.email });
        expect(user.role).toBe('student');
        expect(user.college).toBe(creds.college);
        expect(user.department).toBe(creds.department);
        expect(user.isEmailVerified).toBe(false);
    });

    it('stores only a hash of the code, never the code itself', async () => {
        await register();
        const user = await User.findOne({ email: creds.email }).select('+verificationCodeHash');

        expect(user.verificationCodeHash).not.toBe(last_code());
        expect(user.verificationCodeHash).toHaveLength(64);
    });

    it('normalizes email (trim + lowercase) and trims name', async () => {
        const res = await register({
            ...creds,
            name: '  Ahmed Maher  ',
            email: '  TEST@Kasper.DEV  ',
        });

        expect(res.status).toBe(201);
        expect(res.body.data.email).toBe('test@kasper.dev');

        const user = await User.findOne({ email: 'test@kasper.dev' });
        expect(user.name).toBe('Ahmed Maher');
    });

    it('ignores role escalation attempts (role: admin / lead) in request body', async () => {
        const res = await register({ ...creds, role: 'admin' });

        expect(res.status).toBe(201);
        const user = await User.findOne({ email: creds.email });
        expect(user.role).toBe('student');
    });

    it('stores a bcrypt hash (12 rounds), never the plain password', async () => {
        await register();
        const user = await User.findOne({ email: creds.email }).select('+password');

        expect(user.password).not.toBe(creds.password);
        expect(user.password).toMatch(/^\$2[aby]\$12\$/);
    });

    it('returns 409 for a duplicate email once the account is verified (case-insensitive)', async () => {
        await register_and_verify();
        const res = await register({ ...creds, email: 'TEST@KASPER.DEV' });

        expect(res.status).toBe(409);
        expect(res.body.status).toBe('fail');
        expect(res.body.message).toBe('Email is already registered');
    });

    it('returns 429 when re-registering an unverified email during the cooldown', async () => {
        await register();
        const res = await register();

        expect(res.status).toBe(429);
        expect(send_verification_email).toHaveBeenCalledTimes(1);
    });

    it('lets a pending (unverified) registration be overwritten after the cooldown', async () => {
        await register();
        await skip_cooldown(creds.email);

        const res = await register({ ...creds, name: 'Second Try' });

        expect(res.status).toBe(201);
        expect(send_verification_email).toHaveBeenCalledTimes(2);
        const user = await User.findOne({ email: creds.email });
        expect(user.name).toBe('Second Try');
        expect(user.isEmailVerified).toBe(false);
    });

    it('never overwrites a legacy account that has no pending verification', async () => {
        // حساب قديم: متسجل قبل الميزة (مفيش verificationSentAt)، حتى لو isEmailVerified بقت false بالغلط
        await User.create({
            name: 'Old User',
            email: creds.email,
            password: 'x'.repeat(60),
            college: creds.college,
            department: creds.department,
        });

        const res = await register({ ...creds, name: 'Attacker' });

        expect(res.status).toBe(409);
        const user = await User.findOne({ email: creds.email });
        expect(user.name).toBe('Old User');
    });

    it('returns 400 when required fields are missing', async () => {
        const res = await register({ email: creds.email });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('fail');
    });

    it('returns 400 when college or department is missing', async () => {
        const { college, ...withoutCollege } = creds;
        const res1 = await register(withoutCollege);
        expect(res1.status).toBe(400);

        const { department, ...withoutDepartment } = creds;
        const res2 = await register(withoutDepartment);
        expect(res2.status).toBe(400);
    });

    it('blocks non-string / NoSQL injection payloads with 400', async () => {
        const res = await register({ ...creds, name: { $ne: null } });

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

    it('rejects a department that does not belong to the college', async () => {
        const res = await register({ ...creds, college: 'Commerce', department: 'Computer Science' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid college or department');
    });

    it('rejects an unknown college', async () => {
        const res = await register({ ...creds, college: 'Hogwarts' });

        expect(res.status).toBe(400);
    });

    it('does not crash on prototype keys as college (400, not 500)', async () => {
        const res = await register({ ...creds, college: 'constructor', department: 'x' });

        expect(res.status).toBe(400);
    });
});

describe('POST /api/auth/verify-email', () => {
    beforeEach(() => register());

    it('verifies with the right code, returns a JWT, and clears the code', async () => {
        const res = await verify(creds.email, last_code());

        expect(res.status).toBe(200);
        expect(res.body.data.token.split('.')).toHaveLength(3);
        expect(res.body.data.user.email).toBe(creds.email);
        expect(res.body.data.user.college).toBe(creds.college);
        expect(res.body.data.user).not.toHaveProperty('password');

        const user = await User.findOne({ email: creds.email }).select('+verificationCodeHash');
        expect(user.isEmailVerified).toBe(true);
        expect(user.verificationCodeHash).toBeNull();
    });

    it('issues a token that works on a protected route', async () => {
        const { body } = await verify(creds.email, last_code());

        const me = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${body.data.token}`);

        expect(me.status).toBe(200);
        expect(me.body.data.user.email).toBe(creds.email);
    });

    it('accepts email with different casing / padding', async () => {
        const res = await verify('  TEST@KASPER.DEV ', last_code());

        expect(res.status).toBe(200);
    });

    it('rejects a wrong code and counts the attempt', async () => {
        const res = await verify(creds.email, wrong_code());

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(INVALID_CODE_MESSAGE);

        const user = await User.findOne({ email: creds.email }).select('+verificationAttempts');
        expect(user.verificationAttempts).toBe(1);
        expect(user.isEmailVerified).toBe(false);
    });

    it('locks the code after 5 wrong attempts, even if the right code comes next', async () => {
        const good = last_code();
        for (let i = 0; i < 5; i += 1) {
            const res = await verify(creds.email, wrong_code());
            expect(res.status).toBe(400);
        }

        const res = await verify(creds.email, good);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(INVALID_CODE_MESSAGE);
    });

    it('rejects an expired code', async () => {
        await User.updateOne(
            { email: creds.email },
            { verificationExpiresAt: new Date(Date.now() - 1000) }
        );

        const res = await verify(creds.email, last_code());

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(INVALID_CODE_MESSAGE);
    });

    it('cannot reuse a code after a successful verification', async () => {
        const code = last_code();
        await verify(creds.email, code);

        const res = await verify(creds.email, code);

        expect(res.status).toBe(400);
    });

    it('returns the same generic error for an unknown email', async () => {
        const res = await verify('nobody@kasper.dev', '123456');

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(INVALID_CODE_MESSAGE);
    });

    it('rejects non-string and malformed codes with 400', async () => {
        const injection = await verify(creds.email, { $ne: null });
        expect(injection.status).toBe(400);

        const letters = await verify(creds.email, 'abcdef');
        expect(letters.status).toBe(400);

        const short = await verify(creds.email, '123');
        expect(short.status).toBe(400);

        const missing = await request(app).post('/api/auth/verify-email').send({ email: creds.email });
        expect(missing.status).toBe(400);
    });

    it('does not verify a deactivated user', async () => {
        await User.updateOne({ email: creds.email }, { isActive: false });

        const res = await verify(creds.email, last_code());

        expect(res.status).toBe(400);
    });
});

describe('POST /api/auth/resend-code', () => {
    it('returns 429 during the cooldown and sends nothing', async () => {
        await register();
        const res = await resend(creds.email);

        expect(res.status).toBe(429);
        expect(send_verification_email).toHaveBeenCalledTimes(1);
    });

    it('sends a fresh working code after the cooldown', async () => {
        await register();
        await skip_cooldown(creds.email);

        const res = await resend(creds.email);

        expect(res.status).toBe(200);
        expect(send_verification_email).toHaveBeenCalledTimes(2);

        const verified = await verify(creds.email, last_code());
        expect(verified.status).toBe(200);
    });

    it('answers 200 for an unknown email without sending anything', async () => {
        const res = await resend('nobody@kasper.dev');

        expect(res.status).toBe(200);
        expect(send_verification_email).not.toHaveBeenCalled();
    });

    it('answers 200 for an already verified account without sending anything', async () => {
        await register_and_verify();
        send_verification_email.mockClear();

        const res = await resend(creds.email);

        expect(res.status).toBe(200);
        expect(send_verification_email).not.toHaveBeenCalled();
    });

    it('returns 400 for a non-string email', async () => {
        const res = await resend({ $ne: null });

        expect(res.status).toBe(400);
    });
});

describe('POST /api/auth/login', () => {
    beforeEach(() => register_and_verify());

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

describe('POST /api/auth/login (unverified email)', () => {
    beforeEach(() => register());

    it('returns 403 with EMAIL_NOT_VERIFIED when the password is right', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: creds.email, password: creds.password });

        expect(res.status).toBe(403);
        expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
        expect(res.body).not.toHaveProperty('data');
    });

    it('does not resend a code during the cooldown', async () => {
        await request(app)
            .post('/api/auth/login')
            .send({ email: creds.email, password: creds.password });

        expect(send_verification_email).toHaveBeenCalledTimes(1); // اللي اتبعت وقت التسجيل بس
    });

    it('sends a fresh code after the cooldown', async () => {
        await skip_cooldown(creds.email);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: creds.email, password: creds.password });

        expect(res.status).toBe(403);
        expect(send_verification_email).toHaveBeenCalledTimes(2);
    });

    it('still returns 401 (not 403) for a wrong password, so nothing leaks', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: creds.email, password: 'WrongPassword!123' });

        expect(res.status).toBe(401);
        expect(res.body).not.toHaveProperty('code');
    });
});

describe('GET /api/auth/me', () => {
    it('returns current user (incl. college/department) without password or __v', async () => {
        const { body } = await register_and_verify();

        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${body.data.token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.user.email).toBe(creds.email);
        expect(res.body.data.user.college).toBe(creds.college);
        expect(res.body.data.user.department).toBe(creds.department);
        expect(res.body.data.user).not.toHaveProperty('password');
        expect(res.body.data.user).not.toHaveProperty('verificationCodeHash');
        expect(res.body.data.user).not.toHaveProperty('__v');
        expect(res.body.data.user).toHaveProperty('lastLoginAt');
    });

    it('returns 401 when Authorization header is missing', async () => {
        const res = await request(app).get('/api/auth/me');

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Authentication required');
    });

    it('returns 401 when Authorization header does not start with Bearer', async () => {
        const { body } = await register_and_verify();

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
        const { body } = await register_and_verify();
        await User.updateOne({ email: creds.email }, { isActive: false });

        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${body.data.token}`);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('User no longer exists or is inactive');
    });

    it('rejects a valid token if the user was deleted from the database', async () => {
        const { body } = await register_and_verify();
        await User.deleteOne({ email: creds.email });

        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${body.data.token}`);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('User no longer exists or is inactive');
    });
});

describe('GET /api/academic/structure', () => {
    it('is public and returns the college -> departments map', async () => {
        const res = await request(app).get('/api/academic/structure');

        expect(res.status).toBe(200);
        expect(res.body.data.structure['Computers & AI']).toContain('Computer Science');
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