const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { prisma } = require('../utils/prisma');
const { generateAccessToken, generateRefreshToken, storeRefreshToken, verifyRefreshToken, revokeRefreshToken, revokeAllUserTokens, hashToken } = require('../utils/jwt');
const { logActivity } = require('../utils/activityLogger');
const { sendPasswordResetEmail } = require('../utils/email');
const { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validators/auth.validators');
const { shapeUser, fullName } = require('../utils/userShape');

const signup = async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    if (data.phone) {
      const phoneExists = await prisma.user.findUnique({ where: { phone: data.phone } });
      if (phoneExists) return res.status(409).json({ error: 'Phone number already registered' });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName || null,
        email: data.email,
        passwordHash,
        ...(data.phone && { phone: data.phone }),
      },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        role: true, profileStatus: true, createdAt: true,
      },
    });

    await logActivity({
      actorUserId: user.id,
      targetUserId: user.id,
      action: 'SIGNUP',
      entityType: 'USER',
      description: `${fullName(user.firstName, user.lastName)} created an account`,
    });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken();
    await storeRefreshToken(user.id, refreshToken);

    res.status(201).json({ user: shapeUser(user), accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = data.email
      ? await prisma.user.findUnique({ where: { email: data.email } })
      : await prisma.user.findUnique({ where: { phone: data.phone } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.profileStatus === 'DISABLED') {
      return res.status(403).json({ error: 'Your account has been disabled. Please contact support.' });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    await logActivity({
      actorUserId: user.id,
      targetUserId: user.id,
      action: 'LOGIN',
      entityType: 'USER',
      description: `${fullName(user.firstName, user.lastName)} logged in`,
    });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken();
    await storeRefreshToken(user.id, refreshToken);

    const { passwordHash, ...userOut } = user;
    res.json({ user: shapeUser(userOut), accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const record = await verifyRefreshToken(refreshToken);
    if (!record) return res.status(401).json({ error: 'Invalid or expired refresh token' });

    const user = await prisma.user.findUnique({ where: { id: record.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    if (user.profileStatus === 'DISABLED') {
      return res.status(403).json({ error: 'Your account has been disabled. Please contact support.' });
    }

    // Rotate token
    await revokeRefreshToken(refreshToken);
    const newRefreshToken = generateRefreshToken();
    await storeRefreshToken(user.id, newRefreshToken);
    const accessToken = generateAccessToken(user.id, user.role);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await revokeRefreshToken(refreshToken);

    if (req.user) {
      await logActivity({
        actorUserId: req.user.id,
        targetUserId: req.user.id,
        action: 'LOGOUT',
        entityType: 'USER',
        description: `${fullName(req.user.firstName, req.user.lastName)} logged out`,
      });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond success to prevent email enumeration
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordReset.create({ data: { userId: user.id, token, expiresAt } });

      const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
      await sendPasswordResetEmail(user.email, fullName(user.firstName, user.lastName), resetUrl);

      await logActivity({
        actorUserId: user.id,
        targetUserId: user.id,
        action: 'FORGOT_PASSWORD',
        entityType: 'USER',
        description: `Password reset requested for ${user.email}`,
      });
    }

    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);
    const record = await prisma.passwordReset.findUnique({ where: { token } });

    if (!record || record.used || record.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: record.userId }, data: { passwordHash } });
    await prisma.passwordReset.update({ where: { token }, data: { used: true } });
    await revokeAllUserTokens(record.userId);

    await logActivity({
      actorUserId: record.userId,
      targetUserId: record.userId,
      action: 'RESET_PASSWORD',
      entityType: 'USER',
      description: 'Password was reset successfully',
    });

    res.json({ message: 'Password reset successfully. Please log in.' });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res) => {
  const { passwordHash, ...user } = req.user;
  res.json({ user: shapeUser(user) });
};

module.exports = { signup, login, refresh, logout, forgotPassword, resetPassword, getMe };
