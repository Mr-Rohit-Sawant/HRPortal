import { Request, Response } from 'express';
import { prisma } from '../app';
import { AppError } from '../middleware/errorMiddleware';
import { paginate, buildPaginationMeta } from '../utils/helpers';

const CLIENT_SORT_FIELDS: Record<string, string> = {
  company: 'companyName', contactPerson: 'contactPerson',
  contractEndDate: 'contractEndDate', createdAt: 'createdAt',
};

export const getClients = async (req: Request, res: Response) => {
  const { page = '1', limit = '10', search, isActive, sortBy, sortDir } = req.query;
  const take = parseInt(limit as string);
  const pg = parseInt(page as string);
  const { skip } = paginate(pg, take);

  const bizFilter = req.user?.isSuperAdmin ? {} : (req.user?.businessId ? { businessId: req.user.businessId } : {});
  const where: any = { ...bizFilter };
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (search) {
    where.OR = [
      { companyName: { contains: search } },
      { contactPerson: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
      { gstNumber: { contains: search } },
    ];
  }

  const prismaField = CLIENT_SORT_FIELDS[sortBy as string];
  const orderBy = prismaField
    ? { [prismaField]: (sortDir === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc' }
    : { createdAt: 'desc' as const };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        _count: { select: { jobOpenings: true, invoices: true } },
        business: { select: { id: true, name: true } },
      },
    }),
    prisma.client.count({ where }),
  ]);

  res.json({ success: true, data: clients, meta: buildPaginationMeta(total, pg, take) });
};

export const getClientById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      jobOpenings: { orderBy: { createdAt: 'desc' }, take: 10 },
      invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
  if (!client) throw new AppError('Client not found', 404);
  res.json({ success: true, data: client });
};

export const createClient = async (req: Request, res: Response) => {
  const {
    companyName, contactPerson, email, phone, alternatePhone, address,
    city, state, country, pincode, gstNumber, panNumber, industry,
    website, contractStartDate, contractEndDate, notes, businessId: bodyBusinessId,
  } = req.body;

  const existing = await prisma.client.findFirst({ where: { email } });
  if (existing) throw new AppError('A client with this email already exists', 409);

  const client = await prisma.client.create({
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

  await prisma.auditLog.create({
    data: { userId: req.user?.userId, userEmail: req.user?.email, action: 'CREATE', module: 'clients', recordId: client.id },
  });

  res.status(201).json({ success: true, message: 'Client created', data: client });
};

export const updateClient = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.client.findUniqueOrThrow({ where: { id } });

  const updates = {
    ...req.body,
    contractStartDate: req.body.contractStartDate ? new Date(req.body.contractStartDate) : undefined,
    contractEndDate: req.body.contractEndDate ? new Date(req.body.contractEndDate) : undefined,
  };

  const client = await prisma.client.update({ where: { id }, data: updates });
  res.json({ success: true, message: 'Client updated', data: client });
};

export const toggleClientStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const client = await prisma.client.findUniqueOrThrow({ where: { id } });
  const updated = await prisma.client.update({ where: { id }, data: { isActive: !client.isActive } });
  res.json({ success: true, data: { isActive: updated.isActive } });
};

export const deleteClient = async (req: Request, res: Response) => {
  const { id } = req.params;
  const client = await prisma.client.findUniqueOrThrow({ where: { id } });

  const jobCount = await prisma.jobOpening.count({ where: { clientId: id } });
  if (jobCount > 0) throw new AppError(`Cannot delete client with ${jobCount} active job openings`, 400);

  await prisma.client.delete({ where: { id } });

  await prisma.auditLog.create({
    data: { userId: req.user?.userId, userEmail: req.user?.email, action: 'DELETE', module: 'clients', recordId: id },
  });

  res.json({ success: true, message: 'Client deleted' });
};

export const updateCustomFields = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fieldName, value } = req.body;
  const client = await prisma.client.findUniqueOrThrow({ where: { id } });
  const updated = await prisma.client.update({
    where: { id },
    data: { customFields: { ...(client.customFields as any || {}), [fieldName]: value } },
  });
  res.json({ success: true, data: updated.customFields });
};

export const getClientDropdown = async (_req: Request, res: Response) => {
  const clients = await prisma.client.findMany({
    where: { isActive: true },
    select: { id: true, companyName: true },
    orderBy: { companyName: 'asc' },
  });
  res.json({ success: true, data: clients });
};
