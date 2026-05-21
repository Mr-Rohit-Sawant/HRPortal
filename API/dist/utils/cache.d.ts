declare class TTLCache<T> {
    private s;
    set(key: string, value: T, ttlMs: number): void;
    get(key: string): T | undefined;
    del(key: string): void;
    delPrefix(prefix: string): void;
    size(): number;
}
export declare const authCache: TTLCache<{
    userId: string;
    email: string;
    roleId: string;
    roleName: string;
    isSuperAdmin: boolean;
    permissions: string[];
    businessId: string | null;
}>;
export declare const statsCache: TTLCache<any>;
export declare const settingsCache: TTLCache<any>;
export declare const AUTH_TTL: number;
export declare const STATS_TTL: number;
export declare const SETTINGS_TTL: number;
export {};
//# sourceMappingURL=cache.d.ts.map