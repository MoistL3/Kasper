const { restrictTo } = require('../src/middlewares/auth-middleware');
const { ForbiddenError } = require('../src/utils/errors');

describe('restrictTo', () => {
    it('allows a listed role', () => {
        const next = jest.fn();
        restrictTo('admin')({ user: { role: 'admin' } }, {}, next);
        expect(next).toHaveBeenCalled();
    });

    it('throws Forbidden for other roles', () => {
        expect(() => restrictTo('admin')({ user: { role: 'member' } }, {}, jest.fn()))
            .toThrow(ForbiddenError);
    });
});