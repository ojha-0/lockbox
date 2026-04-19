const { prisma } = require('../utils/prisma');

// Authenticates external API callers by a header-provided API key. The key
// corresponds to a User row with role='ORGANIZATION'. On success the matched
// organization is attached to `req.organization` (distinct from `req.user`).
const authenticateApiKey = async (req, res, next) => {
  try {
    const headerKey = req.get('X-API-Key') || req.get('x-api-key');
    if (!headerKey) return res.status(401).json({ error: 'API key required (X-API-Key header)' });

    const org = await prisma.user.findUnique({ where: { apiKey: headerKey } });
    if (!org || org.role !== 'ORGANIZATION') {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    if (org.profileStatus === 'DISABLED') {
      return res.status(403).json({ error: 'Organization account has been disabled' });
    }

    req.organization = org;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticateApiKey };
