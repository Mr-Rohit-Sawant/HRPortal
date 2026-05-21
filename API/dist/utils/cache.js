"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SETTINGS_TTL = exports.STATS_TTL = exports.AUTH_TTL = exports.settingsCache = exports.statsCache = exports.authCache = void 0;
class TTLCache {
    constructor() {
        this.s = new Map();
    }
    set(key, value, ttlMs) {
        this.s.set(key, { v: value, exp: Date.now() + ttlMs });
    }
    get(key) {
        const e = this.s.get(key);
        if (!e)
            return undefined;
        if (Date.now() > e.exp) {
            this.s.delete(key);
            return undefined;
        }
        return e.v;
    }
    del(key) { this.s.delete(key); }
    delPrefix(prefix) {
        for (const k of this.s.keys())
            if (k.startsWith(prefix))
                this.s.delete(k);
    }
    size() { return this.s.size; }
}
// Auth: cache user+permissions per token — biggest win (eliminates 2 DB calls/request)
exports.authCache = new TTLCache();
// Dashboard stats: cache per businessId (or 'superadmin')
exports.statsCache = new TTLCache();
// App settings: rarely change
exports.settingsCache = new TTLCache();
exports.AUTH_TTL = 5 * 60 * 1000; // 5 min
exports.STATS_TTL = 30 * 1000; // 30 s
exports.SETTINGS_TTL = 5 * 60 * 1000; // 5 min
//# sourceMappingURL=cache.js.map