// Supabase Native REST Client Bridge
// Zero external dependency: Works via native fetch API to Supabase PostgREST endpoints

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  connected: boolean;
}

const STORAGE_KEY = 'eng_club_supabase_config_v1';

export class SupabaseBridge {
  private config: SupabaseConfig = {
    url: '',
    anonKey: '',
    connected: false,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          this.config = JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
  }

  public getConfig(): SupabaseConfig {
    return this.config;
  }

  public setConfig(url: string, anonKey: string): boolean {
    const cleanUrl = url.trim().replace(/\/$/, '');
    const cleanKey = anonKey.trim();

    this.config = {
      url: cleanUrl,
      anonKey: cleanKey,
      connected: cleanUrl.length > 0 && cleanKey.length > 0,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    }

    return this.config.connected;
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config.connected) {
      return { success: false, message: 'لم يتم إدخال بيانات الربط بعد' };
    }

    try {
      const res = await fetch(`${this.config.url}/rest/v1/`, {
        headers: {
          apikey: this.config.anonKey,
          Authorization: `Bearer ${this.config.anonKey}`,
        },
      });

      if (res.ok || res.status === 200 || res.status === 404) {
        return { success: true, message: 'الاتصال بقاعدة بيانات Supabase تم بنجاح!' };
      } else {
        return { success: false, message: `فشل الاتصال: رمز الخطأ ${res.status}` };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'تعذر الوصول إلى الخادم';
      return { success: false, message: `خطأ في الاتصال: ${errorMsg}` };
    }
  }
}

export const supabaseBridge = new SupabaseBridge();
