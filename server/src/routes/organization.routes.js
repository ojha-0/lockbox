const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const {
  getMyOrganization,
  rotateMyApiKey,
  listMyVerifications,
} = require('../controllers/organization.controller');

router.use(authenticate, requireRole('ORGANIZATION'));

router.get('/me', getMyOrganization);
router.post('/api-key/rotate', rotateMyApiKey);
router.get('/verifications', listMyVerifications);

module.exports = router;
