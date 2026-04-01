const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getMyDashboard } = require('../controllers/dashboard.controller');

router.get('/me', authenticate, getMyDashboard);

module.exports = router;
