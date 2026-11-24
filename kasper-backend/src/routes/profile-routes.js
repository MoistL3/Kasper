const express = require('express');
const profile_controller = require('../controllers/profile-controller.js');
const { protect } = require('../middlewares/auth-middleware.js');
const { avatar_upload } = require('../middlewares/upload-middleware.js');

const router = express.Router();

router.use(protect); // كل الـ profile routes محمية

router.get('/me', profile_controller.get_my_profile);
router.patch('/me', profile_controller.update_my_profile);
router.put('/me/avatar', avatar_upload, profile_controller.set_my_avatar);
router.delete('/me/avatar', profile_controller.remove_my_avatar);

module.exports = router;