const express = require('express');
const cors = require('cors');
const router = express.Router();
const { authenticateApiKey } = require('../middleware/apiKey.middleware');
const { verifyUser } = require('../controllers/verify.controller');

// Public verification API — callable from any origin. Auth is via X-API-Key
// (not cookies), so there's no CSRF risk from opening CORS here.
const publicCors = cors({ origin: '*', methods: ['POST', 'OPTIONS'], allowedHeaders: ['Content-Type', 'X-API-Key'] });
router.options('/user', publicCors);
router.post('/user', publicCors, authenticateApiKey, verifyUser);

module.exports = router;
