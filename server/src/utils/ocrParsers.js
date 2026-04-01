// ─────────────────────────────────────────────────────────────
// OCR field extractors for Nepali identity documents.
// Input:  raw OCR text (multi-line).
// Output: partial form object — only keys the document can supply.
// Unknown or unmatched fields are omitted so the client can merge
// without overwriting existing values.
// ─────────────────────────────────────────────────────────────

const clean = (s) =>
  (s || '')
    .replace(/[\u2018\u2019\u201C\u201D]/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/^\s+|\s+$/g, '');

const normLines = (text) =>
  (text || '')
    .split(/\r?\n/)
    .map(clean)
    .filter(Boolean);

const matchLine = (lines, label) => {
  const re = new RegExp(`${label}\\s*[:\\-]?\\s*(.+)`, 'i');
  for (const l of lines) {
    const m = l.match(re);
    if (m && m[1]) return clean(m[1]);
  }
  return '';
};

// Date normalisation ──────────────────────────────────────────
// Accepts formats: dd/mm/yyyy, dd-mm-yyyy, dd mm yyyy, yyyy/mm/dd.
// Returns dd/mm/yyyy.
const parseDate = (raw) => {
  if (!raw) return '';
  const cleaned = raw.replace(/[^\d/\-\s.]/g, ' ').trim();
  const m =
    cleaned.match(/(\d{1,2})[\/\-.\s]+(\d{1,2})[\/\-.\s]+(\d{2,4})/) ||
    cleaned.match(/(\d{4})[\/\-.\s]+(\d{1,2})[\/\-.\s]+(\d{1,2})/);
  if (!m) return '';
  let dd, mm, yyyy;
  if (m[1].length === 4) {
    yyyy = m[1]; mm = m[2]; dd = m[3];
  } else {
    dd = m[1]; mm = m[2]; yyyy = m[3];
  }
  if (yyyy.length === 2) yyyy = (parseInt(yyyy, 10) > 30 ? '19' : '20') + yyyy;
  return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy}`;
};

const firstDate = (text) => {
  const m = text.match(/(\d{1,2})[\/\-.\s]+(\d{1,2})[\/\-.\s]+(\d{2,4})/);
  return m ? parseDate(m[0]) : '';
};

const allDates = (text) => {
  const re = /(\d{1,2})[\/\-.\s]+(\d{1,2})[\/\-.\s]+(\d{2,4})/g;
  const out = [];
  let m;
  while ((m = re.exec(text))) out.push(parseDate(m[0]));
  return out;
};

const detectGender = (text) => {
  if (/\b(female|\bf\b)\b/i.test(text)) return 'Female';
  if (/\b(male|\bm\b)\b/i.test(text)) return 'Male';
  return '';
};

// ─────────────────────────────────────────────────────────────
// Passport (Nepali MRP-format)
// ─────────────────────────────────────────────────────────────
const parsePassport = (text) => {
  const lines = normLines(text);
  const all = lines.join('\n');
  const out = {};

  const passportNum = all.match(/\b([PN][A-Z]\d{6,7})\b/);
  if (passportNum) out.passportNumber = passportNum[1].toUpperCase();

  const surname = matchLine(lines, 'Surname');
  if (surname) out.familyName = surname.split(/\s{2,}/)[0];

  const given = matchLine(lines, 'Given\\s*Names?');
  if (given) out.givenName = given.split(/\s{2,}/)[0];

  const nationality = matchLine(lines, 'Nationality');
  if (nationality) out.nationality = /nepal/i.test(nationality) ? 'Nepali' : nationality;

  const placeOfBirth = matchLine(lines, 'Place\\s*of\\s*Birth');
  if (placeOfBirth) out.birthAddress = placeOfBirth;

  const gender = detectGender(all);
  if (gender) out.gender = gender;

  const dob = matchLine(lines, 'Date\\s*of\\s*Birth');
  if (dob) out.dateOfBirthAD = parseDate(dob);

  const issue = matchLine(lines, 'Date\\s*of\\s*Issue');
  if (issue) out.passportIssueDate = parseDate(issue);

  const expiry = matchLine(lines, 'Date\\s*of\\s*Expiry');
  if (expiry) out.passportExpiryDate = parseDate(expiry);

  // Fallback: if no labelled dates, use first three dates in order
  if (!out.dateOfBirthAD || !out.passportIssueDate || !out.passportExpiryDate) {
    const dates = allDates(all);
    if (!out.dateOfBirthAD && dates[0]) out.dateOfBirthAD = dates[0];
    if (!out.passportIssueDate && dates[1]) out.passportIssueDate = dates[1];
    if (!out.passportExpiryDate && dates[2]) out.passportExpiryDate = dates[2];
  }

  return out;
};

// ─────────────────────────────────────────────────────────────
// National ID (14-digit NIN)
// ─────────────────────────────────────────────────────────────
const parseNationalId = (text) => {
  const lines = normLines(text);
  const all = lines.join('\n');
  const out = {};

  const nin = all.match(/\b(\d{2,4}[- ]?\d{3,4}[- ]?\d{3,4}[- ]?\d{2,4})\b/);
  const compact = nin && nin[1].replace(/\D/g, '');
  if (compact && compact.length >= 10 && compact.length <= 16) out.nin = compact;

  const name = matchLine(lines, '(Full\\s*Name|Name)');
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      out.givenName = parts.slice(0, -1).join(' ');
      out.familyName = parts[parts.length - 1];
    } else {
      out.givenName = name;
    }
  }

  const dobAd = matchLine(lines, 'DOB\\s*\\(?AD\\)?|Date\\s*of\\s*Birth\\s*\\(AD\\)');
  if (dobAd) out.dateOfBirthAD = parseDate(dobAd);

  const dobBs = matchLine(lines, 'DOB\\s*\\(?BS\\)?|Date\\s*of\\s*Birth\\s*\\(BS\\)');
  if (dobBs) out.dobBS = parseDate(dobBs);

  const gender = detectGender(all);
  if (gender) out.gender = gender;

  const cit = all.match(/\b(\d{2}[-\/]\d{2}[-\/]\d{2}[-\/]\d{4,6})\b/);
  if (cit) out.citizenshipNumber = cit[1];

  return out;
};

// ─────────────────────────────────────────────────────────────
// Citizenship certificate
// ─────────────────────────────────────────────────────────────
const parseCitizenship = (text) => {
  const lines = normLines(text);
  const all = lines.join('\n');
  const out = {};

  const cert = all.match(/\b(\d{2}[-\/]\d{2}[-\/]\d{2}[-\/]\d{4,6})\b/);
  if (cert) out.citizenshipNumber = cert[1];

  const name = matchLine(lines, '(Full\\s*Name|Name)');
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      out.givenName = parts.slice(0, -1).join(' ');
      out.familyName = parts[parts.length - 1];
    } else {
      out.givenName = name;
    }
  }

  const issueDistrict = matchLine(lines, '(Issu(e|ing)\\s*District|District)');
  if (issueDistrict) out.citizenshipIssuingDistrict = issueDistrict;

  const issueDate = matchLine(lines, '(Issue\\s*Date|Date\\s*of\\s*Issue)');
  if (issueDate) out.citizenshipIssueDate = parseDate(issueDate);

  const officer = matchLine(lines, '(Issuing\\s*Officer|Officer)');
  if (officer) out.citizenshipIssuingOfficer = officer;

  const placeOfBirth = matchLine(lines, '(Place\\s*of\\s*Birth|Birth\\s*Place|Birth\\s*District)');
  if (placeOfBirth) out.birthAddress = placeOfBirth;

  const gender = detectGender(all);
  if (gender) out.gender = gender;

  return out;
};

// ─────────────────────────────────────────────────────────────
// Driver's License (Nepal)
// ─────────────────────────────────────────────────────────────
const parseDriversLicense = (text) => {
  const lines = normLines(text);
  const all = lines.join('\n');
  const out = {};

  const lic = all.match(/\b(\d{2}[-\/]\d{2}[-\/]\d{1,2}[-\/]\d{4,7})\b/);
  if (lic) out.dlLicenseNumber = lic[1];

  const name = matchLine(lines, '(Full\\s*Name|Name)');
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      out.givenName = parts.slice(0, -1).join(' ');
      out.familyName = parts[parts.length - 1];
    } else {
      out.givenName = name;
    }
  }

  const dob = matchLine(lines, '(Date\\s*of\\s*Birth|DOB)');
  if (dob) out.dateOfBirthAD = parseDate(dob);

  const phone = matchLine(lines, '(Phone|Contact|Mobile)');
  if (phone) {
    const digits = phone.replace(/[^\d+]/g, '');
    if (digits.length >= 7) out.phone = digits;
  }

  const blood = matchLine(lines, '(Blood\\s*Group|BG)');
  if (blood) {
    const m = blood.match(/(A|B|AB|O)\s*[+\-]/i);
    if (m) out.bloodGroup = m[0].replace(/\s+/g, '').toUpperCase();
  }

  const cat = matchLine(lines, 'Category');
  if (cat) out.dlCategory = cat;

  const issue = matchLine(lines, '(Date\\s*of\\s*Issue|Issue\\s*Date|D\\.O\\.I)');
  if (issue) out.dlIssueDate = parseDate(issue);

  const expiry = matchLine(lines, '(Date\\s*of\\s*Expiry|Expiry\\s*Date|D\\.O\\.E)');
  if (expiry) out.dlExpiryDate = parseDate(expiry);

  const office = matchLine(lines, '(License\\s*Office|Issuing\\s*Office|Office)');
  if (office) out.dlLicenseOffice = office;

  const perm = matchLine(lines, '(Permanent\\s*Address|Permanent)');
  if (perm) out.permanentAddress = perm;

  const temp = matchLine(lines, '(Temporary\\s*Address|Temporary|Present\\s*Address)');
  if (temp) out.temporaryAddress = temp;

  const cit = matchLine(lines, '(Citizenship\\s*No|Citizenship\\s*Number)');
  if (cit) {
    const m = cit.match(/(\d{2}[-\/]\d{2}[-\/]\d{2}[-\/]\d{4,6})/);
    if (m) out.citizenshipNumber = m[1];
  }

  const gender = detectGender(all);
  if (gender) out.gender = gender;

  return out;
};

// ─────────────────────────────────────────────────────────────
// PAN Card (9-digit PAN)
// ─────────────────────────────────────────────────────────────
const parsePanCard = (text) => {
  const lines = normLines(text);
  const all = lines.join('\n');
  const out = {};

  const pan = all.match(/\b(\d{9})\b/);
  if (pan) out.panNumber = pan[1];

  const name = matchLine(lines, '(Full\\s*Name|Name)');
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      out.givenName = parts.slice(0, -1).join(' ');
      out.familyName = parts[parts.length - 1];
    } else {
      out.givenName = name;
    }
  }

  const office = matchLine(lines, '(Registered\\s*Office|IRD|Office)');
  if (office) out.panRegisteredOffice = office;

  return out;
};

const PARSERS = {
  passport: parsePassport,
  national_id: parseNationalId,
  citizenship: parseCitizenship,
  citizenship_front: parseCitizenship,
  citizenship_back: parseCitizenship,
  drivers_license: parseDriversLicense,
  pan_card: parsePanCard,
};

const parseByDocType = (docType, text) => {
  const parser = PARSERS[docType];
  return parser ? parser(text) : {};
};

module.exports = { parseByDocType };
