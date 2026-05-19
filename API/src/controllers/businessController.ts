import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../app';
import { AppError } from '../middleware/errorMiddleware';
import { buildPaginationMeta } from '../utils/helpers';

// GET /businesses
export const getBusinesses = async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || '1')));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'))));
  const search = String(req.query.search || '').trim();

  // Background cleanup: hard-delete businesses whose grace period has elapsed
  await prisma.business.updateMany({
    where: { deleteScheduledAt: { lt: new Date() }, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  const searchClause = search
    ? { OR: [{ name: { contains: search } }, { code: { contains: search } }, { adminEmail: { contains: search } }] }
    : {};
  const statusFilter = String(req.query.status || '').trim().toUpperCase();
  const where: any = { deletedAt: null, ...searchClause };
  if (statusFilter === 'ACTIVE' || statusFilter === 'INACTIVE') {
    where.status = statusFilter;
  }

  const [total, data] = await Promise.all([
    prisma.business.count({ where }),
    prisma.business.findMany({
      where,
      include: {
        _count: { select: { users: true, candidates: true, clients: true, jobOpenings: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  res.json({ success: true, data, meta: buildPaginationMeta(total, page, limit) });
};

// GET /businesses/:id
export const getBusiness = async (req: Request, res: Response) => {
  const { id } = req.params;
  const business = await prisma.business.findUnique({
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
  if (!business) throw new AppError('Business not found', 404);
  res.json({ success: true, data: business });
};

// POST /businesses
export const createBusiness = async (req: Request, res: Response) => {
  const { name, code, adminEmail, adminPassword, adminFirstName, adminLastName } = req.body;
  if (!name || !code || !adminEmail || !adminPassword || !adminFirstName || !adminLastName) {
    throw new AppError('name, code, adminEmail, adminPassword, adminFirstName, adminLastName are required', 400);
  }

  const existing = await prisma.business.findUnique({ where: { code } });
  if (existing) throw new AppError('Business code already exists', 409);

  const existingEmail = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existingEmail) throw new AppError('Admin email already in use', 409);

  // Find or create admin role
  let adminRole = await prisma.role.findFirst({ where: { name: 'admin' } });
  if (!adminRole) {
    adminRole = await prisma.role.create({ data: { name: 'admin', isSystem: true } });
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const username = adminEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + '_' + Date.now().toString().slice(-4);

  const business = await prisma.business.create({
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

// PUT /businesses/:id
export const updateBusiness = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, status, logo } = req.body;

  const business = await prisma.business.update({
    where: { id },
    data: { ...(name && { name }), ...(status && { status }), ...(logo !== undefined && { logo }) },
  });
  res.json({ success: true, data: business });
};

// DELETE /businesses/:id — soft delete with 24hr grace period
export const deleteBusiness = async (req: Request, res: Response) => {
  const { id } = req.params;
  const business = await prisma.business.findFirst({ where: { id, deletedAt: null } });
  if (!business) throw new AppError('Business not found', 404);

  await prisma.business.update({
    where: { id },
    data: { deleteScheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });
  res.json({ success: true, message: 'Business scheduled for deletion in 24 hours' });
};

// POST /businesses/:id/undo-delete — cancel scheduled deletion
export const undoDeleteBusiness = async (req: Request, res: Response) => {
  const { id } = req.params;
  const business = await prisma.business.findFirst({ where: { id, deletedAt: null } });
  if (!business) throw new AppError('Business not found', 404);

  await prisma.business.update({
    where: { id },
    data: { deleteScheduledAt: null },
  });
  res.json({ success: true, message: 'Deletion cancelled' });
};

// PATCH /businesses/:id/toggle-status — toggle ACTIVE <-> INACTIVE
export const toggleBusinessStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const business = await prisma.business.findFirst({ where: { id, deletedAt: null } });
  if (!business) throw new AppError('Business not found', 404);

  const newStatus = business.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const updated = await prisma.business.update({
    where: { id },
    data: { status: newStatus },
  });
  res.json({ success: true, data: updated, message: `Business ${newStatus === 'ACTIVE' ? 'enabled' : 'disabled'}` });
};

// GET /businesses/dropdown — lightweight list for dropdowns
export const getBusinessesDropdown = async (_req: Request, res: Response) => {
  const businesses = await prisma.business.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true, code: true, adminEmail: true },
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: businesses });
};
