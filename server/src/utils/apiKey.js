const crypto = require('crypto');

// Format: `lbx_live_<32 url-safe chars>`. Recognizable prefix makes it easy to
// spot in logs and lets us future-proof environments (live/test) if ever
// needed.
function generateApiKey() {
  const rand = crypto.randomBytes(24).toString('base64url');
  return `lbx_live_${rand}`;
}

module.exports = { generateApiKey };
