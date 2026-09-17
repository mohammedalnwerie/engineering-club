// Security Utility Suite: Local Audit Log, Rate Limiter, Sanitization & CSV Export
// Admin authentication is handled by Supabase Auth (see AdminDashboard).

const AUDIT_LOG_KEY = 'eng_club_security_audit_v1';

export interface SecurityAuditEntry {
  id: string;
  timestamp: string;
  action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'PASSWORD_CHANGED' | 'EXPORT_DATA' | 'RESET_ATTEMPT';
  details: string;
}

// 1. Security Audit Log (this browser only)
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

// 2. Anti-Spam Rate Limiter (Cooldown)
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

// 3. Sanitizers: Prevent XSS & Malicious Protocol Injections
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

// 4. Excel-Ready CSV Export with Arabic UTF-8 BOM
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
