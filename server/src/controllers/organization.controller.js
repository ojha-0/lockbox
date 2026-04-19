const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { prisma } = require('../utils/prisma');
const { logActivity } = require('../utils/activityLogger');
const { generateApiKey } = require('../utils/apiKey');
const { shapeUser } = require('../utils/userShape');

// ─────────────────────────────────────────────────────────────
// Admin-facing: create + list + delete + rotate-key for organizations.
// Organizations are stored in the User table with role='ORGANIZATION'.
// The company name is held in `firstName` (so `shapeUser.name` surfaces it),
// the logo URL in `profilePicture`, and the plaintext API key in `apiKey`.
// ─────────────────────────────────────────────────────────────

const ORG_SELECT = {
  id: true, firstName: true, lastName: true, email: true, role: true,
  profileStatus: true, profilePicture: true, apiKey: true, apiKeyIssuedAt: true,
  createdAt: true, lastLoginAt: true,
};

function removeFileIfLocal(url) {
  if (!url || !url.startsWith('/uploads/')) return;
  const rel = url.replace(/^\/uploads\//, '');
  const full = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads', rel);
  if (fs.existsSync(full)) { try { fs.unlinkSync(full); } catch { /* ignore */ } }
}

const adminCreateOrganization = async (req, res, next) => {
  try {
    const { companyName, email, password } = req.body;
    if (!companyName || !email || !password) {
      if (req.file) removeFileIfLocal(`/uploads/avatars/${req.file.filename}`);
      return res.status(400).json({ error: 'Company name, email and password are required' });
    }
    if (password.length < 8) {
      if (req.file) removeFileIfLocal(`/uploads/avatars/${req.file.filename}`);
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (req.file) removeFileIfLocal(`/uploads/avatars/${req.file.filename}`);
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const apiKey = generateApiKey();
    const logoUrl = req.file ? `/uploads/avatars/${req.file.filename}` : null;

    const org = await prisma.user.create({
      data: {
        firstName: companyName.trim(),
        email,
        passwordHash,
        role: 'ORGANIZATION',
        profilePicture: logoUrl,
        apiKey,
        apiKeyIssuedAt: new Date(),
      },
      select: ORG_SELECT,
    });

    await logActivity({
      actorUserId: req.user.id,
      targetUserId: org.id,
      action: 'ORG_CREATED',
      entityType: 'USER',
      description: `Admin created organization "${org.firstName}" (${org.email})`,
    });

    res.status(201).json({ organization: shapeUser(org) });
  } catch (err) {
    if (req.file) removeFileIfLocal(`/uploads/avatars/${req.file.filename}`);
    next(err);
  }
};

const adminListOrganizations = async (req, res, next) => {
  try {
    const orgs = await prisma.user.findMany({
      where: { role: 'ORGANIZATION' },
      orderBy: { createdAt: 'desc' },
      select: {
        ...ORG_SELECT,
        _count: { select: { orgVerificationsIssued: true } },
      },
    });
    res.json({ organizations: orgs.map(shapeUser) });
  } catch (err) {
    next(err);
  }
};

const adminRotateOrgApiKey = async (req, res, next) => {
  try {
    const org = await prisma.user.findFirst({
      where: { id: req.params.id, role: 'ORGANIZATION' },
    });
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    const apiKey = generateApiKey();
    const updated = await prisma.user.update({
      where: { id: org.id },
      data: { apiKey, apiKeyIssuedAt: new Date() },
      select: ORG_SELECT,
    });

    await logActivity({
      actorUserId: req.user.id,
      targetUserId: org.id,
      action: 'ORG_API_KEY_ROTATED',
      entityType: 'USER',
      description: `Admin rotated API key for organization "${org.firstName}"`,
    });

    res.json({ organization: shapeUser(updated) });
  } catch (err) {
    next(err);
  }
};

const adminDeleteOrganization = async (req, res, next) => {
  try {
    const org = await prisma.user.findFirst({
      where: { id: req.params.id, role: 'ORGANIZATION' },
    });
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    removeFileIfLocal(org.profilePicture);
    await prisma.user.delete({ where: { id: org.id } });

    await logActivity({
      actorUserId: req.user.id,
      action: 'ORG_DELETED',
      entityType: 'USER',
      description: `Admin deleted organization "${org.firstName}" (${org.email})`,
    });

    res.json({ message: 'Organization deleted' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// Organization-facing: dashboard profile, API key view/rotate, verification log.
// ─────────────────────────────────────────────────────────────

const getMyOrganization = async (req, res) => {
  const org = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      ...ORG_SELECT,
      _count: { select: { orgVerificationsIssued: true } },
    },
  });
  res.json({ organization: shapeUser(org) });
};

const rotateMyApiKey = async (req, res, next) => {
  try {
    const apiKey = generateApiKey();
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { apiKey, apiKeyIssuedAt: new Date() },
      select: ORG_SELECT,
    });
    await logActivity({
      actorUserId: req.user.id,
      targetUserId: req.user.id,
      action: 'ORG_API_KEY_ROTATED',
      entityType: 'USER',
      description: `Organization "${req.user.firstName}" rotated their API key`,
    });
    res.json({ organization: shapeUser(updated) });
  } catch (err) {
    next(err);
  }
};

const listMyVerifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [rows, total] = await Promise.all([
      prisma.orgVerification.findMany({
        where: { orgUserId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          subjectUser: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
        },
      }),
      prisma.orgVerification.count({ where: { orgUserId: req.user.id } }),
    ]);

    const shaped = rows.map(r => ({
      id: r.id,
      queriedName: r.queriedName,
      queriedPhone: r.queriedPhone,
      verified: r.verified,
      createdAt: r.createdAt,
      subjectUser: r.subjectUser ? shapeUser(r.subjectUser) : null,
    }));

    res.json({ verifications: shaped, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  adminCreateOrganization,
  adminListOrganizations,
  adminRotateOrgApiKey,
  adminDeleteOrganization,
  getMyOrganization,
  rotateMyApiKey,
  listMyVerifications,
};
