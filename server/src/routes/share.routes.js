const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  lookupUser,
  shareDocument,
  getSharesReceived,
  getSharesSent,
  getShareDetail,
  requestFullAccess,
  respondFullAccess,
} = require('../controllers/share.controller');

router.use(authenticate);

router.get('/lookup', lookupUser);
router.post('/', shareDocument);
router.get('/received', getSharesReceived);
router.get('/sent', getSharesSent);
router.get('/:id', getShareDetail);
router.post('/:id/request-access', requestFullAccess);
router.post('/:id/respond', respondFullAccess);

module.exports = router;
