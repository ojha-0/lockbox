// Convert between AD (Gregorian) and BS (Bikram Sambat) dates.
// Both input and output use the app's dd/mm/yyyy string format.

import NepaliDate from 'nepali-date-converter';

// Accept dd/mm/yyyy with 1-2 digit day/month and 4-digit year. Returns
// { day, month, year } or null.
function parseDmy(str) {
  if (typeof str !== 'string') return null;
  const m = str.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  if (!day || !month || !year || month < 1 || month > 12 || day < 1 || day > 32) return null;
  return { day, month, year };
}

const pad = (n) => String(n).padStart(2, '0');
const formatDmy = (d, m, y) => `${pad(d)}/${pad(m)}/${y}`;

// Convert AD "dd/mm/yyyy" to BS "dd/mm/yyyy". Returns null on invalid input
// or dates outside the library's supported range.
export function adToBs(adStr) {
  const p = parseDmy(adStr);
  if (!p) return null;
  try {
    const js = new Date(Date.UTC(p.year, p.month - 1, p.day));
    if (isNaN(js.getTime())) return null;
    const nd = new NepaliDate(js);
    return formatDmy(nd.getDate(), nd.getMonth() + 1, nd.getYear());
  } catch {
    return null;
  }
}

// Convert BS "dd/mm/yyyy" to AD "dd/mm/yyyy". Returns null on invalid input
// or dates outside the library's supported range.
export function bsToAd(bsStr) {
  const p = parseDmy(bsStr);
  if (!p) return null;
  try {
    const nd = new NepaliDate(p.year, p.month - 1, p.day);
    const js = nd.toJsDate();
    if (!(js instanceof Date) || isNaN(js.getTime())) return null;
    return formatDmy(js.getDate(), js.getMonth() + 1, js.getFullYear());
  } catch {
    return null;
  }
}
