"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBugReportSettings = exports.getBugReportSettings = exports.deleteStatusLabel = exports.updateStatusLabel = exports.createStatusLabel = exports.getStatusLabels = exports.deleteBugReport = exports.updateBugReport = exports.createBugReport = exports.getBugReportById = exports.getBugReports = void 0;
const app_1 = require("../app");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const helpers_1 = require("../utils/helpers");
const SETTING_DISABLED_ALL = 'bug_report.disabled_all';
const SETTING_DISABLED_SUPERADMIN = 'bug_report.disabled_superadmin';
const USER_SELECT = { id: true, firstName: true, lastName: true, email: true };
// ── LIST ──────────────────────────────────────────────────────────────────────
const getBugReports = async (req, res) => {
    const page = Math.max(1, parseInt(String(req.query.page || '1')));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'))));
    const search = String(req.query.search || '').trim();
    const type = String(req.query.type || '').trim();
    const priority = String(req.query.priority || '').trim();
    const severity = String(req.query.severity || '').trim();
    const status = String(req.query.status || '').trim();
    const module = String(req.query.module || '').trim();
    const browser = String(req.query.browser || '').trim();
    const environment = String(req.query.environment || '').trim();
    const device = String(req.query.device || '').trim();
    const reproducibility = String(req.query.reproducibility || '').trim();
    const businessId = String(req.query.businessId || '').trim();
    const assignedToId = String(req.query.assignedToId || '').trim();
    const createdById = String(req.query.createdById || '').trim();
    const dateFrom = String(req.query.dateFrom || '').trim();
    const dateTo = String(req.query.dateTo || '').trim();
    const hasAttachment = String(req.query.hasAttachment || '').trim();
    const sortField = String(req.query.sortField || 'createdAt').trim();
    const sortDir = (String(req.query.sortDir || 'desc').trim() === 'asc' ? 'asc' : 'desc');
    const ALLOWED_SORT = ['createdAt', 'updatedAt', 'priority', 'status', 'type', 'severity', 'title', 'reportedByEmail'];
    const orderField = ALLOWED_SORT.includes(sortField) ? sortField : 'createdAt';
    const where = {};
    if (search) {
        where.OR = [
            { description: { contains: search } },
            { title: { contains: search } },
            { reportedByEmail: { contains: search } },
            { reportedByName: { contains: search } },
            { module: { contains: search } },
        ];
    }
    if (type)
        where.type = type;
    if (priority)
        where.priority = priority;
    if (severity)
        where.severity = severity;
    if (status)
        where.status = status;
    if (module)
        where.module = module;
    if (browser)
        where.browser = browser;
    if (environment)
        where.environment = environment;
    if (device)
        where.device = device;
    if (reproducibility)
        where.reproducibility = reproducibility;
    if (businessId)
        where.businessId = businessId;
    if (assignedToId)
        where.assignedToId = assignedToId;
    if (createdById)
        where.userId = createdById;
    if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom)
            where.createdAt.gte = new Date(dateFrom);
        if (dateTo)
            where.createdAt.lte = new Date(dateTo + 'T23:59:59Z');
    }
    if (hasAttachment === 'true')
        where.NOT = { files: null };
    if (hasAttachment === 'false')
        where.files = null;
    const [total, data] = await Promise.all([
        app_1.prisma.bugReport.count({ where }),
        app_1.prisma.bugReport.findMany({
            where,
            include: {
                business: { select: { id: true, name: true } },
                user: { select: USER_SELECT },
                assignedTo: { select: USER_SELECT },
            },
            orderBy: { [orderField]: sortDir },
            skip: (page - 1) * limit,
            take: limit,
        }),
    ]);
    res.json({ success: true, data, meta: (0, helpers_1.buildPaginationMeta)(total, page, limit) });
};
exports.getBugReports = getBugReports;
// ── GET BY ID ─────────────────────────────────────────────────────────────────
const getBugReportById = async (req, res) => {
    const { id } = req.params;
    const report = await app_1.prisma.bugReport.findUnique({
        where: { id },
        include: {
            business: { select: { id: true, name: true } },
            user: { select: USER_SELECT },
            assignedTo: { select: USER_SELECT },
        },
    });
    if (!report)
        throw new errorMiddleware_1.AppError('Bug report not found', 404);
    res.json({ success: true, data: report });
};
exports.getBugReportById = getBugReportById;
// ── CREATE ────────────────────────────────────────────────────────────────────
const createBugReport = async (req, res) => {
    const { type, title, description, priority, severity, module: mod, browser, environment, device, reproducibility, tags } = req.body;
    if (!description || !String(description).trim())
        throw new errorMiddleware_1.AppError('Description is required', 400);
    const files = req.files || [];
    const fileMeta = files.map((f) => ({
        filename: f.filename, originalName: f.originalname,
        mimeType: f.mimetype, size: f.size,
        url: `/uploads/bug-reports/${f.filename}`,
    }));
    const authUser = req.user;
    let reportedByEmail = String(req.body.reportedByEmail || '').trim();
    let reportedByName = String(req.body.reportedByName || '').trim();
    let userId = null;
    let businessId = null;
    let businessName = String(req.body.businessName || '').trim() || null;
    if (authUser?.userId) {
        const dbUser = await app_1.prisma.user.findUnique({
            where: { id: authUser.userId },
            include: { business: { select: { id: true, name: true } } },
        });
        if (dbUser) {
            userId = dbUser.id;
            reportedByEmail = reportedByEmail || dbUser.email;
            reportedByName = reportedByName || `${dbUser.firstName} ${dbUser.lastName}`.trim();
            if (dbUser.business) {
                businessId = dbUser.business.id;
                businessName = dbUser.business.name;
            }
        }
    }
    if (!reportedByEmail)
        reportedByEmail = 'anonymous';
    let parsedTags = null;
    if (tags) {
        try {
            parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        }
        catch {
            parsedTags = null;
        }
    }
    const report = await app_1.prisma.bugReport.create({
        data: {
            type: type || 'Bug',
            title: title ? String(title).trim() : null,
            description: String(description).trim(),
            status: 'open',
            priority: priority || 'medium',
            severity: severity || null,
            module: mod ? String(mod).trim() : null,
            browser: browser ? String(browser).trim() : null,
            environment: environment ? String(environment).trim() : null,
            device: device ? String(device).trim() : null,
            reproducibility: reproducibility ? String(reproducibility).trim() : null,
            tags: parsedTags ?? undefined,
            reportedByEmail, reportedByName: reportedByName || null,
            userId, businessId, businessName,
            files: fileMeta.length ? fileMeta : undefined,
        },
    });
    res.status(201).json({ success: true, data: report });
};
exports.createBugReport = createBugReport;
// ── UPDATE ────────────────────────────────────────────────────────────────────
const updateBugReport = async (req, res) => {
    const { id } = req.params;
    const existing = await app_1.prisma.bugReport.findUnique({ where: { id } });
    if (!existing)
        throw new errorMiddleware_1.AppError('Bug report not found', 404);
    const { priority, type, status, title, description, severity, module: mod, browser, environment, device, reproducibility, resolution, assignedToId, tags } = req.body;
    let parsedTags = undefined;
    if (tags !== undefined) {
        try {
            parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        }
        catch {
            parsedTags = [];
        }
    }
    const updated = await app_1.prisma.bugReport.update({
        where: { id },
        data: {
            ...(priority !== undefined && { priority }),
            ...(type !== undefined && { type }),
            ...(status !== undefined && { status }),
            ...(title !== undefined && { title: title ? String(title).trim() : null }),
            ...(description !== undefined && { description: String(description).trim() }),
            ...(severity !== undefined && { severity: severity || null }),
            ...(mod !== undefined && { module: mod || null }),
            ...(browser !== undefined && { browser: browser || null }),
            ...(environment !== undefined && { environment: environment || null }),
            ...(device !== undefined && { device: device || null }),
            ...(reproducibility !== undefined && { reproducibility: reproducibility || null }),
            ...(resolution !== undefined && { resolution: resolution || null }),
            ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
            ...(parsedTags !== undefined && { tags: parsedTags }),
        },
        include: {
            business: { select: { id: true, name: true } },
            user: { select: USER_SELECT },
            assignedTo: { select: USER_SELECT },
        },
    });
    res.json({ success: true, data: updated });
};
exports.updateBugReport = updateBugReport;
// ── DELETE ────────────────────────────────────────────────────────────────────
const deleteBugReport = async (req, res) => {
    const { id } = req.params;
    const existing = await app_1.prisma.bugReport.findUnique({ where: { id } });
    if (!existing)
        throw new errorMiddleware_1.AppError('Bug report not found', 404);
    await app_1.prisma.bugReport.delete({ where: { id } });
    res.json({ success: true, message: 'Bug report deleted' });
};
exports.deleteBugReport = deleteBugReport;
// ── STATUS LABELS ─────────────────────────────────────────────────────────────
const getStatusLabels = async (req, res) => {
    const businessId = req.user?.isSuperAdmin
        ? (String(req.query.businessId || '').trim() || undefined)
        : (req.user?.businessId ?? undefined);
    const labels = await app_1.prisma.bugStatusLabel.findMany({
        where: {
            isArchived: false,
            ...(businessId ? { businessId } : { businessId: null }),
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    // Return default labels if none exist for this business
    if (labels.length === 0) {
        const defaults = [
            { id: 'open', name: 'Open', color: '#3B82F6', order: 0 },
            { id: 'in_progress', name: 'In Progress', color: '#F59E0B', order: 1 },
            { id: 'qa_testing', name: 'QA Testing', color: '#8B5CF6', order: 2 },
            { id: 'need_info', name: 'Need More Info', color: '#EC4899', order: 3 },
            { id: 'on_hold', name: 'On Hold', color: '#6B7280', order: 4 },
            { id: 'rejected', name: 'Rejected', color: '#EF4444', order: 5 },
            { id: 'completed', name: 'Completed', color: '#10B981', order: 6 },
        ];
        return res.json({ success: true, data: defaults, isDefault: true });
    }
    res.json({ success: true, data: labels });
};
exports.getStatusLabels = getStatusLabels;
const createStatusLabel = async (req, res) => {
    const { name, color, order, businessId: bodyBizId } = req.body;
    if (!name?.trim())
        throw new errorMiddleware_1.AppError('Label name is required', 400);
    const businessId = req.user?.isSuperAdmin
        ? (bodyBizId || null)
        : (req.user?.businessId ?? null);
    const maxOrder = await app_1.prisma.bugStatusLabel.aggregate({
        _max: { order: true },
        where: { businessId: businessId ?? undefined },
    });
    const label = await app_1.prisma.bugStatusLabel.create({
        data: {
            name: String(name).trim(),
            color: color || '#6B7280',
            order: order ?? ((maxOrder._max.order ?? -1) + 1),
            businessId,
        },
    });
    res.status(201).json({ success: true, data: label });
};
exports.createStatusLabel = createStatusLabel;
const updateStatusLabel = async (req, res) => {
    const { id } = req.params;
    const { name, color, order, isArchived } = req.body;
    const existing = await app_1.prisma.bugStatusLabel.findUnique({ where: { id } });
    if (!existing)
        throw new errorMiddleware_1.AppError('Status label not found', 404);
    const updated = await app_1.prisma.bugStatusLabel.update({
        where: { id },
        data: {
            ...(name !== undefined && { name: String(name).trim() }),
            ...(color !== undefined && { color }),
            ...(order !== undefined && { order }),
            ...(isArchived !== undefined && { isArchived }),
        },
    });
    res.json({ success: true, data: updated });
};
exports.updateStatusLabel = updateStatusLabel;
const deleteStatusLabel = async (req, res) => {
    const { id } = req.params;
    const existing = await app_1.prisma.bugStatusLabel.findUnique({ where: { id } });
    if (!existing)
        throw new errorMiddleware_1.AppError('Status label not found', 404);
    await app_1.prisma.bugStatusLabel.delete({ where: { id } });
    res.json({ success: true, message: 'Label deleted' });
};
exports.deleteStatusLabel = deleteStatusLabel;
// ── SETTINGS ──────────────────────────────────────────────────────────────────
const getBugReportSettings = async (_req, res) => {
    const settings = await app_1.prisma.appSetting.findMany({
        where: { key: { in: [SETTING_DISABLED_ALL, SETTING_DISABLED_SUPERADMIN] } },
    });
    const map = {};
    settings.forEach((s) => { map[s.key] = s.value ?? 'false'; });
    res.json({
        success: true,
        data: {
            disabledAll: (map[SETTING_DISABLED_ALL] ?? 'false') === 'true',
            disabledSuperAdmin: (map[SETTING_DISABLED_SUPERADMIN] ?? 'false') === 'true',
        },
    });
};
exports.getBugReportSettings = getBugReportSettings;
const updateBugReportSettings = async (req, res) => {
    const { disabledAll, disabledSuperAdmin } = req.body;
    const updates = [];
    if (disabledAll !== undefined)
        updates.push({ key: SETTING_DISABLED_ALL, value: disabledAll ? 'true' : 'false' });
    if (disabledSuperAdmin !== undefined)
        updates.push({ key: SETTING_DISABLED_SUPERADMIN, value: disabledSuperAdmin ? 'true' : 'false' });
    await Promise.all(updates.map((u) => app_1.prisma.appSetting.upsert({
        where: { key: u.key },
        update: { value: u.value, updatedBy: req.user?.userId },
        create: { key: u.key, value: u.value, category: 'bug_report', updatedBy: req.user?.userId },
    })));
    res.json({ success: true, message: 'Settings updated' });
};
exports.updateBugReportSettings = updateBugReportSettings;
//# sourceMappingURL=bugReportController.js.map