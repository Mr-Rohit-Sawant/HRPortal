"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadCustomFieldFiles = exports.markAllNotificationsRead = exports.markNotificationRead = exports.getNotifications = exports.getAuditLogs = exports.reorderColumns = exports.deleteColumnDefinition = exports.upsertColumnDefinition = exports.getColumnDefinitions = exports.getPermissions = exports.cloneRole = exports.deleteRole = exports.updateRole = exports.createRole = exports.getRoles = exports.uploadFont = exports.uploadFavicon = exports.uploadLogo = exports.updateAppSettings = exports.getAppSettings = void 0;
const app_1 = require("../app");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const helpers_1 = require("../utils/helpers");
const cache_1 = require("../utils/cache");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function settingsMapToResponse(map) {
    return {
        appName: map['app_name'] ?? 'HR Recruitment System',
        primaryColor: map['primary_color'] ?? '#1E40AF',
        sidebarColor: map['sidebar_color'] ?? '#0F172A',
        fontFamily: map['font_family'] ?? 'Inter',
        accentColor: map['accent_color'] ?? '#3B82F6',
        logo: map['app_logo'] ?? '',
        favicon: map['app_favicon'] ?? '',
    };
}
const SETTINGS_CACHE_KEY = 'app_settings';
async function fetchAndCacheSettings() {
    const settings = await app_1.prisma.appSetting.findMany();
    const map = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
    const data = settingsMapToResponse(map);
    cache_1.settingsCache.set(SETTINGS_CACHE_KEY, data, cache_1.SETTINGS_TTL);
    return data;
}
// --- Theme & App Settings ---
const getAppSettings = async (_req, res) => {
    const cached = cache_1.settingsCache.get(SETTINGS_CACHE_KEY);
    if (cached)
        return res.json({ success: true, data: cached });
    const data = await fetchAndCacheSettings();
    res.json({ success: true, data });
};
exports.getAppSettings = getAppSettings;
const updateAppSettings = async (req, res) => {
    const fieldMap = {
        appName: 'app_name',
        primaryColor: 'primary_color',
        sidebarColor: 'sidebar_color',
        fontFamily: 'font_family',
        accentColor: 'accent_color',
    };
    const updates = {};
    for (const [camel, snake] of Object.entries(fieldMap)) {
        const val = req.body[camel];
        if (val !== undefined && val !== null)
            updates[snake] = String(val);
    }
    if (req.file) {
        const logoPath = `uploads/logos/${req.file.filename}`;
        const existing = await app_1.prisma.appSetting.findUnique({ where: { key: 'app_logo' } });
        if (existing?.value) {
            const oldPath = path_1.default.join(process.cwd(), existing.value);
            if (fs_1.default.existsSync(oldPath))
                fs_1.default.unlinkSync(oldPath);
        }
        updates['app_logo'] = logoPath;
    }
    if (Object.keys(updates).length > 0) {
        await Promise.all(Object.entries(updates).map(([key, value]) => app_1.prisma.appSetting.upsert({
            where: { key },
            update: { value, updatedBy: req.user?.userId },
            create: { key, value, category: 'general' },
        })));
    }
    await app_1.prisma.auditLog.create({
        data: { userId: req.user?.userId, userEmail: req.user?.email, action: 'UPDATE', module: 'settings', newValues: updates },
    });
    const data = await fetchAndCacheSettings();
    res.json({ success: true, data });
};
exports.updateAppSettings = updateAppSettings;
const uploadLogo = async (req, res) => {
    if (!req.file)
        throw new errorMiddleware_1.AppError('No logo file uploaded', 400);
    const logoPath = `uploads/logos/${req.file.filename}`;
    const existing = await app_1.prisma.appSetting.findUnique({ where: { key: 'app_logo' } });
    if (existing?.value) {
        const oldPath = path_1.default.join(process.cwd(), existing.value);
        if (fs_1.default.existsSync(oldPath))
            fs_1.default.unlinkSync(oldPath);
    }
    await app_1.prisma.appSetting.upsert({
        where: { key: 'app_logo' },
        update: { value: logoPath },
        create: { key: 'app_logo', value: logoPath, category: 'branding' },
    });
    cache_1.settingsCache.del(SETTINGS_CACHE_KEY);
    res.json({ success: true, data: { logoPath } });
};
exports.uploadLogo = uploadLogo;
const uploadFavicon = async (req, res) => {
    if (!req.file)
        throw new errorMiddleware_1.AppError('No favicon file uploaded', 400);
    const faviconPath = `uploads/favicons/${req.file.filename}`;
    const existing = await app_1.prisma.appSetting.findUnique({ where: { key: 'app_favicon' } });
    if (existing?.value) {
        const oldPath = path_1.default.join(process.cwd(), existing.value);
        if (fs_1.default.existsSync(oldPath))
            fs_1.default.unlinkSync(oldPath);
    }
    await app_1.prisma.appSetting.upsert({
        where: { key: 'app_favicon' },
        update: { value: faviconPath },
        create: { key: 'app_favicon', value: faviconPath, category: 'branding' },
    });
    cache_1.settingsCache.del(SETTINGS_CACHE_KEY);
    res.json({ success: true, data: { faviconPath } });
};
exports.uploadFavicon = uploadFavicon;
const uploadFont = async (req, res) => {
    if (!req.file)
        throw new errorMiddleware_1.AppError('No font file uploaded', 400);
    const fontName = req.body.fontName || path_1.default.basename(req.file.originalname, path_1.default.extname(req.file.originalname));
    const fontPath = `uploads/fonts/${req.file.filename}`;
    await app_1.prisma.appSetting.upsert({
        where: { key: `font_custom_${fontName}` },
        update: { value: fontPath },
        create: { key: `font_custom_${fontName}`, value: fontPath, category: 'fonts' },
    });
    res.json({ success: true, data: { fontName, fontPath } });
};
exports.uploadFont = uploadFont;
// --- Role Management ---
const getRoles = async (_req, res) => {
    const roles = await app_1.prisma.role.findMany({
        include: {
            permissions: { include: { permission: true } },
            _count: { select: { users: true } },
        },
    });
    res.json({ success: true, data: roles });
};
exports.getRoles = getRoles;
const createRole = async (req, res) => {
    const { name, description, permissionIds } = req.body;
    const role = await app_1.prisma.role.create({
        data: {
            name: name.toLowerCase().replace(/\s+/g, '_'),
            description,
            permissions: {
                create: permissionIds.map((id) => ({ permissionId: id })),
            },
        },
        include: { permissions: { include: { permission: true } } },
    });
    res.status(201).json({ success: true, data: role });
};
exports.createRole = createRole;
const updateRole = async (req, res) => {
    const { id } = req.params;
    const role = await app_1.prisma.role.findUniqueOrThrow({ where: { id } });
    if (role.isSystem && !req.user?.isSuperAdmin)
        throw new errorMiddleware_1.AppError('System roles cannot be modified', 400);
    const { name, description, permissionIds } = req.body;
    // Remove existing and reassign
    await app_1.prisma.rolePermission.deleteMany({ where: { roleId: id } });
    const updated = await app_1.prisma.role.update({
        where: { id },
        data: {
            name: name.toLowerCase().replace(/\s+/g, '_'),
            description,
            permissions: {
                create: permissionIds.map((pid) => ({ permissionId: pid })),
            },
        },
        include: { permissions: { include: { permission: true } } },
    });
    res.json({ success: true, data: updated });
};
exports.updateRole = updateRole;
const deleteRole = async (req, res) => {
    const { id } = req.params;
    const role = await app_1.prisma.role.findUniqueOrThrow({ where: { id } });
    if (role.isSystem && !req.user?.isSuperAdmin)
        throw new errorMiddleware_1.AppError('System roles cannot be deleted', 400);
    const usersCount = await app_1.prisma.user.count({ where: { roleId: id } });
    if (usersCount > 0)
        throw new errorMiddleware_1.AppError(`Cannot delete role assigned to ${usersCount} users`, 400);
    await app_1.prisma.role.delete({ where: { id } });
    res.json({ success: true, message: 'Role deleted' });
};
exports.deleteRole = deleteRole;
const cloneRole = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const source = await app_1.prisma.role.findUniqueOrThrow({
        where: { id },
        include: { permissions: true },
    });
    const cloned = await app_1.prisma.role.create({
        data: {
            name: name || `${source.name}_copy`,
            description: `Cloned from ${source.name}`,
            permissions: {
                create: source.permissions.map((p) => ({ permissionId: p.permissionId })),
            },
        },
        include: { permissions: { include: { permission: true } } },
    });
    res.status(201).json({ success: true, data: cloned });
};
exports.cloneRole = cloneRole;
const getPermissions = async (_req, res) => {
    const permissions = await app_1.prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] });
    res.json({ success: true, data: permissions });
};
exports.getPermissions = getPermissions;
// --- Dynamic Column Definitions ---
const getColumnDefinitions = async (req, res) => {
    const { module } = req.query;
    const columns = await app_1.prisma.columnDefinition.findMany({
        where: { ...(module ? { module: module } : {}) },
        orderBy: { order: 'asc' },
    });
    res.json({ success: true, data: columns });
};
exports.getColumnDefinitions = getColumnDefinitions;
const upsertColumnDefinition = async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    let column;
    if (id) {
        column = await app_1.prisma.columnDefinition.update({ where: { id }, data });
    }
    else {
        column = await app_1.prisma.columnDefinition.create({ data: { ...data, createdBy: req.user?.userId } });
    }
    res.json({ success: true, data: column });
};
exports.upsertColumnDefinition = upsertColumnDefinition;
const deleteColumnDefinition = async (req, res) => {
    const { id } = req.params;
    const col = await app_1.prisma.columnDefinition.findUniqueOrThrow({ where: { id } });
    if (col.isRequired)
        throw new errorMiddleware_1.AppError('Required columns cannot be deleted', 400);
    await app_1.prisma.columnDefinition.delete({ where: { id } });
    res.json({ success: true, message: 'Column deleted' });
};
exports.deleteColumnDefinition = deleteColumnDefinition;
const reorderColumns = async (req, res) => {
    const { columns } = req.body;
    await Promise.all(columns.map((col) => app_1.prisma.columnDefinition.update({ where: { id: col.id }, data: { order: col.order } })));
    res.json({ success: true, message: 'Columns reordered' });
};
exports.reorderColumns = reorderColumns;
// --- Audit Logs ---
const getAuditLogs = async (req, res) => {
    const { page = '1', limit = '20', module, userId, action, search, startDate, endDate } = req.query;
    const take = parseInt(limit);
    const pg = parseInt(page);
    const { skip } = (0, helpers_1.paginate)(pg, take);
    const where = {};
    if (module)
        where.module = module;
    if (userId)
        where.userId = userId;
    if (action)
        where.action = action;
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate)
            where.createdAt.gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            where.createdAt.lte = end;
        }
    }
    if (search) {
        where.OR = [
            { userEmail: { contains: search } },
            { module: { contains: search } },
            { action: { contains: search } },
            { description: { contains: search } },
        ];
    }
    const [logs, total] = await Promise.all([
        app_1.prisma.auditLog.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { firstName: true, lastName: true } } },
        }),
        app_1.prisma.auditLog.count({ where }),
    ]);
    res.json({ success: true, data: logs, meta: (0, helpers_1.buildPaginationMeta)(total, pg, take) });
};
exports.getAuditLogs = getAuditLogs;
// --- Notifications ---
const getNotifications = async (req, res) => {
    const notifications = await app_1.prisma.notification.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });
    res.json({ success: true, data: notifications });
};
exports.getNotifications = getNotifications;
const markNotificationRead = async (req, res) => {
    const { id } = req.params;
    await app_1.prisma.notification.update({ where: { id }, data: { isRead: true } });
    res.json({ success: true });
};
exports.markNotificationRead = markNotificationRead;
const markAllNotificationsRead = async (req, res) => {
    await app_1.prisma.notification.updateMany({ where: { userId: req.user.userId }, data: { isRead: true } });
    res.json({ success: true });
};
exports.markAllNotificationsRead = markAllNotificationsRead;
// --- Custom Field File Upload ---
const uploadCustomFieldFiles = async (req, res) => {
    const files = req.files;
    if (!files || files.length === 0) {
        res.status(400).json({ success: false, message: 'No files uploaded' });
        return;
    }
    const result = files.map((f) => ({
        name: f.originalname,
        path: `custom/${f.filename}`,
        size: f.size,
        mimeType: f.mimetype,
    }));
    res.json({ success: true, data: result });
};
exports.uploadCustomFieldFiles = uploadCustomFieldFiles;
//# sourceMappingURL=settingsController.js.map