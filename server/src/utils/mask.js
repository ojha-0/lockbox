// Masking helpers for third-party KYC responses.
// Phone: keep last 4 digits, mask the rest with '*'.
// Document number: strip non-alphanumeric, keep last 4 chars, mask the rest.

const maskPhone = (phone) => {
  if (!phone) return '****';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length <= 4) return '****';
  return '*'.repeat(digits.length - 4) + digits.slice(-4);
};

const maskDocumentNumber = (doc) => {
  if (!doc) return '****';
  const clean = String(doc).replace(/[^a-zA-Z0-9]/g, '');
  if (clean.length <= 4) return '****';
  return '*'.repeat(clean.length - 4) + clean.slice(-4);
};

module.exports = { maskPhone, maskDocumentNumber };
