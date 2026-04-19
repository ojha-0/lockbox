const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { kycAuth } = require('../middleware/kycAuth.middleware');
const {
  registerThirdParty,
  createConsentRequest,
  getConsent,
  approveConsent,
  denyConsent,
  getData,
  revokeConsent,
} = require('../controllers/kyc.controller');

// Admin: register a new third party
router.post('/register', authenticate, requireRole('ADMIN'), registerThirdParty);

// Third party: initiate a consent request for a user
router.post('/request', kycAuth, createConsentRequest);

// User: view a consent request
router.get('/consent/:token', authenticate, getConsent);

// User: approve or deny a consent request
router.post('/consent/:token/approve', authenticate, approveConsent);
router.post('/consent/:token/deny', authenticate, denyConsent);

// Third party: fetch shared data with the issued access token (one-shot)
router.get('/data/:accessToken', kycAuth, getData);

// User: revoke a previously approved consent
router.post('/revoke', authenticate, revokeConsent);

module.exports = router;
