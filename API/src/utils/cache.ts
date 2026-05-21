interface Entry<T> { v: T; exp: number; }

class TTLCache<T> {
  private s = new Map<string, Entry<T>>();

  set(key: string, value: T, ttlMs: number) {
    this.s.set(key, { v: value, exp: Date.now() + ttlMs });
  }

  get(key: string): T | undefined {
    const e = this.s.get(key);
    if (!e) return undefined;
    if (Date.now() > e.exp) { this.s.delete(key); return undefined; }
    return e.v;
  }

  del(key: string) { this.s.delete(key); }

  delPrefix(prefix: string) {
    for (const k of this.s.keys()) if (k.startsWith(prefix)) this.s.delete(k);
  }

  size() { return this.s.size; }
}

// Auth: cache user+permissions per token — biggest win (eliminates 2 DB calls/request)
export const authCache = new TTLCache<{
  userId: string; email: string; roleId: string; roleName: string;
  isSuperAdmin: boolean; permissions: string[]; businessId: string | null;
}>();

// Dashboard stats: cache per businessId (or 'superadmin')
export const statsCache = new TTLCache<any>();

// App settings: rarely change
export const settingsCache = new TTLCache<any>();

export const AUTH_TTL    = 5 * 60 * 1000;   // 5 min
export const STATS_TTL   = 30 * 1000;        // 30 s
export const SETTINGS_TTL = 5 * 60 * 1000;  // 5 min
