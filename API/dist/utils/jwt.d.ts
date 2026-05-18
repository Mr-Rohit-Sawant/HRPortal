export interface TokenPayload {
    userId: string;
    email: string;
    roleId: string;
    roleName: string;
    isSuperAdmin: boolean;
}
export declare const signAccessToken: (payload: TokenPayload) => string;
export declare const signRefreshToken: (payload: TokenPayload) => string;
export declare const verifyAccessToken: (token: string) => TokenPayload;
export declare const verifyRefreshToken: (token: string) => TokenPayload;
//# sourceMappingURL=jwt.d.ts.map