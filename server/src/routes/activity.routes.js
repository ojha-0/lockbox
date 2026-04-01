const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getMyActivity } = require('../controllers/activity.controller');

router.get('/me', authenticate, getMyActivity);

module.exports = router;
