const { prisma } = require('../utils/prisma');
const { logActivity } = require('../utils/activityLogger');
const { shapeUser, shapeNested, shapeNestedMany, fullName } = require('../utils/userShape');

// ---- USER MANAGEMENT ----

const USER_NAME_SELECT = { id: true, firstName: true, lastName: true };
const USER_LIST_SELECT = { ...USER_NAME_SELECT, email: true };

const getUsers = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName:  { contains: search, mode: 'insensitive' } },
        { email:     { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.profileStatus = status;
    where.role = 'USER'; // Admins manage non-admin users

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, firstName: true, lastName: true, email: true, role: true,
          profileStatus: true, createdAt: true, lastLoginAt: true,
          _count: { select: { documents: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users: users.map(shapeUser), total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true, role: true,
        profileStatus: true, createdAt: true, lastLoginAt: true,
        _count: { select: { documents: true } },
        documents: {
          orderBy: { uploadedAt: 'desc' },
          select: {
            id: true, originalName: true, documentType: true, documentLabel: true,
            verificationStatus: true, uploadedAt: true, mimeType: true, size: true,
            rejectionReasonText: true, reviewedAt: true, verifiedAt: true,
            reviewedBy: { select: USER_NAME_SELECT },
          },
        },
        personalDetails: {
          include: { verifiedBy: { select: USER_NAME_SELECT } },
        },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const shaped = shapeUser(user);
    if (shaped.personalDetails?.verifiedBy) {
      shaped.personalDetails = {
        ...shaped.personalDetails,
        verifiedBy: shapeUser(shaped.personalDetails.verifiedBy),
      };
    }
    res.json({ user: shaped });
  } catch (err) {
    next(err);
  }
};

const verifyPersonalDetails = async (req, res, next) => {
  try {
    const details = await prisma.userPersonalDetails.findUnique({
      where: { userId: req.params.id },
      include: { user: { select: USER_LIST_SELECT } },
    });
    if (!details) return res.status(404).json({ error: 'No personal details saved yet' });

    const updated = await prisma.userPersonalDetails.update({
      where: { userId: req.params.id },
      data: {
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedById: req.user.id,
        rejectionReasonText: null,
      },
    });

    await logActivity({
      actorUserId: req.user.id,
      targetUserId: req.params.id,
      action: 'PERSONAL_DETAILS_APPROVED',
      entityType: 'USER',
      description: `Admin ${fullName(req.user.firstName, req.user.lastName)} verified personal details of ${fullName(details.user.firstName, details.user.lastName)}`,
    });

    res.json({ personalDetails: updated });
  } catch (err) {
    next(err);
  }
};

const declinePersonalDetails = async (req, res, next) => {
  try {
    const { rejectionReasonText } = req.body || {};
    if (!rejectionReasonText || !rejectionReasonText.trim()) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    const details = await prisma.userPersonalDetails.findUnique({
      where: { userId: req.params.id },
      include: { user: { select: USER_LIST_SELECT } },
    });
    if (!details) return res.status(404).json({ error: 'No personal details saved yet' });

    const updated = await prisma.userPersonalDetails.update({
      where: { userId: req.params.id },
      data: {
        verificationStatus: 'DECLINED',
        verifiedAt: new Date(),
        verifiedById: req.user.id,
        rejectionReasonText: rejectionReasonText.trim(),
      },
    });

    await logActivity({
      actorUserId: req.user.id,
      targetUserId: req.params.id,
      action: 'PERSONAL_DETAILS_DECLINED',
      entityType: 'USER',
      description: `Admin ${fullName(req.user.firstName, req.user.lastName)} declined personal details of ${fullName(details.user.firstName, details.user.lastName)}: ${rejectionReasonText.trim()}`,
      metadata: { rejectionReasonText: rejectionReasonText.trim() },
    });

    res.json({ personalDetails: updated });
  } catch (err) {
    next(err);
  }
};

// Per-user verification queue: returns users sorted by outstanding work
// (pending docs + unverified personal details), with a breakdown summary.
const getVerificationQueue = async (req, res, next) => {
  try {
    const { search, filter = 'pending', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { role: 'USER' };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName:  { contains: search, mode: 'insensitive' } },
        { email:     { contains: search, mode: 'insensitive' } },
      ];
    }

    // When filtering for "pending" work, only return users that have at least
    // one pending document OR pending personal details.
    if (filter === 'pending') {
      where.OR = [
        ...(where.OR || []),
        { documents: { some: { verificationStatus: 'PENDING_VERIFICATION' } } },
        { personalDetails: { verificationStatus: 'PENDING_VERIFICATION' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, firstName: true, lastName: true, email: true,
          createdAt: true, lastLoginAt: true, profileStatus: true,
          documents: {
            select: { id: true, verificationStatus: true, uploadedAt: true },
          },
          personalDetails: {
            select: { verificationStatus: true, updatedAt: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const shaped = users.map(u => {
      const pending = u.documents.filter(d => d.verificationStatus === 'PENDING_VERIFICATION').length;
      const verified = u.documents.filter(d => d.verificationStatus === 'VERIFIED').length;
      const declined = u.documents.filter(d => d.verificationStatus === 'DECLINED').length;
      const lastUpload = u.documents
        .map(d => d.uploadedAt)
        .sort((a, b) => new Date(b) - new Date(a))[0] || null;
      const { documents, ...rest } = u;
      return {
        ...shapeUser(rest),
        docCounts: { pending, verified, declined, total: u.documents.length },
        lastUpload,
        personalDetailsStatus: u.personalDetails?.verificationStatus || null,
      };
    });

    res.json({ users: shaped, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'DISABLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be ACTIVE or DISABLED.' });
    }

    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.id === req.user.id) return res.status(400).json({ error: 'Cannot change your own status' });

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { profileStatus: status },
      select: { id: true, firstName: true, lastName: true, email: true, profileStatus: true },
    });

    const action = status === 'DISABLED' ? 'USER_DISABLED' : 'USER_ENABLED';
    await logActivity({
      actorUserId: req.user.id,
      targetUserId: target.id,
      action,
      entityType: 'USER',
      description: `Admin ${fullName(req.user.firstName, req.user.lastName)} ${status === 'DISABLED' ? 'disabled' : 'enabled'} account of ${fullName(target.firstName, target.lastName)}`,
    });

    res.json({ user: shapeUser(updated) });
  } catch (err) {
    next(err);
  }
};

// ---- DOCUMENT MANAGEMENT ----

const getDocuments = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.verificationStatus = status;
    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName:  { contains: search, mode: 'insensitive' } } },
        { user: { email:     { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { uploadedAt: 'desc' },
        include: {
          user: { select: USER_LIST_SELECT },
          reviewedBy: { select: USER_NAME_SELECT },
        },
      }),
      prisma.document.count({ where }),
    ]);

    res.json({ documents: shapeNestedMany(documents), total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

const getDocumentById = async (req, res, next) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: USER_LIST_SELECT },
        reviewedBy: { select: USER_NAME_SELECT },
      },
    });
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.json({ document: shapeNested(document) });
  } catch (err) {
    next(err);
  }
};

const approveDocument = async (req, res, next) => {
  try {
    const document = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!document) return res.status(404).json({ error: 'Document not found' });

    const updated = await prisma.document.update({
      where: { id: req.params.id },
      data: {
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        reviewedAt: new Date(),
        reviewedById: req.user.id,
        rejectionReasonCode: null,
        rejectionReasonText: null,
      },
      include: { user: { select: USER_LIST_SELECT } },
    });

    // Approving a user_photo promotes it to the user's profile picture so it
    // shows up in the sidebar avatar and anywhere else the user's photo is used.
    if (document.documentType === 'user_photo' && document.mimeType?.startsWith('image/')) {
      await prisma.user.update({
        where: { id: document.userId },
        data: { profilePicture: `/uploads/${document.fileName}` },
      });
    }

    await logActivity({
      actorUserId: req.user.id,
      targetUserId: document.userId,
      targetDocumentId: document.id,
      action: 'DOCUMENT_APPROVED',
      entityType: 'DOCUMENT',
      description: `Admin ${fullName(req.user.firstName, req.user.lastName)} approved document "${document.originalName}"`,
    });

    res.json({ document: shapeNested(updated) });
  } catch (err) {
    next(err);
  }
};

const VALID_REASON_CODES = [
  'DOCUMENT_UNREADABLE',
  'DOCUMENT_FORGED',
  'EXPIRED_DOCUMENT',
  'MISMATCHED_INFORMATION',
  'WRONG_DOCUMENT_TYPE',
  'MISSING_REQUIRED_INFORMATION',
  'CUSTOM',
];

const declineDocument = async (req, res, next) => {
  try {
    const { rejectionReasonCode, rejectionReasonText } = req.body;

    if (!rejectionReasonCode || !rejectionReasonText) {
      return res.status(400).json({ error: 'Rejection reason code and text are required' });
    }
    if (!VALID_REASON_CODES.includes(rejectionReasonCode)) {
      return res.status(400).json({ error: 'Invalid rejection reason code' });
    }

    const document = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!document) return res.status(404).json({ error: 'Document not found' });

    const updated = await prisma.document.update({
      where: { id: req.params.id },
      data: {
        verificationStatus: 'DECLINED',
        reviewedAt: new Date(),
        reviewedById: req.user.id,
        rejectionReasonCode,
        rejectionReasonText,
        verifiedAt: null,
      },
      include: { user: { select: USER_LIST_SELECT } },
    });

    // If a previously-approved user_photo is being reversed, drop it from the
    // user's avatar so they're not still showing a rejected image.
    if (document.documentType === 'user_photo') {
      const avatarUrl = `/uploads/${document.fileName}`;
      await prisma.user.updateMany({
        where: { id: document.userId, profilePicture: avatarUrl },
        data: { profilePicture: null },
      });
    }

    await logActivity({
      actorUserId: req.user.id,
      targetUserId: document.userId,
      targetDocumentId: document.id,
      action: 'DOCUMENT_DECLINED',
      entityType: 'DOCUMENT',
      description: `Admin ${fullName(req.user.firstName, req.user.lastName)} declined document "${document.originalName}": ${rejectionReasonText}`,
      metadata: { rejectionReasonCode, rejectionReasonText },
    });

    res.json({ document: shapeNested(updated) });
  } catch (err) {
    next(err);
  }
};

const adminDownloadDocument = async (req, res, next) => {
  try {
    const fs = require('fs');
    const document = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!document) return res.status(404).json({ error: 'Document not found' });

    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.download(document.filePath, document.originalName);
  } catch (err) {
    next(err);
  }
};

// ---- ADMIN DASHBOARD ----

const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      disabledUsers,
      pendingDocs,
      verifiedDocs,
      declinedDocs,
      recentUploads,
      recentActions,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'USER', profileStatus: 'ACTIVE' } }),
      prisma.user.count({ where: { role: 'USER', profileStatus: 'DISABLED' } }),
      prisma.document.count({ where: { verificationStatus: 'PENDING_VERIFICATION' } }),
      prisma.document.count({ where: { verificationStatus: 'VERIFIED' } }),
      prisma.document.count({ where: { verificationStatus: 'DECLINED' } }),
      prisma.document.findMany({
        orderBy: { uploadedAt: 'desc' },
        take: 5,
        include: { user: { select: USER_LIST_SELECT } },
      }),
      prisma.activityLog.findMany({
        where: {
          action: { in: ['DOCUMENT_APPROVED', 'DOCUMENT_DECLINED', 'USER_ENABLED', 'USER_DISABLED'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          actor: { select: USER_NAME_SELECT },
          targetUser: { select: USER_NAME_SELECT },
          targetDocument: { select: { id: true, originalName: true } },
        },
      }),
    ]);

    res.json({
      stats: { totalUsers, activeUsers, disabledUsers, pendingDocs, verifiedDocs, declinedDocs },
      recentUploads: shapeNestedMany(recentUploads),
      recentActions: shapeNestedMany(recentActions),
    });
  } catch (err) {
    next(err);
  }
};

const getActivityLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, action } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = action ? { action } : {};

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, firstName: true, lastName: true, email: true } },
          targetUser: { select: { id: true, firstName: true, lastName: true, email: true } },
          targetDocument: { select: { id: true, originalName: true } },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    res.json({ logs: shapeNestedMany(logs), total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
