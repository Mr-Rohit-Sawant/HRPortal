"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientDropdown = exports.updateCustomFields = exports.deleteClient = exports.toggleClientStatus = exports.updateClient = exports.createClient = exports.getClientById = exports.getClients = void 0;
const app_1 = require("../app");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const helpers_1 = require("../utils/helpers");
const CLIENT_SORT_FIELDS = {
    company: 'companyName', contactPerson: 'contactPerson',
    contractEndDate: 'contractEndDate', createdAt: 'createdAt',
};
const getClients = async (req, res) => {
    const { page = '1', limit = '10', search, isActive, sortBy, sortDir } = req.query;
    const take = parseInt(limit);
    const pg = parseInt(page);
    const { skip } = (0, helpers_1.paginate)(pg, take);
    const bizFilter = req.user?.isSuperAdmin ? {} : (req.user?.businessId ? { businessId: req.user.businessId } : {});
    const where = { ...bizFilter };
    if (isActive !== undefined)
        where.isActive = isActive === 'true';
    if (search) {
        where.OR = [
            { companyName: { contains: search } },
            { contactPerson: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
            { gstNumber: { contains: search } },
        ];
    }
    const prismaField = CLIENT_SORT_FIELDS[sortBy];
    const orderBy = prismaField
        ? { [prismaField]: (sortDir === 'desc' ? 'desc' : 'asc') }
        : { createdAt: 'desc' };
    const [clients, total] = await Promise.all([
        app_1.prisma.client.findMany({
            where,
            skip,
            take,
            orderBy,
            include: {
                _count: { select: { jobOpenings: true, invoices: true } },
                business: { select: { id: true, name: true } },
            },
        }),
        app_1.prisma.client.count({ where }),
    ]);
    res.json({ success: true, data: clients, meta: (0, helpers_1.buildPaginationMeta)(total, pg, take) });
};
exports.getClients = getClients;
const getClientById = async (req, res) => {
    const { id } = req.params;
    const client = await app_1.prisma.client.findUnique({
        where: { id },
        include: {
            jobOpenings: { orderBy: { createdAt: 'desc' }, take: 10 },
            invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
    });
    if (!client)
        throw new errorMiddleware_1.AppError('Client not found', 404);
    res.json({ success: true, data: client });
};
exports.getClientById = getClientById;
const createClient = async (req, res) => {
    const { companyName, contactPerson, email, phone, alternatePhone, address, city, state, country, pincode, gstNumber, panNumber, industry, website, contractStartDate, contractEndDate, notes, businessId: bodyBusinessId, } = req.body;
    const existing = await app_1.prisma.client.findFirst({ where: { email } });
    if (existing)
        throw new errorMiddleware_1.AppError('A client with this email already exists', 409);
    const client = await app_1.prisma.client.create({
        data: {
            companyName, contactPerson, email, phone, alternatePhone, address,
            city, state, country: country || 'India', pincode, gstNumber, panNumber,
            industry, website,
            contractStartDate: contractStartDate ? new Date(contractStartDate) : null,
            contractEndDate: contractEndDate ? new Date(contractEndDate) : null,
            notes,
            createdBy: req.user?.userId,
            businessId: req.user?.isSuperAdmin ? (bodyBusinessId || undefined) : (req.user?.businessId ?? undefined),
        },
    });
    await app_1.prisma.auditLog.create({
        data: { userId: req.user?.userId, userEmail: req.user?.email, action: 'CREATE', module: 'clients', recordId: client.id },
    });
    res.status(201).json({ success: true, message: 'Client created', data: client });
};
exports.createClient = createClient;
const updateClient = async (req, res) => {
    const { id } = req.params;
    await app_1.prisma.client.findUniqueOrThrow({ where: { id } });
    const updates = {
        ...req.body,
        contractStartDate: req.body.contractStartDate ? new Date(req.body.contractStartDate) : undefined,
        contractEndDate: req.body.contractEndDate ? new Date(req.body.contractEndDate) : undefined,
    };
    const client = await app_1.prisma.client.update({ where: { id }, data: updates });
    res.json({ success: true, message: 'Client updated', data: client });
};
exports.updateClient = updateClient;
const toggleClientStatus = async (req, res) => {
    const { id } = req.params;
    const client = await app_1.prisma.client.findUniqueOrThrow({ where: { id } });
    const updated = await app_1.prisma.client.update({ where: { id }, data: { isActive: !client.isActive } });
    res.json({ success: true, data: { isActive: updated.isActive } });
};
exports.toggleClientStatus = toggleClientStatus;
const deleteClient = async (req, res) => {
    const { id } = req.params;
    const client = await app_1.prisma.client.findUniqueOrThrow({ where: { id } });
    const jobCount = await app_1.prisma.jobOpening.count({ where: { clientId: id } });
    if (jobCount > 0)
        throw new errorMiddleware_1.AppError(`Cannot delete client with ${jobCount} active job openings`, 400);
    await app_1.prisma.client.delete({ where: { id } });
    await app_1.prisma.auditLog.create({
        data: { userId: req.user?.userId, userEmail: req.user?.email, action: 'DELETE', module: 'clients', recordId: id },
    });
    res.json({ success: true, message: 'Client deleted' });
};
exports.deleteClient = deleteClient;
const updateCustomFields = async (req, res) => {
    const { id } = req.params;
    const { fieldName, value } = req.body;
    const client = await app_1.prisma.client.findUniqueOrThrow({ where: { id } });
    const updated = await app_1.prisma.client.update({
        where: { id },
        data: { customFields: { ...(client.customFields || {}), [fieldName]: value } },
    });
    res.json({ success: true, data: updated.customFields });
};
exports.updateCustomFields = updateCustomFields;
const getClientDropdown = async (_req, res) => {
    const clients = await app_1.prisma.client.findMany({
        where: { isActive: true },
        select: { id: true, companyName: true },
        orderBy: { companyName: 'asc' },
    });
    res.json({ success: true, data: clients });
};
exports.getClientDropdown = getClientDropdown;
//# sourceMappingURL=clientController.js.map