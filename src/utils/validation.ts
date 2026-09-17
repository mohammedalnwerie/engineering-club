// Form input normalization and validation shared by the public forms.
// The database functions apply the same rules, so these only give earlier, friendlier feedback.

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/** Converts Arabic-Indic (٠١٢…) and Persian (۰۱۲…) digits to 0-9. */
export function toLatinDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (d) => {
    const i = ARABIC_DIGITS.indexOf(d);
    return String(i >= 0 ? i : PERSIAN_DIGITS.indexOf(d));
  });
}

/** Student IDs and verification codes: Latin digits, no spaces. */
export const normalizeCode = (value: string) => toLatinDigits(value).replace(/\s+/g, '');

/** Phone numbers: Latin digits and a leading +, nothing else. */
export const normalizePhone = (value: string) => toLatinDigits(value).replace(/[^\d+]/g, '');

export function validateFullName(value: string): string | null {
  const name = value.trim().replace(/\s+/g, ' ');
  if (!name) return 'الاسم مطلوب';
  if (name.length < 6 || name.split(' ').length < 2) return 'اكتب اسمك الكامل (اسمان على الأقل)';
  if (name.length > 120) return 'الاسم أطول من المسموح';
  return null;
}

export function validateStudentId(value: string): string | null {
  const id = normalizeCode(value);
  if (!id) return 'الرقم الجامعي مطلوب';
  if (!/^\d{5,12}$/.test(id)) return 'الرقم الجامعي أرقام فقط، من 5 إلى 12 رقماً';
  return null;
}

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/;

export function validateEmail(value: string, required = true): string | null {
  const email = toLatinDigits(value).trim();
  if (!email) return required ? 'البريد الإلكتروني مطلوب' : null;
  if (/\s/.test(email)) return 'البريد الإلكتروني لا يحتوي على مسافات';
  if (email.length > 160 || !EMAIL_PATTERN.test(email) || /\.\./.test(email) || /^\.|\.@|@\./.test(email)) {
    return 'البريد الإلكتروني غير صحيح، تأكد من كتابته (مثال: name@gmail.com)';
  }
  return null;
}

// Common misspellings of popular email domains.
const DOMAIN_FIXES: Record<string, string> = {
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'yahoo.con': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'outlook.con': 'outlook.com',
  'outlok.com': 'outlook.com',
  'std.up.edu': 'std.up.edu.ps',
  'up.edu.ps.com': 'up.edu.ps',
};

/** Suggests a corrected address for typical typos (e.g. gmail..com → gmail.com), or null. */
export function suggestEmailFix(value: string): string | null {
  const email = toLatinDigits(value).trim().toLowerCase().replace(/\s+/g, '');
  const at = email.lastIndexOf('@');
  if (at < 1) return null;
  const local = email.slice(0, at).replace(/\.{2,}/g, '.').replace(/^\.|\.$/g, '');
  let domain = email.slice(at + 1).replace(/\.{2,}/g, '.').replace(/^\.|\.$/g, '');
  domain = DOMAIN_FIXES[domain] || domain;
  const fixed = `${local}@${domain}`;
  return fixed !== email && !validateEmail(fixed) ? fixed : null;
}

export function validatePhone(value: string, required = true): string | null {
  const digits = normalizePhone(value).replace(/\D/g, '');
  if (!digits) return required ? 'رقم الجوال مطلوب' : null;
  if (digits.length < 9 || digits.length > 15) return 'رقم الجوال غير صحيح (مثال: 0599123456)';
  return null;
}

export function validateUrl(value: string): string | null {
  const url = value.trim();
  if (!url) return null;
  if (!/^https?:\/\/\S+\.\S+/i.test(url)) return 'الرابط يجب أن يبدأ بـ https://';
  return null;
}
