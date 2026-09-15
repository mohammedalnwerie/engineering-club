// Safe Storage Wrapper: Prevents QuotaExceededError crashes & Auto-Unwraps Double Stringified JSON

export interface StorageHealth {
  usedKb: number;
  maxKb: number;
  percent: number;
  status: 'healthy' | 'warning' | 'critical';
  itemCount: number;
}

const ESTIMATED_MAX_KB = 5120; // 5 MB standard browser quota

export const safeStorage = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const item = localStorage.getItem(key);
      if (item === null) return fallback;
      let parsed = JSON.parse(item);
      // Recursively unwrap any double or triple stringified JSON strings
      while (typeof parsed === 'string') {
        try {
          const unwrapped = JSON.parse(parsed);
          parsed = unwrapped;
        } catch {
          break;
        }
      }
      return parsed as T;
    } catch (err) {
      console.warn(`[SafeStorage] Failed to parse key "${key}":`, err);
      return fallback;
    }
  },

  set<T>(key: string, value: T): boolean {
    if (typeof window === 'undefined') return false;
    try {
      let serialized: string;
      if (typeof value === 'string') {
        serialized = value;
      } else {
        serialized = JSON.stringify(value);
      }
      localStorage.setItem(key, serialized);
      return true;
    } catch (err: unknown) {
      console.error(`[SafeStorage] Quota exceeded or write error on key "${key}":`, err);

      // Attempt emergency recovery: clean temporary audit logs or old caches
      try {
        localStorage.removeItem('eng_club_security_audit_v1');
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, serialized);
        console.warn(`[SafeStorage] Successfully saved "${key}" after emergency cache trim.`);
        return true;
      } catch {
        return false;
      }
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn(`[SafeStorage] Failed to remove key "${key}":`, err);
    }
  },

  getHealth(): StorageHealth {
    if (typeof window === 'undefined') {
      return { usedKb: 0, maxKb: ESTIMATED_MAX_KB, percent: 0, status: 'healthy', itemCount: 0 };
    }

    try {
      let totalBytes = 0;
      let itemCount = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) {
          const v = localStorage.getItem(k) || '';
          totalBytes += k.length * 2 + v.length * 2;
          itemCount++;
        }
      }

      const usedKb = Math.round(totalBytes / 1024);
      const percent = Math.min(100, Math.round((usedKb / ESTIMATED_MAX_KB) * 100));

      let status: StorageHealth['status'] = 'healthy';
      if (percent > 85) status = 'critical';
      else if (percent > 65) status = 'warning';

      return { usedKb, maxKb: ESTIMATED_MAX_KB, percent, status, itemCount };
    } catch {
      return { usedKb: 0, maxKb: ESTIMATED_MAX_KB, percent: 0, status: 'healthy', itemCount: 0 };
    }
  },
};
