const { prisma } = require('../utils/prisma');
const { fullName } = require('../utils/userShape');

// Normalize a phone number to compare "98-1234-5678" ≈ "+977 98 1234 5678".
function normalizePhone(p) {
  if (!p) return '';
  return String(p).replace(/[^\d]/g, '');
}

function normalizeName(n) {
  return String(n || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// Public verification endpoint — used by external systems that already have a
// name + phone they collected elsewhere and want to confirm the person is a
// LockBox user with at least one verified identity document.
const verifyUser = async (req, res, next) => {
  try {
    const { firstName, lastName, phone } = req.body || {};
    const queriedFirstName = (firstName || '').trim();
    const queriedLastName = (lastName || '').trim();
    const queriedPhone = (phone || '').trim();

    if (!queriedFirstName || !queriedLastName || !queriedPhone) {
      return res.status(400).json({ error: '`firstName`, `lastName`, and `phone` are required' });
    }

    const queriedName = `${queriedFirstName} ${queriedLastName}`;
    const normPhone = normalizePhone(queriedPhone);
    const normFirst = normalizeName(queriedFirstName);
    const normLast = normalizeName(queriedLastName);

    // Match all USER accounts whose stored phone normalizes to the same digits.
    // Phone index on DB is on raw text, so we do a broad pull (capped) and
    // filter in-memory. This is fine at the scale this endpoint is used.
    const candidates = await prisma.user.findMany({
      where: {
        role: 'USER',
        phone: { not: null },
      },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        documents: {
          where: { verificationStatus: 'VERIFIED' },
          select: { id: true, verifiedAt: true },
          orderBy: { verifiedAt: 'asc' },
          take: 1,
        },
      },
      take: 200,
    });

    const match = candidates.find(u =>
      normalizePhone(u.phone) === normPhone &&
      normalizeName(u.firstName) === normFirst &&
      normalizeName(u.lastName) === normLast
    );

    const verified = !!(match && match.documents.length > 0);

    await prisma.orgVerification.create({
      data: {
        orgUserId: req.organization.id,
        subjectUserId: match?.id ?? null,
        queriedName,
        queriedPhone,
        verified,
      },
    });

    if (!verified) {
      return res.json({ verified: false });
    }

    res.json({
      verified: true,
      user: {
        firstName: match.firstName,
        lastName: match.lastName,
        name: fullName(match.firstName, match.lastName),
        email: match.email,
        phone: match.phone,
        documentVerifiedAt: match.documents[0]?.verifiedAt ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { verifyUser };
