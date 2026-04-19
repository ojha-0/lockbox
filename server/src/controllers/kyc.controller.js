const cuid = require('cuid');
const { prisma } = require('../utils/prisma');
const { shapeUser } = require('../utils/userShape');
const { maskPhone, maskDocumentNumber } = require('../utils/mask');
const { sendConsentRequestEmail } = require('../utils/kycEmail');
const {
  registerSchema,
  requestSchema,
  revokeSchema,
  approveSchema,
} = require('../validators/kyc.validators');

// Hardcoded OTP for college-demo consent approval.
const DEMO_OTP = '1234';

// Same labels as user-to-user share flow.
const DOC_TYPE_LABELS = {
  passport: 'Passport',
  national_id: 'National ID',
  citizenship_front: 'Citizenship Certificate',
  drivers_license: "Driver's License",
};

// Mirrors the per-documentType field set used by the user-to-user share flow,
// so third parties receive the same shape (with masking applied here).
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
  drivers_license: {
    numberField: 'dlLicenseNumber',
    fields: [
      'gender', 'dateOfBirthAD', 'dobBS', 'bloodGroup',
      'birthAddress', 'permanentAddress', 'temporaryAddress',
      'dlCategory', 'dlIssueDate', 'dlExpiryDate', 'dlLicenseOffice',
      'dlLicenseNumber',
    ],
  },
};

// External scope value → internal documentType key.
const SCOPE_TO_DOC_TYPE = {
  identity: 'national_id',
  citizenship: 'citizenship_front',
  passport: 'passport',
  license: 'drivers_license',
};

const buildScopePayload = (scope, personalDetails) => {
  return scope.map((s) => {
    const docType = SCOPE_TO_DOC_TYPE[s];
    const spec = SHARE_FIELDS[docType];
    const personal = {};
    if (spec && personalDetails) {
      for (const f of spec.fields) {
        personal[f] = f === spec.numberField
          ? maskDocumentNumber(personalDetails[f])
          : (personalDetails[f] ?? null);
      }
    }
    return {
      scope: s,
      documentType: docType,
      documentLabel: DOC_TYPE_LABELS[docType] || docType,
      numberField: spec ? spec.numberField : null,
      personal,
    };
  });
};

const buildUserPayload = (user) => {
  const shaped = shapeUser(user);
  return {
    id: user.id,
    name: shaped.name,
    email: user.email,
    phone: maskPhone(user.phone),
  };
};

// POST /register — admin only
const registerThirdParty = async (req, res, next) => {
  try {
    const { name, webhookUrl } = registerSchema.parse(req.body);
    const clientId = cuid();
    const clientSecret = Math.random().toString(36).slice(2);
    const tp = await prisma.thirdParty.create({
      data: {
        name,
        clientId,
        clientSecret,
        webhookUrl: webhookUrl || null,
      },
    });
    res.status(201).json({
      id: tp.id,
      name: tp.name,
      clientId: tp.clientId,
      clientSecret: tp.clientSecret,
      webhookUrl: tp.webhookUrl,
      isActive: tp.isActive,
      createdAt: tp.createdAt,
    });
  } catch (err) {
    next(err);
  }
};

// POST /request — third party initiates a consent request
const createConsentRequest = async (req, res, next) => {
  try {
    const { userEmail, scope } = requestSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: userEmail.toLowerCase() },
    });
    if (!user) return res.status(404).json({ error: 'No LockBox user found with that email' });

    const consentToken = cuid();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    const consent = await prisma.consentRequest.create({
      data: {
        thirdPartyId: req.thirdParty.id,
        userId: user.id,
        scope,
        consentToken,
        expiresAt,
      },
    });

    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const consentUrl = `${baseUrl}/consent/${consentToken}`;
    try {
      await sendConsentRequestEmail(
        user.email,
        user.firstName,
        req.thirdParty.name,
        scope,
        consentUrl,
      );
    } catch (mailErr) {
      // Don't fail the request if email transport is misconfigured in dev.
      console.error('sendConsentRequestEmail failed:', mailErr.message);
    }

    res.status(201).json({ requestId: consent.id });
  } catch (err) {
    next(err);
  }
};

// GET /consent/:token — user previews what will be shared
const getConsent = async (req, res, next) => {
  try {
    const { token } = req.params;
    const consent = await prisma.consentRequest.findUnique({
      where: { consentToken: token },
      include: { thirdParty: true },
    });
    if (!consent) return res.status(404).json({ error: 'Consent request not found' });
    if (consent.userId !== req.user.id) return res.status(403).json({ error: 'Not allowed' });
    if (consent.expiresAt.getTime() < Date.now()) {
      return res.status(410).json({ error: 'Consent request has expired' });
    }
    if (consent.status !== 'PENDING') {
      return res.status(400).json({ error: `Consent request is already ${consent.status.toLowerCase()}` });
    }

    const personalDetails = await prisma.userPersonalDetails.findUnique({
      where: { userId: consent.userId },
    });
    const documents = buildScopePayload(consent.scope, personalDetails);

    res.json({
      thirdParty: { name: consent.thirdParty.name },
      scope: consent.scope,
      expiresAt: consent.expiresAt,
      preview: {
        user: buildUserPayload(req.user),
        documents,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /consent/:token/approve — user approves with OTP (hardcoded "1234")
const approveConsent = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { otp } = approveSchema.parse(req.body);
    if (otp !== DEMO_OTP) return res.status(400).json({ error: 'Invalid OTP' });

    const consent = await prisma.consentRequest.findUnique({
      where: { consentToken: token },
    });
    if (!consent) return res.status(404).json({ error: 'Consent request not found' });
    if (consent.userId !== req.user.id) return res.status(403).json({ error: 'Not allowed' });
    if (consent.expiresAt.getTime() < Date.now()) {
      return res.status(410).json({ error: 'Consent request has expired' });
    }
    if (consent.status !== 'PENDING') {
      return res.status(400).json({ error: `Consent request is already ${consent.status.toLowerCase()}` });
    }

    const accessToken = cuid();
    const accessExpiry = new Date(Date.now() + 60 * 60 * 1000); // 60 min
    await prisma.consentRequest.update({
      where: { id: consent.id },
      data: { status: 'APPROVED', accessToken, accessExpiry },
    });

    res.json({ message: 'Approved' });
  } catch (err) {
    next(err);
  }
};

// POST /consent/:token/deny
const denyConsent = async (req, res, next) => {
  try {
    const { token } = req.params;
    const consent = await prisma.consentRequest.findUnique({
      where: { consentToken: token },
    });
    if (!consent) return res.status(404).json({ error: 'Consent request not found' });
    if (consent.userId !== req.user.id) return res.status(403).json({ error: 'Not allowed' });
    if (consent.status !== 'PENDING') {
      return res.status(400).json({ error: `Consent request is already ${consent.status.toLowerCase()}` });
    }

    await prisma.consentRequest.update({
      where: { id: consent.id },
      data: { status: 'DENIED' },
    });

    res.json({ message: 'Denied' });
  } catch (err) {
    next(err);
  }
};

// GET /data/:accessToken — third party fetches the shared data (one-shot)
const getData = async (req, res, next) => {
  try {
    const { accessToken } = req.params;
    const consent = await prisma.consentRequest.findUnique({
      where: { accessToken },
      include: { user: true },
    });
    if (!consent) return res.status(404).json({ error: 'Invalid access token' });
    if (consent.thirdPartyId !== req.thirdParty.id) {
      return res.status(403).json({ error: 'Access token does not belong to this third party' });
    }
    if (consent.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Consent is not approved' });
    }
    if (!consent.accessExpiry || consent.accessExpiry.getTime() < Date.now()) {
      return res.status(410).json({ error: 'Access token has expired' });
    }

    const personalDetails = await prisma.userPersonalDetails.findUnique({
      where: { userId: consent.userId },
    });
    const documents = buildScopePayload(consent.scope, personalDetails);

    // Invalidate token after successful fetch (one-shot).
    await prisma.consentRequest.update({
      where: { id: consent.id },
      data: { accessToken: null, accessExpiry: null },
    });

    res.json({
      user: buildUserPayload(consent.user),
      scope: consent.scope,
      documents,
    });
  } catch (err) {
    next(err);
  }
};

// POST /revoke — user revokes a previously approved consent
const revokeConsent = async (req, res, next) => {
  try {
    const { accessToken } = revokeSchema.parse(req.body);
    const consent = await prisma.consentRequest.findUnique({
      where: { accessToken },
    });
    if (!consent || consent.userId !== req.user.id) {
      return res.status(404).json({ error: 'Consent not found' });
    }

    await prisma.consentRequest.update({
      where: { id: consent.id },
      data: { status: 'REVOKED', accessToken: null },
    });

    res.json({ message: 'Revoked' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerThirdParty,
  createConsentRequest,
  getConsent,
  approveConsent,
  denyConsent,
  getData,
  revokeConsent,
};
