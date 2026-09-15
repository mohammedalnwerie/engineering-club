// Security Utility Suite: Cryptographic Hashing, Brute-Force Guard, Rate Limiter & Sanitization

const ADMIN_HASH_KEY = 'eng_club_admin_hash_v2';
const LOCKOUT_KEY = 'eng_club_admin_lockout_v1';
const AUDIT_LOG_KEY = 'eng_club_security_audit_v1';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes lockout

export interface LockoutStatus {
  isLocked: boolean;
  remainingSeconds: number;
  failedCount: number;
}

export interface SecurityAuditEntry {
  id: string;
  timestamp: string;
  action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'PASSWORD_CHANGED' | 'EXPORT_DATA' | 'RESET_ATTEMPT';
  details: string;
}

// 1. Web Crypto SHA-256
export async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode('up_club_salt_' + str.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// 2. Initialize default admin password hash if not set
export async function initializeAdminHash(): Promise<void> {
  if (typeof window === 'undefined') return;
  const existing = localStorage.getItem(ADMIN_HASH_KEY);
  if (!existing) {
    // Default initial passcode is eng2026 (hashed securely)
    const defaultHash = await hashString('eng2026');
    localStorage.setItem(ADMIN_HASH_KEY, defaultHash);
  }
}

// 3. Verify Admin Passcode
export async function verifyAdminPassword(passcode: string): Promise<boolean> {
  await initializeAdminHash();
  const storedHash = localStorage.getItem(ADMIN_HASH_KEY);
  if (!storedHash) return false;

  const inputHash = await hashString(passcode);
  return inputHash === storedHash;
}

// 4. Change Admin Password
export async function changeAdminPassword(currentPass: string, newPass: string): Promise<{ success: boolean; message: string }> {
  if (newPass.length < 6) {
    return { success: false, message: 'يجب أن تتكون كلمة المرور الجديدة من 6 خانات على الأقل لضمان الأمان.' };
  }

  const isCurrentValid = await verifyAdminPassword(currentPass);
  if (!isCurrentValid) {
    logSecurityEvent('LOGIN_FAILED', 'فشل في التحقق من كلمة المرور الحالية أثناء محاولة التغيير');
    return { success: false, message: 'كلمة المرور الحالية غير صحيحة.' };
  }

  const newHash = await hashString(newPass);
  localStorage.setItem(ADMIN_HASH_KEY, newHash);
  logSecurityEvent('PASSWORD_CHANGED', 'تم تغيير كلمة المرور الرئيسية للوحة التحكم بنجاح');
  return { success: true, message: 'تم تحديث وتشفير كلمة المرور الجديدة بنجاح!' };
}

// 5. Brute Force Guard & Lockout Management
export function getLockoutStatus(): LockoutStatus {
  if (typeof window === 'undefined') return { isLocked: false, remainingSeconds: 0, failedCount: 0 };

  const raw = localStorage.getItem(LOCKOUT_KEY);
  if (!raw) return { isLocked: false, remainingSeconds: 0, failedCount: 0 };

  try {
    const data = JSON.parse(raw);
    const now = Date.now();
    if (data.lockedUntil && data.lockedUntil > now) {
      const remainingSeconds = Math.ceil((data.lockedUntil - now) / 1000);
      return { isLocked: true, remainingSeconds, failedCount: data.failedCount || MAX_FAILED_ATTEMPTS };
    }
    // Expired lockout
    if (data.lockedUntil && data.lockedUntil <= now) {
      localStorage.removeItem(LOCKOUT_KEY);
      return { isLocked: false, remainingSeconds: 0, failedCount: 0 };
    }
    return { isLocked: false, remainingSeconds: 0, failedCount: data.failedCount || 0 };
  } catch {
    return { isLocked: false, remainingSeconds: 0, failedCount: 0 };
  }
}

export function recordFailedLogin(): LockoutStatus {
  const current = getLockoutStatus();
  const newCount = current.failedCount + 1;
  const now = Date.now();

  let lockedUntil: number | null = null;
  let isLocked = false;
  let remainingSeconds = 0;

  if (newCount >= MAX_FAILED_ATTEMPTS) {
    lockedUntil = now + LOCKOUT_DURATION_MS;
    isLocked = true;
    remainingSeconds = Math.ceil(LOCKOUT_DURATION_MS / 1000);
    logSecurityEvent('LOGIN_FAILED', `تم تفعيل القفل الأمني التلقائي بعد ${newCount} محاولات دخول فاشلة`);
  } else {
    logSecurityEvent('LOGIN_FAILED', `محاولة دخول فاشلة (${newCount} من ${MAX_FAILED_ATTEMPTS})`);
  }

  localStorage.setItem(
    LOCKOUT_KEY,
    JSON.stringify({
      failedCount: newCount,
      lockedUntil,
      lastAttempt: now,
    })
  );

  return { isLocked, remainingSeconds, failedCount: newCount };
}

export function resetLockout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCKOUT_KEY);
    logSecurityEvent('LOGIN_SUCCESS', 'تسجيل دخول إداري ناجح وموثق');
  }
}

// 6. Security Audit Log
export function logSecurityEvent(action: SecurityAuditEntry['action'], details: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    const logs: SecurityAuditEntry[] = raw ? JSON.parse(raw) : [];
    logs.unshift({
      id: 'sec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      action,
      details,
    });
    // Keep last 40 entries
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs.slice(0, 40)));
  } catch {
    // ignore
  }
}

export function getSecurityAuditLogs(): SecurityAuditEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// 7. Anti-Spam Rate Limiter (Cooldown)
const rateLimitMemory: Record<string, number> = {};

export function checkRateLimit(actionKey: string, cooldownMs = 4000): { allowed: boolean; waitSeconds: number } {
  const now = Date.now();
  const last = rateLimitMemory[actionKey] || 0;
  if (now - last < cooldownMs) {
    const waitSeconds = Math.ceil((cooldownMs - (now - last)) / 1000);
    return { allowed: false, waitSeconds };
  }
  rateLimitMemory[actionKey] = now;
  return { allowed: true, waitSeconds: 0 };
}

// 8. Sanitizers: Prevent XSS & Malicious Protocol Injections
export function sanitizeText(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export function sanitizeUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  // Strip javascript:, data:, vbscript:
  return '';
}

// 9. Excel-Ready CSV Export with Arabic UTF-8 BOM
export function downloadCsv(filename: string, headers: string[], rows: (string | number | undefined)[][]): void {
  // \uFEFF forces Excel to open Arabic text in UTF-8 cleanly
  const BOM = '\uFEFF';
  const csvContent =
    BOM +
    [
      headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const val = cell === undefined || cell === null ? '' : String(cell);
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  logSecurityEvent('EXPORT_DATA', `تم تصدير ملف بيانات بصيغة CSV: ${filename}`);
}
