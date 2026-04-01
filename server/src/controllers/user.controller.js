const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { prisma } = require('../utils/prisma');
const { logActivity } = require('../utils/activityLogger');
const { shapeUser, fullName } = require('../utils/userShape');

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  role: true,
  profileStatus: true,
  profilePicture: true,
  createdAt: true,
  lastLoginAt: true,
};

const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: USER_SELECT,
    });
    res.json({ user: shapeUser(user) });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const body = req.body || {};
    const data = {};

    // Prefer explicit firstName/lastName. Fall back to splitting a single name
    // field for any clients that still post it.
    const firstNameRaw = typeof body.firstName === 'string' ? body.firstName.trim() : undefined;
    const lastNameRaw  = typeof body.lastName  === 'string' ? body.lastName.trim()  : undefined;

    if (firstNameRaw !== undefined) {
      if (!firstNameRaw || firstNameRaw.length < 1 || firstNameRaw.length > 100) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'First name must be 1-100 characters' });
      }
      data.firstName = firstNameRaw;
    }
    if (lastNameRaw !== undefined) {
      data.lastName = lastNameRaw || null;
    }

    if (firstNameRaw === undefined && typeof body.name === 'string') {
      const name = body.name.trim();
      if (!name || name.length < 2 || name.length > 100) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Name must be 2-100 characters' });
      }
      const parts = name.split(/\s+/);
      data.firstName = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0];
      data.lastName  = parts.length > 1 ? parts[parts.length - 1] : null;
    }

    if (req.file) {
      // Build a publicly servable URL (uploads are served under /uploads)
      data.profilePicture = `/uploads/avatars/${req.file.filename}`;

      // Remove any previously stored avatar file to avoid clutter
      const prev = req.user.profilePicture;
      if (prev && prev.startsWith('/uploads/avatars/')) {
        const prevPath = path.join(
          __dirname,
          '..',
          '..',
          process.env.UPLOAD_DIR || 'uploads',
          'avatars',
          path.basename(prev)
        );
        if (fs.existsSync(prevPath)) {
          try { fs.unlinkSync(prevPath); } catch { /* ignore */ }
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No profile fields to update' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: USER_SELECT,
    });

    await logActivity({
      actorUserId: user.id,
      targetUserId: user.id,
      action: 'PROFILE_UPDATE',
      entityType: 'USER',
      description: `${fullName(user.firstName, user.lastName)} updated their profile`,
    });

    res.json({ user: shapeUser(user) });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch { /* ignore */ }
    }
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const valid = await bcrypt.compare(currentPassword, req.user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });

    await logActivity({
      actorUserId: req.user.id,
      targetUserId: req.user.id,
      action: 'PASSWORD_CHANGE',
      entityType: 'USER',
      description: `${fullName(req.user.firstName, req.user.lastName)} changed their password`,
    });

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

// ── Personal Details ─────────────────────────────────────────

const PERSONAL_FIELDS = [
  'gender', 'dateOfBirthAD', 'dobBS', 'bloodGroup',
  'birthAddress', 'permanentAddress', 'temporaryAddress',
  'citizenshipNumber', 'citizenshipType', 'citizenshipIssuingDistrict',
  'citizenshipIssueDate', 'citizenshipIssuingOfficer',
  'passportNumber', 'nationality', 'passportIssueDate', 'passportExpiryDate',
  'nin',
  'dlLicenseNumber', 'dlCategory', 'dlIssueDate', 'dlExpiryDate', 'dlLicenseOffice',
  'panNumber', 'panRegisteredOffice',
];

const pickPersonal = (body) => {
  const out = {};
  for (const k of PERSONAL_FIELDS) {
    if (k in body) {
      const v = body[k];
      if (v == null || v === '') out[k] = null;
      else if (typeof v === 'string') out[k] = v.trim().slice(0, 500) || null;
      else out[k] = String(v);
    }
  }
  return out;
};

const getPersonalDetails = async (req, res, next) => {
  try {
    const details = await prisma.userPersonalDetails.findUnique({
      where: { userId: req.user.id },
    });
    res.json({ personalDetails: details || null });
  } catch (err) {
    next(err);
  }
};

const upsertPersonalDetails = async (req, res, next) => {
  try {
    const data = pickPersonal(req.body || {});
    const details = await prisma.userPersonalDetails.upsert({
      where: { userId: req.user.id },
      create: { userId: req.user.id, ...data },
      update: data,
    });
    res.json({ personalDetails: details });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getPersonalDetails,
  upsertPersonalDetails,
};
