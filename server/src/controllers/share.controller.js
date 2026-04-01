const { prisma } = require('../utils/prisma');
const { logActivity } = require('../utils/activityLogger');
const { shapeUser, shapeNested, shapeNestedMany, fullName } = require('../utils/userShape');

const DOC_TYPE_LABELS = {
  passport: 'Passport',
  national_id: 'National ID',
  citizenship_front: 'Citizenship Certificate',
  citizenship_back: 'Citizenship Certificate',
  drivers_license: "Driver's License",
  pan_card: 'PAN Card',
};

const USER_LIST_SELECT = { id: true, firstName: true, lastName: true, email: true };
const USER_CONTACT_SELECT = { id: true, firstName: true, lastName: true, email: true, phone: true };

// Which personal-detail fields to expose for each documentType, and which one
// is the document's own number (the only field that stays masked until full
// access is granted).
const SHARE_FIELDS = {
  passport: {
    numberField: 'passportNumber',
    fields: [
      'gender', 'dateOfBirthAD', 'dobBS', 'bloodGroup',
      'birthAddress', 'permanentAddress', 'temporaryAddress',
      'nationality', 'passportIssueDate', 'passportExpiryDate',
      'passportNumber',
    ],
  },
  national_id: {
    numberField: 'nin',
    fields: [
      'gender', 'dateOfBirthAD', 'dobBS', 'bloodGroup',
      'birthAddress', 'permanentAddress', 'temporaryAddress',
      'nin',
    ],
  },
  citizenship_front: {
    numberField: 'citizenshipNumber',
    fields: [
      'gender', 'dateOfBirthAD', 'dobBS', 'bloodGroup',
      'birthAddress', 'permanentAddress', 'temporaryAddress',
      'citizenshipType', 'citizenshipIssuingDistrict',
      'citizenshipIssueDate', 'citizenshipIssuingOfficer',
      'citizenshipNumber',
    ],
  },
  citizenship_back: {
    numberField: 'citizenshipNumber',
    fields: [
      'gender', 'dateOfBirthAD', 'dobBS', 'bloodGroup',
      'birthAddress', 'permanentAddress', 'temporaryAddress',
      'citizenshipType', 'citizenshipIssuingDistrict',
      'citizenshipIssueDate', 'citizenshipIssuingOfficer',
      'citizenshipNumber',
    ],
  },
  drivers_license: {
    numberField: 'dlLicenseNumber',
    fields: [
      'gender', 'dateOfBirthAD', 'dobBS', 'bloodGroup',
      'birthAddress', 'permanentAddress', 'temporaryAddress',
      'dlCategory', 'dlIssueDate', 'dlExpiryDate', 'dlLicenseOffice',
      'dlLicenseNumber',
    ],
  },
  pan_card: {
    numberField: 'panNumber',
    fields: [
      'gender', 'dateOfBirthAD', 'dobBS',
      'birthAddress', 'permanentAddress', 'temporaryAddress',
      'panRegisteredOffice', 'panNumber',
    ],
  },
};

const maskNumber = (n) => {
  if (!n) return null;
  const clean = String(n).replace(/\s/g, '');
  if (clean.length <= 4) return '****';
  return `****${clean.slice(-4)}`;
};

const buildSharedPayload = (share, senderDetails, { granted }) => {
  const spec = SHARE_FIELDS[share.documentType];
  const personal = {};
  if (spec && senderDetails) {
    for (const f of spec.fields) {
      if (f === spec.numberField) {
        personal[f] = granted
          ? (senderDetails[f] ?? null)
          : maskNumber(senderDetails[f]);
      } else {
        personal[f] = senderDetails[f] ?? null;
      }
    }
  }
  return {
    numberField: spec ? spec.numberField : null,
    personal,
    documentLabel: DOC_TYPE_LABELS[share.documentType] || share.documentType,
  };
};

const lookupUser = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'email is required' });
    if (email.toLowerCase() === req.user.email.toLowerCase()) {
      return res.status(400).json({ error: 'You cannot share with yourself' });
    }
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: USER_LIST_SELECT,
    });
    if (!user) return res.status(404).json({ error: 'No LockBox user found with that email' });
    res.json({ user: shapeUser(user) });
  } catch (err) {
    next(err);
  }
};

const shareDocument = async (req, res, next) => {
  try {
    const { documentType, maskedNumber, toEmail } = req.body;
    if (!documentType || !maskedNumber || !toEmail) {
      return res.status(400).json({ error: 'documentType, maskedNumber, and toEmail are required' });
    }
    if (toEmail.toLowerCase() === req.user.email.toLowerCase()) {
      return res.status(400).json({ error: 'You cannot share with yourself' });
    }
    const toUser = await prisma.user.findUnique({
      where: { email: toEmail.toLowerCase() },
      select: USER_LIST_SELECT,
    });
    if (!toUser) return res.status(404).json({ error: 'No LockBox user found with that email' });

    const share = await prisma.documentShare.create({
      data: { fromUserId: req.user.id, toUserId: toUser.id, documentType, maskedNumber },
    });

    const label = DOC_TYPE_LABELS[documentType] || documentType.replace(/_/g, ' ');
    await logActivity({
      actorUserId: req.user.id,
      targetUserId: toUser.id,
      action: 'DOCUMENT_SHARED',
      entityType: 'DOCUMENT',
      description: `${fullName(req.user.firstName, req.user.lastName)} shared ${label} number (${maskedNumber}) with ${fullName(toUser.firstName, toUser.lastName)}`,
      metadata: { documentType, maskedNumber, toEmail: toUser.email },
    });

    const toUserShaped = shapeUser(toUser);
    res.status(201).json({ share, toUser: { name: toUserShaped.name, email: toUser.email } });
  } catch (err) {
    next(err);
  }
};

const getSharesReceived = async (req, res, next) => {
  try {
    const shares = await prisma.documentShare.findMany({
      where: { toUserId: req.user.id },
      orderBy: { sharedAt: 'desc' },
      include: { fromUser: { select: USER_LIST_SELECT } },
    });
    res.json({ shares: shapeNestedMany(shares) });
  } catch (err) {
    next(err);
  }
};

const getSharesSent = async (req, res, next) => {
  try {
    const shares = await prisma.documentShare.findMany({
      where: { fromUserId: req.user.id },
      orderBy: { sharedAt: 'desc' },
      include: { toUser: { select: USER_LIST_SELECT } },
    });
    res.json({ shares: shapeNestedMany(shares) });
  } catch (err) {
    next(err);
  }
};

// Recipient view: sender's personal details for this documentType,
// document number masked unless full access has been granted.
const getShareDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const share = await prisma.documentShare.findUnique({
      where: { id },
      include: {
        fromUser: { select: USER_CONTACT_SELECT },
        toUser: { select: USER_LIST_SELECT },
      },
    });
    if (!share) return res.status(404).json({ error: 'Share not found' });

    const isRecipient = share.toUserId === req.user.id;
    const isSender = share.fromUserId === req.user.id;
    if (!isRecipient && !isSender) return res.status(403).json({ error: 'Not allowed' });

    const senderDetails = await prisma.userPersonalDetails.findUnique({
      where: { userId: share.fromUserId },
    });

    const granted = share.fullAccessStatus === 'GRANTED';
    const payload = buildSharedPayload(share, senderDetails, { granted });

    res.json({
      share: shapeNested(share),
      fromUser: shapeUser(share.fromUser),
      toUser: shapeUser(share.toUser),
      ...payload,
      granted,
      viewerRole: isRecipient ? 'RECIPIENT' : 'SENDER',
    });
  } catch (err) {
    next(err);
  }
};

const requestFullAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const share = await prisma.documentShare.findUnique({
      where: { id },
      include: { fromUser: { select: USER_LIST_SELECT } },
    });
    if (!share) return res.status(404).json({ error: 'Share not found' });
    if (share.toUserId !== req.user.id) return res.status(403).json({ error: 'Not allowed' });
    if (share.fullAccessStatus === 'GRANTED') {
      return res.status(400).json({ error: 'Full access already granted' });
    }
    if (share.fullAccessStatus === 'PENDING') {
      return res.status(400).json({ error: 'Request already pending' });
    }

    const updated = await prisma.documentShare.update({
      where: { id },
      data: {
        fullAccessStatus: 'PENDING',
        fullAccessRequestedAt: new Date(),
        fullAccessRespondedAt: null,
      },
    });

    const label = DOC_TYPE_LABELS[share.documentType] || share.documentType;
    await logActivity({
      actorUserId: req.user.id,
      targetUserId: share.fromUserId,
      action: 'SHARE_ACCESS_REQUESTED',
      entityType: 'DOCUMENT',
      description: `${fullName(req.user.firstName, req.user.lastName)} requested full ${label} access from ${fullName(share.fromUser.firstName, share.fromUser.lastName)}`,
      metadata: { shareId: id, documentType: share.documentType },
    });

    res.json({ share: updated });
  } catch (err) {
    next(err);
  }
};

const respondFullAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision } = req.body || {};
    if (!['GRANT', 'DENY'].includes(decision)) {
      return res.status(400).json({ error: 'decision must be GRANT or DENY' });
    }
    const share = await prisma.documentShare.findUnique({
      where: { id },
      include: { toUser: { select: USER_LIST_SELECT } },
    });
    if (!share) return res.status(404).json({ error: 'Share not found' });
    if (share.fromUserId !== req.user.id) return res.status(403).json({ error: 'Not allowed' });
    if (share.fullAccessStatus !== 'PENDING' && decision === 'GRANT' && share.fullAccessStatus === 'GRANTED') {
      return res.status(400).json({ error: 'Already granted' });
    }

    const status = decision === 'GRANT' ? 'GRANTED' : 'DENIED';
    const updated = await prisma.documentShare.update({
      where: { id },
      data: {
        fullAccessStatus: status,
        fullAccessRespondedAt: new Date(),
      },
    });

    const label = DOC_TYPE_LABELS[share.documentType] || share.documentType;
    await logActivity({
      actorUserId: req.user.id,
      targetUserId: share.toUserId,
      action: decision === 'GRANT' ? 'SHARE_ACCESS_GRANTED' : 'SHARE_ACCESS_DENIED',
      entityType: 'DOCUMENT',
      description: `${fullName(req.user.firstName, req.user.lastName)} ${decision === 'GRANT' ? 'granted' : 'denied'} full ${label} access to ${fullName(share.toUser.firstName, share.toUser.lastName)}`,
      metadata: { shareId: id, documentType: share.documentType },
    });

    res.json({ share: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  lookupUser,
  shareDocument,
  getSharesReceived,
  getSharesSent,
  getShareDetail,
  requestFullAccess,
  respondFullAccess,
};
