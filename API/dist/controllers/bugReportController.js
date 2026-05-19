"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBugReportSettings = exports.getBugReportSettings = exports.deleteBugReport = exports.updateBugReport = exports.createBugReport = exports.getBugReports = void 0;
const app_1 = require("../app");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const helpers_1 = require("../utils/helpers");
const SETTING_DISABLED_ALL = 'bug_report.disabled_all';
const SETTING_DISABLED_SUPERADMIN = 'bug_report.disabled_superadmin';
// GET /bug-reports — paginated list
const getBugReports = async (req, res) => {
    const page = Math.max(1, parseInt(String(req.query.page || '1')));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'))));
    const search = String(req.query.search || '').trim();
    const type = String(req.query.type || '').trim();
    const priority = String(req.query.priority || '').trim();
    const businessId = String(req.query.businessId || '').trim();
    const where = {};
    if (search) {
        where.OR = [
            { description: { contains: search } },
            { reportedByEmail: { contains: search } },
            { reportedByName: { contains: search } },
        ];
    }
    if (type)
        where.type = type;
    if (priority)
        where.priority = priority;
    if (businessId)
        where.businessId = businessId;
    const [total, data] = await Promise.all([
        app_1.prisma.bugReport.count({ where }),
        app_1.prisma.bugReport.findMany({
            where,
            include: { business: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
    ]);
    res.json({ success: true, data, meta: (0, helpers_1.buildPaginationMeta)(total, page, limit) });
};
exports.getBugReports = getBugReports;
// POST /bug-reports — create (supports multipart file upload)
const createBugReport = async (req, res) => {
    const { type, description, priority } = req.body;
    if (!description || !String(description).trim()) {
        throw new errorMiddleware_1.AppError('Description is required', 400);
    }
    const files = req.files || [];
    const fileMeta = files.map((f) => ({
        filename: f.filename,
        originalName: f.originalname,
        mimeType: f.mimetype,
        size: f.size,
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
    const report = await app_1.prisma.bugReport.create({
        data: {
            type: type || 'Bug',
            description: String(description).trim(),
            priority: priority || 'medium',
            reportedByEmail,
            reportedByName: reportedByName || null,
            userId,
            businessId,
            businessName,
            files: fileMeta.length ? fileMeta : undefined,
        },
    });
    res.status(201).json({ success: true, data: report });
};
exports.createBugReport = createBugReport;
// PATCH /bug-reports/:id — update priority/type
const updateBugReport = async (req, res) => {
    const { id } = req.params;
    const { priority, type } = req.body;
    const existing = await app_1.prisma.bugReport.findUnique({ where: { id } });
    if (!existing)
        throw new errorMiddleware_1.AppError('Bug report not found', 404);
    const updated = await app_1.prisma.bugReport.update({
        where: { id },
        data: {
            ...(priority && { priority }),
            ...(type && { type }),
        },
    });
    res.json({ success: true, data: updated });
};
exports.updateBugReport = updateBugReport;
// DELETE /bug-reports/:id — super admin only
const deleteBugReport = async (req, res) => {
    const { id } = req.params;
    const existing = await app_1.prisma.bugReport.findUnique({ where: { id } });
    if (!existing)
        throw new errorMiddleware_1.AppError('Bug report not found', 404);
    await app_1.prisma.bugReport.delete({ where: { id } });
    res.json({ success: true, message: 'Bug report deleted' });
};
exports.deleteBugReport = deleteBugReport;
// GET /bug-reports/settings — read settings (public so the button can decide visibility)
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
// PUT /bug-reports/settings — super admin only
const updateBugReportSettings = async (req, res) => {
    const { disabledAll, disabledSuperAdmin } = req.body;
    const updates = [];
    if (disabledAll !== undefined) {
        updates.push({ key: SETTING_DISABLED_ALL, value: disabledAll ? 'true' : 'false' });
    }
    if (disabledSuperAdmin !== undefined) {
        updates.push({ key: SETTING_DISABLED_SUPERADMIN, value: disabledSuperAdmin ? 'true' : 'false' });
    }
    await Promise.all(updates.map((u) => app_1.prisma.appSetting.upsert({
        where: { key: u.key },
        update: { value: u.value, updatedBy: req.user?.userId },
        create: { key: u.key, value: u.value, category: 'bug_report', updatedBy: req.user?.userId },
    })));
    res.json({ success: true, message: 'Settings updated' });
};
exports.updateBugReportSettings = updateBugReportSettings;
//# sourceMappingURL=bugReportController.js.map