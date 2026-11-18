const express= require('express') ;
const auth_controller = require('../controllers/auth_controller.js') ;

const router = express.Router() ;


router.post('/register', auth_controller.register_user);
router.post('/login', auth_controller.login_user);

module.exports = router;