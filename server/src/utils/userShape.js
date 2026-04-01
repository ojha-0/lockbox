// Shape a Prisma user (or any object with firstName/lastName) so that
// responses continue to expose a single `name` field for the client.
// The DB now stores firstName/lastName separately; this helper keeps the
// computed fullName convenience without duplicating data in the schema.

const fullName = (firstName, lastName) =>
  [firstName, lastName].filter(Boolean).join(' ').trim();

// Shape a single user. Returns null/undefined unchanged.
const shapeUser = (u) => {
  if (!u || typeof u !== 'object') return u;
  const name = fullName(u.firstName, u.lastName);
  return { ...u, name };
};

// Shape every `user` / `actor` / `targetUser` / `reviewedBy` / `fromUser` / `toUser`
// nested inside a larger object (docs, logs, shares, etc.).
const NESTED_USER_KEYS = ['user', 'actor', 'targetUser', 'reviewedBy', 'fromUser', 'toUser'];

const shapeNested = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const out = { ...obj };
  for (const k of NESTED_USER_KEYS) {
    if (out[k] && typeof out[k] === 'object' && ('firstName' in out[k] || 'lastName' in out[k])) {
      out[k] = shapeUser(out[k]);
    }
  }
  return out;
};

const shapeNestedMany = (arr) => (Array.isArray(arr) ? arr.map(shapeNested) : arr);

module.exports = { shapeUser, shapeNested, shapeNestedMany, fullName };
