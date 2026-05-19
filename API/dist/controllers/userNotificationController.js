"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotificationPermissions = exports.markNotificationRead = exports.getNotificationPermissions = exports.deleteUserNotification = exports.updateUserNotification = exports.createUserNotification = exports.getUserNotifications = void 0;
const path_1 = __importDefault(require("path"));
const app_1 = require("../app");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const helpers_1 = require("../utils/helpers");
// ---------------------------------------------------------------------------
// Permission delay helper
// ---------------------------------------------------------------------------
const DELAY_MS = {
    '1h': 3600000,
    '8h': 28800000,
    '24h': 86400000,
    '7d': 604800000,
    '30d': 2592000000,
};
async function checkDelay(notif, action, userRoleName) {
    const setting = await app_1.prisma.appSetting.findUnique({ where: { key: 'notification_permissions' } });
    if (!setting?.value)
        return;
    let config;
    try {
        config = JSON.parse(setting.value);
    }
    catch {
        return;
    }
    const roleConfig = config?.[action]?.delays;
    const roleDelay = roleConfig?.[userRoleName];
    if (!roleDelay || roleDelay === 'never_expire')
        return;
    if (roleDelay === 'not_allowed')
        throw new errorMiddleware_1.AppError('Permission denied', 403);
    const ms = DELAY_MS[roleDelay];
    if (ms && Date.now() - new Date(notif.createdAt).getTime() > ms) {
        throw new errorMiddleware_1.AppError(`${action === 'edit' ? 'Edit' : 'Delete'} window has expired`, 403);
    }
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const includeFields = {
    createdBy: { select: { id: true, firstName: true, lastName: true } },
    client: { select: { id: true, companyName: true } },
};
function matchesSendTo(sendTo, userId) {
    if (sendTo === 'ALL')
        return true;
    if (typeof sendTo === 'string') {
        try {
            const parsed = JSON.parse(sendTo);
            if (parsed === 'ALL')
                return true;
            if (Array.isArray(parsed))
                return parsed.includes(userId);
        }
        catch {
            // ignore
        }
        return false;
    }
    if (Array.isArray(sendTo))
        return sendTo.includes(userId);
    return false;
}
// ---------------------------------------------------------------------------
// GET /user-notifications
// ---------------------------------------------------------------------------
const getUserNotifications = async (req, res) => {
    const currentUserId = req.user.userId;
    const page = Math.max(1, parseInt(String(req.query.page || '1')));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'))));
    const type = req.query.type || 'all';
    // Fetch notifications created by this user
    const myCreated = await app_1.prisma.userNotification.findMany({
        where: { createdById: currentUserId },
        include: includeFields,
        orderBy: { createdAt: 'desc' },
    });
    // Fetch notifications created by others
    const others = await app_1.prisma.userNotification.findMany({
        where: { createdById: { not: currentUserId } },
        include: includeFields,
        orderBy: { createdAt: 'desc' },
    });
    const received = others.filter((n) => matchesSendTo(n.sendTo, currentUserId));
    let merged;
    if (type === 'sent') {
        merged = myCreated;
    }
    else if (type === 'received') {
        merged = received;
    }
    else {
        // all — merge and dedupe
        const seen = new Set();
        merged = [];
        for (const n of [...myCreated, ...received]) {
            if (!seen.has(n.id)) {
                seen.add(n.id);
                merged.push(n);
            }
        }
        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    const total = merged.length;
    const start = (page - 1) * limit;
    const data = merged.slice(start, start + limit);
    res.json({
        success: true,
        data,
        meta: (0, helpers_1.buildPaginationMeta)(total, page, limit),
    });
};
exports.getUserNotifications = getUserNotifications;
// ---------------------------------------------------------------------------
// POST /user-notifications
// ---------------------------------------------------------------------------
const createUserNotification = async (req, res) => {
    const { title, description, sendTo, clientId } = req.body;
    if (!title || !description || !sendTo) {
        throw new errorMiddleware_1.AppError('title, description, and sendTo are required', 400);
    }
    let parsedSendTo;
    try {
        parsedSendTo = JSON.parse(sendTo);
    }
    catch {
        parsedSendTo = sendTo;
    }
    const files = req.files?.map((f) => ({
        name: f.originalname,
        path: `uploads/custom/${f.filename}`,
        size: f.size,
    })) ?? [];
    const filesJson = files.length ? files : undefined;
    const notif = await app_1.prisma.userNotification.create({
        data: {
            title,
            description,
            sendTo: parsedSendTo,
            files: filesJson,
            clientId: clientId || undefined,
            businessId: req.body.businessId || req.user.businessId || undefined,
            readBy: JSON.stringify([req.user.userId]),
            createdById: req.user.userId,
        },
        include: includeFields,
    });
    res.status(201).json({ success: true, data: notif });
};
exports.createUserNotification = createUserNotification;
// ---------------------------------------------------------------------------
// PUT /user-notifications/:id
// ---------------------------------------------------------------------------
const updateUserNotification = async (req, res) => {
    const { id } = req.params;
    const currentUserId = req.user.userId;
    const roleName = req.user.roleName;
    const notif = await app_1.prisma.userNotification.findUnique({ where: { id } });
    if (!notif)
        throw new errorMiddleware_1.AppError('Notification not found', 404);
    if (notif.createdById !== currentUserId && !req.user.isSuperAdmin) {
        throw new errorMiddleware_1.AppError('Permission denied', 403);
    }
    await checkDelay(notif, 'edit', roleName);
    const { title, description, sendTo, clientId, files } = req.body;
    let parsedSendTo;
    if (sendTo !== undefined) {
        try {
            parsedSendTo = JSON.parse(sendTo);
        }
        catch {
            parsedSendTo = sendTo;
        }
    }
    const updated = await app_1.prisma.userNotification.update({
        where: { id },
        data: {
            ...(title !== undefined && { title }),
            ...(description !== undefined && { description }),
            ...(parsedSendTo !== undefined && { sendTo: parsedSendTo }),
            ...(clientId !== undefined && { clientId: clientId || null }),
            ...(files !== undefined && { files }),
        },
        include: includeFields,
    });
    res.json({ success: true, data: updated });
};
exports.updateUserNotification = updateUserNotification;
// ---------------------------------------------------------------------------
// DELETE /user-notifications/:id
// ---------------------------------------------------------------------------
const deleteUserNotification = async (req, res) => {
    const { id } = req.params;
    const currentUserId = req.user.userId;
    const roleName = req.user.roleName;
    const notif = await app_1.prisma.userNotification.findUnique({ where: { id } });
    if (!notif)
        throw new errorMiddleware_1.AppError('Notification not found', 404);
    if (notif.createdById !== currentUserId && !req.user.isSuperAdmin) {
        throw new errorMiddleware_1.AppError('Permission denied', 403);
    }
    await checkDelay(notif, 'delete', roleName);
    // Delete attached files from disk
    if (notif.files) {
        const fileList = notif.files;
        for (const f of fileList) {
            try {
                const fs = await Promise.resolve().then(() => __importStar(require('fs')));
                const filePath = path_1.default.join(process.cwd(), f.path);
                if (fs.existsSync(filePath))
                    fs.unlinkSync(filePath);
            }
            catch {
                // ignore file deletion errors
            }
        }
    }
    await app_1.prisma.userNotification.delete({ where: { id } });
    res.json({ success: true, message: 'Notification deleted' });
};
exports.deleteUserNotification = deleteUserNotification;
// ---------------------------------------------------------------------------
// GET /user-notifications/permissions
// ---------------------------------------------------------------------------
const DEFAULT_PERMISSIONS = {
    edit: { delays: {} },
    delete: { delays: {} },
};
const getNotificationPermissions = async (_req, res) => {
    const setting = await app_1.prisma.appSetting.findUnique({ where: { key: 'notification_permissions' } });
    let data = DEFAULT_PERMISSIONS;
    if (setting?.value) {
        try {
            data = JSON.parse(setting.value);
        }
        catch {
            // use default
        }
    }
    res.json({ success: true, data });
};
exports.getNotificationPermissions = getNotificationPermissions;
// ---------------------------------------------------------------------------
// POST /user-notifications/:id/read
// ---------------------------------------------------------------------------
const markNotificationRead = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const notif = await app_1.prisma.userNotification.findUnique({ where: { id } });
    if (!notif)
        throw new errorMiddleware_1.AppError('Notification not found', 404);
    let readBy = [];
    try {
        const raw = notif.readBy;
        readBy = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []);
    }
    catch {
        readBy = [];
    }
    if (!readBy.includes(userId)) {
        readBy.push(userId);
        await app_1.prisma.userNotification.update({
            where: { id },
            data: { readBy: JSON.stringify(readBy) },
        });
    }
    res.json({ success: true });
};
exports.markNotificationRead = markNotificationRead;
// ---------------------------------------------------------------------------
// PUT /user-notifications/permissions (super admin only)
// ---------------------------------------------------------------------------
const updateNotificationPermissions = async (req, res) => {
    const config = req.body;
    await app_1.prisma.appSetting.upsert({
        where: { key: 'notification_permissions' },
        update: { value: JSON.stringify(config), updatedBy: req.user?.userId },
        create: { key: 'notification_permissions', value: JSON.stringify(config), category: 'notifications' },
    });
    res.json({ success: true, data: config });
};
exports.updateNotificationPermissions = updateNotificationPermissions;
//# sourceMappingURL=userNotificationController.js.map