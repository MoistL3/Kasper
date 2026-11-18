const express = require('express');
const auth_controller = require('../controllers/auth-controller.js');
const { protect } = require('../middlewares/auth-middleware.js');

const router = express.Router();

router.post('/register', auth_controller.register_user);
router.post('/login', auth_controller.login_user);
router.get('/me', protect, auth_controller.get_me);

module.exports = router;