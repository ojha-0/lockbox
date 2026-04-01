// Per-user namespaced localStorage helpers for identity-document form data.
// Keys are scoped by the currently-logged-in user's id so that a new signup
// on the same browser never sees a previous user's saved details.

const LEGACY_KEYS = {
  passport:        'lockbox_form_passport',
  national_id:     'lockbox_form_national_id',
  citizenship:     'lockbox_form_citizenship',
  drivers_license: 'lockbox_form_drivers_license',
  pan_card:        'lockbox_form_pan_card',
};

export const FORM_TYPES = Object.keys(LEGACY_KEYS);

function getUserId() {
  try {
    const u = JSON.parse(localStorage.getItem('user'));
    if (u?.id != null) return String(u.id);
    if (u?.email) return `email:${u.email}`;
    return null;
  } catch {
    return null;
  }
}

export function formKey(type) {
  const uid = getUserId();
  if (!uid) return `lockbox_form_${type}__anon`;
  return `lockbox_form_${type}__${uid}`;
}

export const FORM_KEYS = FORM_TYPES.reduce((acc, t) => {
  Object.defineProperty(acc, t, { get: () => formKey(t), enumerable: true });
  return acc;
}, {});

export function loadForm(type) {
  try { return JSON.parse(localStorage.getItem(formKey(type))) || {}; }
  catch { return {}; }
}

export function saveForm(type, data) {
  localStorage.setItem(formKey(type), JSON.stringify(data));
}

export function hasFormData(type) {
  try {
    const d = JSON.parse(localStorage.getItem(formKey(type)));
    return !!(d && Object.values(d).some(v => v && String(v).trim()));
  } catch { return false; }
}

// Move any legacy non-namespaced form data into the current user's namespace.
// Used on login so an existing user who had data before this update keeps it.
export function migrateLegacyFormKeysToCurrentUser() {
  const uid = getUserId();
  if (!uid) return;
  for (const [type, legacyKey] of Object.entries(LEGACY_KEYS)) {
    const legacy = localStorage.getItem(legacyKey);
    if (legacy == null) continue;
    const nsKey = formKey(type);
    if (!localStorage.getItem(nsKey)) localStorage.setItem(nsKey, legacy);
    localStorage.removeItem(legacyKey);
  }
}

// Drop legacy keys without migrating — used on signup so a brand-new account
// starts with an empty form instead of inheriting a previous user's data.
export function clearLegacyFormKeys() {
  for (const legacyKey of Object.values(LEGACY_KEYS)) {
    localStorage.removeItem(legacyKey);
  }
}

// Wipe the current user's namespaced form data.
export function clearCurrentUserFormData() {
  for (const type of FORM_TYPES) {
    localStorage.removeItem(formKey(type));
  }
}

// ─────────────────────────────────────────────────────────────
// Flat profile view
//
// The Upload form writes the same person-level fields (name, gender, DOB,
// address, citizenship number…) into several per-document localStorage
// entries. For display we collapse them back into a single flat profile
// object and expose section metadata that mirrors the Upload form, so the
// Dashboard and My Documents pages can render each field exactly once.
// ─────────────────────────────────────────────────────────────

export function loadProfile() {
  const p = loadForm('passport');
  const n = loadForm('national_id');
  const c = loadForm('citizenship');
  const d = loadForm('drivers_license');
  const pan = loadForm('pan_card');

  const fullName = n.fullName || c.fullName || d.fullName || '';
  const parts = fullName.trim().split(' ');
  const givenName = p.givenNames || (parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] || '');
  const familyName = p.surname || (parts.length > 1 ? parts[parts.length - 1] : '');

  const permanentAddress = d.permanentAddress || '';
  const temporaryAddress = d.temporaryAddress || '';

  return {
    givenName,
    familyName,
    gender:                     p.gender || n.gender || '',
    dateOfBirthAD:              p.dateOfBirth || n.dobAD || d.dateOfBirth || '',
    dobBS:                      n.dobBS || '',
    phone:                      d.phone || '',
    bloodGroup:                 d.bloodGroup || '',
    birthAddress:               p.placeOfBirth || c.placeOfBirthDistrict || '',
    permanentAddress,
    temporaryAddress,
    sameAsPermanent:            !!permanentAddress && permanentAddress === temporaryAddress,
    citizenshipNumber:          n.citizenshipNumber || d.citizenshipNumber || c.certNumber || '',
    citizenshipType:            d.citizenshipType || '',
    citizenshipIssuingDistrict: c.issueDistrict || d.citizenshipIssueDistrict || '',
    citizenshipIssueDate:       c.issueDate || d.citizenshipIssueDate || '',
    citizenshipIssuingOfficer:  c.issuingOfficer || '',
    passportNumber:             p.passportNumber || '',
    nationality:                p.nationality || '',
    passportIssueDate:          p.issueDate || '',
    passportExpiryDate:         p.expiryDate || '',
    nin:                        n.nin || '',
    dlLicenseNumber:            d.licenseNumber || '',
    dlCategory:                 d.category || '',
    dlIssueDate:                d.licenseIssueDate || '',
    dlExpiryDate:               d.licenseExpiryDate || '',
    dlLicenseOffice:            d.licenseOffice || '',
    panNumber:                  pan.panNumber || '',
    panRegisteredOffice:        pan.registeredOffice || '',
  };
}

// Section layout mirrors the Upload Documents form so users see their saved
// data in the same grouping they entered it in — and each field only once.
export const PROFILE_SECTIONS = [
  {
    key: 'personal',
    label: 'Personal Details',
    fields: [
      ['Given Name',         'givenName'],
      ['Family Name',        'familyName'],
      ['Gender',             'gender'],
      ['Date of Birth (AD)', 'dateOfBirthAD'],
      ['Date of Birth (BS)', 'dobBS'],
      ['Phone Number',       'phone'],
      ['Blood Group',        'bloodGroup'],
    ],
  },
  {
    key: 'address',
    label: 'Address',
    fields: [
      ['Birth Address',      'birthAddress'],
      ['Permanent Address',  'permanentAddress'],
      // Skip temporary when it's the same as permanent — the toggle handled it.
      ['Temporary Address',  p => (p.sameAsPermanent ? '' : p.temporaryAddress)],
    ],
  },
  {
    key: 'citizenship',
    label: 'Citizenship Details',
    fields: [
      ['Citizenship Number', 'citizenshipNumber'],
      ['Citizenship Type',   'citizenshipType'],
      ['Issuing District',   'citizenshipIssuingDistrict'],
      ['Issue Date (BS)',    'citizenshipIssueDate'],
      ['Issuing Officer',    'citizenshipIssuingOfficer'],
    ],
  },
  {
    key: 'passport',
    label: 'Passport',
    fields: [
      ['Passport Number',    'passportNumber'],
      ['Nationality',        'nationality'],
      ['Issue Date',         'passportIssueDate'],
      ['Expiry Date',        'passportExpiryDate'],
    ],
  },
  {
    key: 'national_id',
    label: 'National ID',
    fields: [
      ['National Identity Number', 'nin'],
    ],
  },
  {
    key: 'drivers_license',
    label: "Driver's License",
    fields: [
      ['License Number',     'dlLicenseNumber'],
      ['Category',           'dlCategory'],
      ['Date of Issue',      'dlIssueDate'],
      ['Date of Expiry',     'dlExpiryDate'],
      ['License Office',     'dlLicenseOffice'],
    ],
  },
  {
    key: 'pan_card',
    label: 'PAN Card',
    fields: [
      ['PAN Number',         'panNumber'],
      ['Registered Office',  'panRegisteredOffice'],
    ],
  },
];

// Returns sections with only their filled-in fields, omitting empty sections.
export function getFilledProfileSections(profile = loadProfile()) {
  return PROFILE_SECTIONS
    .map(section => ({
      ...section,
      filled: section.fields
        .map(([label, field]) => {
          const v = typeof field === 'function' ? field(profile) : profile[field];
          return [label, v];
        })
        .filter(([, v]) => v != null && String(v).trim() !== ''),
    }))
    .filter(section => section.filled.length > 0);
}
