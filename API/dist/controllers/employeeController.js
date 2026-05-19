"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.updateCustomFields = exports.resetEmployeePassword = exports.deleteEmployee = exports.toggleEmployeeStatus = exports.updateEmployee = exports.createEmployee = exports.getEmployeeById = exports.getEmployees = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const app_1 = require("../app");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const helpers_1 = require("../utils/helpers");
const emailService_1 = require("../services/emailService");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const EMPLOYEE_SORT_FIELDS = {
    name: 'firstName', department: 'department', joiningDate: 'joiningDate',
    status: 'status', createdAt: 'createdAt',
};
const getEmployees = async (req, res) => {
    const { page = '1', limit = '10', search, status, department, roleId, sortBy, sortDir } = req.query;
    const take = parseInt(limit);
    const pg = parseInt(page);
    const { skip } = (0, helpers_1.paginate)(pg, take);
    const bizFilter = req.user?.isSuperAdmin ? {} : (req.user?.businessId ? { businessId: req.user.businessId } : {});
    const where = { isSuperAdmin: false, ...bizFilter };
    if (status)
        where.status = status;
    if (department)
        where.department = { contains: department };
    if (roleId)
        where.roleId = roleId;
    if (search) {
        where.OR = [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
            { employeeId: { contains: search } },
        ];
    }
    const prismaField = EMPLOYEE_SORT_FIELDS[sortBy];
    const orderBy = prismaField
        ? { [prismaField]: (sortDir === 'desc' ? 'desc' : 'asc') }
        : { createdAt: 'desc' };
    const [employees, total] = await Promise.all([
        app_1.prisma.user.findMany({
            where,
            skip,
            take,
            orderBy,
            select: {
                id: true, employeeId: true, firstName: true, lastName: true, email: true, phone: true,
                department: true, designation: true, joiningDate: true, status: true, profilePhoto: true,
                role: { select: { id: true, name: true } },
                businessId: true, business: { select: { id: true, name: true } },
                lastLoginAt: true, createdAt: true,
            },
        }),
        app_1.prisma.user.count({ where }),
    ]);
    res.json({ success: true, data: employees, meta: (0, helpers_1.buildPaginationMeta)(total, pg, take) });
};
exports.getEmployees = getEmployees;
const getEmployeeById = async (req, res) => {
    const { id } = req.params;
    const employee = await app_1.prisma.user.findUnique({
        where: { id },
        include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
    if (!employee)
        throw new errorMiddleware_1.AppError('Employee not found', 404);
    res.json({ success: true, data: (0, helpers_1.sanitizeUser)(employee) });
};
exports.getEmployeeById = getEmployeeById;
const createEmployee = async (req, res) => {
    const { email, username, password, firstName, lastName, phone, department, designation, roleId, joiningDate, salary, address, city, state, country, sendWelcome, businessId: bodyBusinessId, } = req.body;
    // Pre-validate uniqueness with clear errors
    const existingEmail = await app_1.prisma.user.findUnique({ where: { email } });
    if (existingEmail)
        throw new errorMiddleware_1.AppError('An employee with this email address already exists', 409);
    const plainPassword = password || `HR@${Math.random().toString(36).slice(-8)}`;
    const passwordHash = await bcryptjs_1.default.hash(plainPassword, parseInt(process.env.BCRYPT_ROUNDS || '12'));
    // Generate unique employee ID (count ALL users to avoid collision with superadmin)
    const totalCount = await app_1.prisma.user.count();
    let empNum = totalCount + 1;
    let employeeId = (0, helpers_1.generateEmployeeId)(empNum);
    while (await app_1.prisma.user.findFirst({ where: { employeeId } })) {
        employeeId = (0, helpers_1.generateEmployeeId)(++empNum);
    }
    const profilePhoto = req.file ? `uploads/profiles/${req.file.filename}` : null;
    // Generate a unique username
    const baseUsername = (username || email.split('@')[0]).replace(/[^a-zA-Z0-9._-]/g, '');
    let finalUsername = baseUsername;
    let attempt = 1;
    while (await app_1.prisma.user.findUnique({ where: { username: finalUsername } })) {
        finalUsername = `${baseUsername}${attempt++}`;
    }
    const employee = await app_1.prisma.user.create({
        data: {
            email,
            username: finalUsername,
            passwordHash,
            firstName,
            lastName,
            phone,
            department,
            designation,
            roleId,
            joiningDate: joiningDate ? new Date(joiningDate) : null,
            salary: salary ? parseFloat(salary) : null,
            address,
            city,
            state,
            country: country || 'India',
            employeeId,
            profilePhoto,
            createdBy: req.user?.userId,
            businessId: req.user?.isSuperAdmin ? (bodyBusinessId || undefined) : (req.user?.businessId ?? undefined),
        },
        include: { role: true },
    });
    if (sendWelcome === 'true') {
        await (0, emailService_1.sendWelcomeEmail)(email, `${firstName} ${lastName}`, plainPassword, `${process.env.FRONTEND_URL}/login`).catch(() => { });
    }
    await app_1.prisma.auditLog.create({
        data: { userId: req.user?.userId, userEmail: req.user?.email, action: 'CREATE', module: 'employees', recordId: employee.id },
    });
    res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: (0, helpers_1.sanitizeUser)(employee),
    });
};
exports.createEmployee = createEmployee;
const updateEmployee = async (req, res) => {
    const { id } = req.params;
    const existing = await app_1.prisma.user.findUnique({ where: { id } });
    if (!existing)
        throw new errorMiddleware_1.AppError('Employee not found', 404);
    const { email, username, firstName, lastName, phone, department, designation, roleId, joiningDate, salary, address, city, state, country, businessId } = req.body;
    // Pre-validate uniqueness with clear errors
    if (email && email !== existing.email) {
        const emailConflict = await app_1.prisma.user.findUnique({ where: { email } });
        if (emailConflict)
            throw new errorMiddleware_1.AppError('An employee with this email address already exists', 409);
    }
    if (username && username !== existing.username) {
        const sanitized = username.replace(/[^a-zA-Z0-9._-]/g, '');
        const conflict = await app_1.prisma.user.findUnique({ where: { username: sanitized } });
        if (conflict)
            throw new errorMiddleware_1.AppError('Username is already taken, please choose a different one', 409);
    }
    const updates = {
        ...(email && { email }),
        ...(username && { username: username.replace(/[^a-zA-Z0-9._-]/g, '') }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(department !== undefined && { department }),
        ...(designation !== undefined && { designation }),
        ...(roleId && { roleId }),
        ...(joiningDate && { joiningDate: new Date(joiningDate) }),
        ...(salary !== undefined && { salary: parseFloat(salary) }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(country !== undefined && { country }),
        ...(req.user?.isSuperAdmin && businessId ? { businessId } : {}),
    };
    if (req.file) {
        updates.profilePhoto = `uploads/profiles/${req.file.filename}`;
        if (existing.profilePhoto) {
            const oldPath = path_1.default.join(process.cwd(), existing.profilePhoto);
            if (fs_1.default.existsSync(oldPath))
                fs_1.default.unlinkSync(oldPath);
        }
    }
    const employee = await app_1.prisma.user.update({
        where: { id },
        data: updates,
        include: { role: true },
    });
    res.json({ success: true, message: 'Employee updated', data: (0, helpers_1.sanitizeUser)(employee) });
};
exports.updateEmployee = updateEmployee;
const toggleEmployeeStatus = async (req, res) => {
    const { id } = req.params;
    const employee = await app_1.prisma.user.findUnique({ where: { id } });
    if (!employee)
        throw new errorMiddleware_1.AppError('Employee not found', 404);
    const newStatus = employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = await app_1.prisma.user.update({ where: { id }, data: { status: newStatus } });
    await app_1.prisma.auditLog.create({
        data: {
            userId: req.user?.userId,
            userEmail: req.user?.email,
            action: 'STATUS_CHANGE',
            module: 'employees',
            recordId: id,
            oldValues: { status: employee.status },
            newValues: { status: newStatus },
        },
    });
    res.json({ success: true, message: `Employee ${newStatus.toLowerCase()}`, data: { status: updated.status } });
};
exports.toggleEmployeeStatus = toggleEmployeeStatus;
const deleteEmployee = async (req, res) => {
    const { id } = req.params;
    if (id === req.user?.userId)
        throw new errorMiddleware_1.AppError('Cannot delete your own account', 400);
    await app_1.prisma.user.findUniqueOrThrow({ where: { id } });
    await app_1.prisma.user.delete({ where: { id } });
    await app_1.prisma.auditLog.create({
        data: { userId: req.user?.userId, userEmail: req.user?.email, action: 'DELETE', module: 'employees', recordId: id },
    });
    res.json({ success: true, message: 'Employee deleted' });
};
exports.deleteEmployee = deleteEmployee;
const resetEmployeePassword = async (req, res) => {
    const { id } = req.params;
    const { newPassword: providedPassword } = req.body;
    const employee = await app_1.prisma.user.findUnique({ where: { id } });
    if (!employee)
        throw new errorMiddleware_1.AppError('Employee not found', 404);
    const newPassword = providedPassword || `HR@${Math.random().toString(36).slice(-8)}`;
    const passwordHash = await bcryptjs_1.default.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12'));
    await app_1.prisma.user.update({ where: { id }, data: { passwordHash, refreshToken: null } });
    res.json({ success: true, message: 'Password reset successfully', data: { newPassword } });
};
exports.resetEmployeePassword = resetEmployeePassword;
const updateCustomFields = async (req, res) => {
    const { id } = req.params;
    const { fieldName, value } = req.body;
    const user = await app_1.prisma.user.findUniqueOrThrow({ where: { id } });
    const updated = await app_1.prisma.user.update({
        where: { id },
        data: { customFields: { ...(user.customFields || {}), [fieldName]: value } },
    });
    res.json({ success: true, data: updated.customFields });
};
exports.updateCustomFields = updateCustomFields;
const updateProfile = async (req, res) => {
    const userId = req.user.userId;
    const { firstName, lastName, phone, address, city, state } = req.body;
    const updates = { firstName, lastName, phone, address, city, state };
    if (req.file) {
        const existing = await app_1.prisma.user.findUnique({ where: { id: userId } });
        if (existing?.profilePhoto) {
            const oldPath = path_1.default.join(process.cwd(), existing.profilePhoto);
            if (fs_1.default.existsSync(oldPath))
                fs_1.default.unlinkSync(oldPath);
        }
        updates.profilePhoto = `uploads/profiles/${req.file.filename}`;
    }
    const user = await app_1.prisma.user.update({ where: { id: userId }, data: updates, include: { role: true } });
    res.json({ success: true, data: (0, helpers_1.sanitizeUser)(user) });
};
exports.updateProfile = updateProfile;
//# sourceMappingURL=employeeController.js.map