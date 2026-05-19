"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBusinessesDropdown = exports.toggleBusinessStatus = exports.undoDeleteBusiness = exports.deleteBusiness = exports.updateBusiness = exports.createBusiness = exports.getBusiness = exports.getBusinesses = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const app_1 = require("../app");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const helpers_1 = require("../utils/helpers");
// GET /businesses
const getBusinesses = async (req, res) => {
    const page = Math.max(1, parseInt(String(req.query.page || '1')));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'))));
    const search = String(req.query.search || '').trim();
    // Background cleanup: hard-delete businesses whose grace period has elapsed
    await app_1.prisma.business.updateMany({
        where: { deleteScheduledAt: { lt: new Date() }, deletedAt: null },
        data: { deletedAt: new Date() },
    });
    const searchClause = search
        ? { OR: [{ name: { contains: search } }, { code: { contains: search } }, { adminEmail: { contains: search } }] }
        : {};
    const statusFilter = String(req.query.status || '').trim().toUpperCase();
    const where = { deletedAt: null, ...searchClause };
    if (statusFilter === 'ACTIVE' || statusFilter === 'INACTIVE') {
        where.status = statusFilter;
    }
    const [total, data] = await Promise.all([
        app_1.prisma.business.count({ where }),
        app_1.prisma.business.findMany({
            where,
            include: {
                _count: { select: { users: true, candidates: true, clients: true, jobOpenings: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
    ]);
    res.json({ success: true, data, meta: (0, helpers_1.buildPaginationMeta)(total, page, limit) });
};
exports.getBusinesses = getBusinesses;
// GET /businesses/:id
const getBusiness = async (req, res) => {
    const { id } = req.params;
    const business = await app_1.prisma.business.findUnique({
        where: { id },
        include: {
            _count: { select: { users: true, candidates: true, clients: true, jobOpenings: true } },
            users: {
                select: {
                    id: true, firstName: true, lastName: true, email: true, status: true,
                    createdAt: true, role: { select: { name: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 100,
            },
        },
    });
    if (!business)
        throw new errorMiddleware_1.AppError('Business not found', 404);
    res.json({ success: true, data: business });
};
exports.getBusiness = getBusiness;
// POST /businesses
const createBusiness = async (req, res) => {
    const { name, code, adminEmail, adminPassword, adminFirstName, adminLastName } = req.body;
    if (!name || !code || !adminEmail || !adminPassword || !adminFirstName || !adminLastName) {
        throw new errorMiddleware_1.AppError('name, code, adminEmail, adminPassword, adminFirstName, adminLastName are required', 400);
    }
    const existing = await app_1.prisma.business.findUnique({ where: { code } });
    if (existing)
        throw new errorMiddleware_1.AppError('Business code already exists', 409);
    const existingEmail = await app_1.prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingEmail)
        throw new errorMiddleware_1.AppError('Admin email already in use', 409);
    // Find or create admin role
    let adminRole = await app_1.prisma.role.findFirst({ where: { name: 'admin' } });
    if (!adminRole) {
        adminRole = await app_1.prisma.role.create({ data: { name: 'admin', isSystem: true } });
    }
    const passwordHash = await bcryptjs_1.default.hash(adminPassword, 12);
    const username = adminEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + '_' + Date.now().toString().slice(-4);
    const business = await app_1.prisma.business.create({
        data: {
            name,
            code: code.toUpperCase(),
            adminEmail,
            status: 'ACTIVE',
            users: {
                create: {
                    email: adminEmail,
                    username,
                    passwordHash,
                    firstName: adminFirstName,
                    lastName: adminLastName,
                    roleId: adminRole.id,
                    status: 'ACTIVE',
                },
            },
        },
        include: { _count: { select: { users: true } } },
    });
    res.status(201).json({ success: true, data: business });
};
exports.createBusiness = createBusiness;
// PUT /businesses/:id
const updateBusiness = async (req, res) => {
    const { id } = req.params;
    const { name, status, logo } = req.body;
    const business = await app_1.prisma.business.update({
        where: { id },
        data: { ...(name && { name }), ...(status && { status }), ...(logo !== undefined && { logo }) },
    });
    res.json({ success: true, data: business });
};
exports.updateBusiness = updateBusiness;
// DELETE /businesses/:id — soft delete with 24hr grace period
const deleteBusiness = async (req, res) => {
    const { id } = req.params;
    const business = await app_1.prisma.business.findFirst({ where: { id, deletedAt: null } });
    if (!business)
        throw new errorMiddleware_1.AppError('Business not found', 404);
    await app_1.prisma.business.update({
        where: { id },
        data: { deleteScheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    });
    res.json({ success: true, message: 'Business scheduled for deletion in 24 hours' });
};
exports.deleteBusiness = deleteBusiness;
// POST /businesses/:id/undo-delete — cancel scheduled deletion
const undoDeleteBusiness = async (req, res) => {
    const { id } = req.params;
    const business = await app_1.prisma.business.findFirst({ where: { id, deletedAt: null } });
    if (!business)
        throw new errorMiddleware_1.AppError('Business not found', 404);
    await app_1.prisma.business.update({
        where: { id },
        data: { deleteScheduledAt: null },
    });
    res.json({ success: true, message: 'Deletion cancelled' });
};
exports.undoDeleteBusiness = undoDeleteBusiness;
// PATCH /businesses/:id/toggle-status — toggle ACTIVE <-> INACTIVE
const toggleBusinessStatus = async (req, res) => {
    const { id } = req.params;
    const business = await app_1.prisma.business.findFirst({ where: { id, deletedAt: null } });
    if (!business)
        throw new errorMiddleware_1.AppError('Business not found', 404);
    const newStatus = business.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = await app_1.prisma.business.update({
        where: { id },
        data: { status: newStatus },
    });
    res.json({ success: true, data: updated, message: `Business ${newStatus === 'ACTIVE' ? 'enabled' : 'disabled'}` });
};
exports.toggleBusinessStatus = toggleBusinessStatus;
// GET /businesses/dropdown — lightweight list for dropdowns
const getBusinessesDropdown = async (_req, res) => {
    const businesses = await app_1.prisma.business.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, name: true, code: true, adminEmail: true },
        orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: businesses });
};
exports.getBusinessesDropdown = getBusinessesDropdown;
//# sourceMappingURL=businessController.js.map