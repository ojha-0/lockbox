const { prisma } = require('../utils/prisma');

// Authenticates third-party API consumers via x-client-id / x-client-secret
// headers. Plain-text comparison — college demo, no hashing.
const kycAuth = async (req, res, next) => {
  try {
    const clientId = req.headers['x-client-id'];
    const clientSecret = req.headers['x-client-secret'];
    if (!clientId || !clientSecret) {
      return res.status(401).json({ error: 'Client credentials required' });
    }
    const thirdParty = await prisma.thirdParty.findUnique({ where: { clientId } });
    if (!thirdParty || thirdParty.clientSecret !== clientSecret) {
      return res.status(401).json({ error: 'Invalid client credentials' });
    }
    if (!thirdParty.isActive) {
      return res.status(401).json({ error: 'Third party is inactive' });
    }
    req.thirdParty = thirdParty;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { kycAuth };
