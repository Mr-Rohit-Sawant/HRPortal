"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = exports.formatCurrency = exports.sanitizeUser = exports.clearAuthCookies = exports.setAuthCookies = exports.buildPaginationMeta = exports.paginate = exports.generateResetToken = exports.generateInvoiceNumber = exports.generateEmployeeId = void 0;
const crypto_1 = __importDefault(require("crypto"));
const generateEmployeeId = (counter) => {
    return `EMP-${String(counter).padStart(4, '0')}`;
};
exports.generateEmployeeId = generateEmployeeId;
const generateInvoiceNumber = (prefix, counter) => {
    const year = new Date().getFullYear();
    return `${prefix}-${year}-${String(counter).padStart(4, '0')}`;
};
exports.generateInvoiceNumber = generateInvoiceNumber;
const generateResetToken = () => {
    return crypto_1.default.randomBytes(32).toString('hex');
};
exports.generateResetToken = generateResetToken;
const paginate = (page, limit) => {
    const skip = (Math.max(1, page) - 1) * limit;
    return { skip, take: limit };
};
exports.paginate = paginate;
const buildPaginationMeta = (total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
});
exports.buildPaginationMeta = buildPaginationMeta;
const setAuthCookies = (res, accessToken, refreshToken, rememberMe = false) => {
    res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        // rememberMe: 30 days; otherwise session cookie (expires when browser closes)
        ...(rememberMe ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}),
        path: '/api/auth/refresh',
    });
};
exports.setAuthCookies = setAuthCookies;
const clearAuthCookies = (res) => {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
};
exports.clearAuthCookies = clearAuthCookies;
const sanitizeUser = (user) => {
    const { passwordHash, refreshToken, twoFactorSecret, ...safe } = user;
    return safe;
};
exports.sanitizeUser = sanitizeUser;
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};
exports.formatCurrency = formatCurrency;
const slugify = (text) => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
};
exports.slugify = slugify;
