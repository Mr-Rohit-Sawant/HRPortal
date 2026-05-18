import { Response } from 'express';
export declare const generateEmployeeId: (counter: number) => string;
export declare const generateInvoiceNumber: (prefix: string, counter: number) => string;
export declare const generateResetToken: () => string;
export declare const paginate: (page: number, limit: number) => {
    skip: number;
    take: number;
};
export declare const buildPaginationMeta: (total: number, page: number, limit: number) => {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
};
export declare const setAuthCookies: (res: Response, accessToken: string, refreshToken: string, rememberMe?: boolean) => void;
export declare const clearAuthCookies: (res: Response) => void;
export declare const sanitizeUser: (user: any) => any;
export declare const formatCurrency: (amount: number) => string;
export declare const slugify: (text: string) => string;
//# sourceMappingURL=helpers.d.ts.map