const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { uploadAvatar } = require('../middleware/avatarUpload.middleware');
const {
  getProfile,
  updateProfile,
  changePassword,
  getPersonalDetails,
  upsertPersonalDetails,
} = require('../controllers/user.controller');

router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', uploadAvatar.single('profilePicture'), updateProfile);
router.put('/change-password', changePassword);

router.get('/personal-details', getPersonalDetails);
router.put('/personal-details', upsertPersonalDetails);

module.exports = router;
