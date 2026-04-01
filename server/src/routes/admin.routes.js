const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const {
  getUsers,
  getUserById,
  updateUserStatus,
  getDocuments,
  getDocumentById,
  approveDocument,
  declineDocument,
  adminDownloadDocument,
  getDashboardStats,
  getActivityLogs,
  verifyPersonalDetails,
  declinePersonalDetails,
  getVerificationQueue,
} = require('../controllers/admin.controller');

router.use(authenticate, requireRole('ADMIN'));

router.get('/dashboard', getDashboardStats);
router.get('/activity-logs', getActivityLogs);
router.get('/verification-queue', getVerificationQueue);

router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/personal-details/verify', verifyPersonalDetails);
router.patch('/users/:id/personal-details/decline', declinePersonalDetails);

router.get('/documents', getDocuments);
router.get('/documents/:id', getDocumentById);
router.patch('/documents/:id/approve', approveDocument);
router.patch('/documents/:id/decline', declineDocument);
router.get('/documents/:id/download', adminDownloadDocument);

module.exports = router;
