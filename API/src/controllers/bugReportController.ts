import { Request, Response } from 'express';
import { prisma } from '../app';
import { AppError } from '../middleware/errorMiddleware';
import { buildPaginationMeta } from '../utils/helpers';

const SETTING_DISABLED_ALL = 'bug_report.disabled_all';
const SETTING_DISABLED_SUPERADMIN = 'bug_report.disabled_superadmin';

const USER_SELECT = { id: true, firstName: true, lastName: true, email: true };

// ── LIST ──────────────────────────────────────────────────────────────────────
export const getBugReports = async (req: Request, res: Response) => {
  const page    = Math.max(1, parseInt(String(req.query.page  || '1')));
  const limit   = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'))));
  const search  = String(req.query.search  || '').trim();
  const type    = String(req.query.type    || '').trim();
  const priority   = String(req.query.priority   || '').trim();
  const severity   = String(req.query.severity   || '').trim();
  const status     = String(req.query.status     || '').trim();
  const module     = String(req.query.module     || '').trim();
  const browser    = String(req.query.browser    || '').trim();
  const environment = String(req.query.environment || '').trim();
  const device     = String(req.query.device     || '').trim();
  const reproducibility = String(req.query.reproducibility || '').trim();
  const businessId = String(req.query.businessId || '').trim();
  const assignedToId = String(req.query.assignedToId || '').trim();
  const createdById  = String(req.query.createdById  || '').trim();
  const dateFrom   = String(req.query.dateFrom || '').trim();
  const dateTo     = String(req.query.dateTo   || '').trim();
  const hasAttachment = String(req.query.hasAttachment || '').trim();
  const sortField  = String(req.query.sortField || 'createdAt').trim();
  const sortDir    = (String(req.query.sortDir || 'desc').trim() === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

  const ALLOWED_SORT = ['createdAt', 'updatedAt', 'priority', 'status', 'type', 'severity', 'title', 'reportedByEmail'];
  const orderField = ALLOWED_SORT.includes(sortField) ? sortField : 'createdAt';

  const where: any = {};

  if (search) {
    where.OR = [
      { description: { contains: search } },
      { title: { contains: search } },
      { reportedByEmail: { contains: search } },
      { reportedByName: { contains: search } },
      { module: { contains: search } },
    ];
  }
  if (type)     where.type = type;
  if (priority) where.priority = priority;
  if (severity) where.severity = severity;
  if (status)   where.status   = status;
  if (module)   where.module   = module;
  if (browser)  where.browser  = browser;
  if (environment)  where.environment  = environment;
  if (device)   where.device   = device;
  if (reproducibility) where.reproducibility = reproducibility;
  if (businessId)  where.businessId  = businessId;
  if (assignedToId) where.assignedToId = assignedToId;
  if (createdById)  where.userId = createdById;

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo)   where.createdAt.lte = new Date(dateTo + 'T23:59:59Z');
  }
  if (hasAttachment === 'true')  where.NOT = { files: null };
  if (hasAttachment === 'false') where.files = null;

  const [total, data] = await Promise.all([
    prisma.bugReport.count({ where }),
    prisma.bugReport.findMany({
      where,
      include: {
        business:   { select: { id: true, name: true } },
        user:       { select: USER_SELECT },
        assignedTo: { select: USER_SELECT },
      },
      orderBy: { [orderField]: sortDir },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  res.json({ success: true, data, meta: buildPaginationMeta(total, page, limit) });
};

// ── GET BY ID ─────────────────────────────────────────────────────────────────
export const getBugReportById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const report = await prisma.bugReport.findUnique({
    where: { id },
    include: {
      business:   { select: { id: true, name: true } },
      user:       { select: USER_SELECT },
      assignedTo: { select: USER_SELECT },
    },
  });
  if (!report) throw new AppError('Bug report not found', 404);
  res.json({ success: true, data: report });
};

// ── CREATE ────────────────────────────────────────────────────────────────────
export const createBugReport = async (req: Request, res: Response) => {
  const { type, title, description, priority, severity, module: mod, browser,
          environment, device, reproducibility, tags } = req.body;

  if (!description || !String(description).trim()) throw new AppError('Description is required', 400);

  const files = (req.files as Express.Multer.File[] | undefined) || [];
  const fileMeta = files.map((f) => ({
    filename: f.filename, originalName: f.originalname,
    mimeType: f.mimetype, size: f.size,
    url: `/uploads/bug-reports/${f.filename}`,
  }));

  const authUser = req.user;
  let reportedByEmail = String(req.body.reportedByEmail || '').trim();
  let reportedByName  = String(req.body.reportedByName  || '').trim();
  let userId: string | null = null;
  let businessId: string | null = null;
  let businessName: string | null = String(req.body.businessName || '').trim() || null;

  if (authUser?.userId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.userId },
      include: { business: { select: { id: true, name: true } } },
    });
    if (dbUser) {
      userId = dbUser.id;
      reportedByEmail = reportedByEmail || dbUser.email;
      reportedByName  = reportedByName  || `${dbUser.firstName} ${dbUser.lastName}`.trim();
      if (dbUser.business) { businessId = dbUser.business.id; businessName = dbUser.business.name; }
    }
  }
  if (!reportedByEmail) reportedByEmail = 'anonymous';

  let parsedTags: string[] | null = null;
  if (tags) {
    try { parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags; } catch { parsedTags = null; }
  }

  const report = await prisma.bugReport.create({
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

// ── UPDATE ────────────────────────────────────────────────────────────────────
export const updateBugReport = async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.bugReport.findUnique({ where: { id } });
  if (!existing) throw new AppError('Bug report not found', 404);

  const { priority, type, status, title, description, severity, module: mod,
          browser, environment, device, reproducibility, resolution, assignedToId, tags } = req.body;

  let parsedTags: string[] | undefined = undefined;
  if (tags !== undefined) {
    try { parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags; } catch { parsedTags = []; }
  }

  const updated = await prisma.bugReport.update({
    where: { id },
    data: {
      ...(priority       !== undefined && { priority }),
      ...(type           !== undefined && { type }),
      ...(status         !== undefined && { status }),
      ...(title          !== undefined && { title: title ? String(title).trim() : null }),
      ...(description    !== undefined && { description: String(description).trim() }),
      ...(severity       !== undefined && { severity: severity || null }),
      ...(mod            !== undefined && { module: mod || null }),
      ...(browser        !== undefined && { browser: browser || null }),
      ...(environment    !== undefined && { environment: environment || null }),
      ...(device         !== undefined && { device: device || null }),
      ...(reproducibility !== undefined && { reproducibility: reproducibility || null }),
      ...(resolution     !== undefined && { resolution: resolution || null }),
      ...(assignedToId   !== undefined && { assignedToId: assignedToId || null }),
      ...(parsedTags     !== undefined && { tags: parsedTags }),
    },
    include: {
      business:   { select: { id: true, name: true } },
      user:       { select: USER_SELECT },
      assignedTo: { select: USER_SELECT },
    },
  });
  res.json({ success: true, data: updated });
};

// ── DELETE ────────────────────────────────────────────────────────────────────
export const deleteBugReport = async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.bugReport.findUnique({ where: { id } });
  if (!existing) throw new AppError('Bug report not found', 404);
  await prisma.bugReport.delete({ where: { id } });
  res.json({ success: true, message: 'Bug report deleted' });
};

// ── STATUS LABELS ─────────────────────────────────────────────────────────────
export const getStatusLabels = async (req: Request, res: Response) => {
  const businessId = req.user?.isSuperAdmin
    ? (String(req.query.businessId || '').trim() || undefined)
    : (req.user?.businessId ?? undefined);

  const labels = await prisma.bugStatusLabel.findMany({
    where: {
      isArchived: false,
      ...(businessId ? { businessId } : { businessId: null }),
    },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });

  // Return default labels if none exist for this business
  if (labels.length === 0) {
    const defaults = [
      { id: 'open',         name: 'Open',          color: '#3B82F6', order: 0 },
      { id: 'in_progress',  name: 'In Progress',   color: '#F59E0B', order: 1 },
      { id: 'qa_testing',   name: 'QA Testing',    color: '#8B5CF6', order: 2 },
      { id: 'need_info',    name: 'Need More Info', color: '#EC4899', order: 3 },
      { id: 'on_hold',      name: 'On Hold',        color: '#6B7280', order: 4 },
      { id: 'rejected',     name: 'Rejected',       color: '#EF4444', order: 5 },
      { id: 'completed',    name: 'Completed',      color: '#10B981', order: 6 },
    ];
    return res.json({ success: true, data: defaults, isDefault: true });
  }

  res.json({ success: true, data: labels });
};

export const createStatusLabel = async (req: Request, res: Response) => {
  const { name, color, order, businessId: bodyBizId } = req.body;
  if (!name?.trim()) throw new AppError('Label name is required', 400);

  const businessId = req.user?.isSuperAdmin
    ? (bodyBizId || null)
    : (req.user?.businessId ?? null);

  const maxOrder = await prisma.bugStatusLabel.aggregate({
    _max: { order: true },
    where: { businessId: businessId ?? undefined },
  });

  const label = await prisma.bugStatusLabel.create({
    data: {
      name: String(name).trim(),
      color: color || '#6B7280',
      order: order ?? ((maxOrder._max.order ?? -1) + 1),
      businessId,
    },
  });
  res.status(201).json({ success: true, data: label });
};

export const updateStatusLabel = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, color, order, isArchived } = req.body;

  const existing = await prisma.bugStatusLabel.findUnique({ where: { id } });
  if (!existing) throw new AppError('Status label not found', 404);

  const updated = await prisma.bugStatusLabel.update({
    where: { id },
    data: {
      ...(name       !== undefined && { name: String(name).trim() }),
      ...(color      !== undefined && { color }),
      ...(order      !== undefined && { order }),
      ...(isArchived !== undefined && { isArchived }),
    },
  });
  res.json({ success: true, data: updated });
};

export const deleteStatusLabel = async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.bugStatusLabel.findUnique({ where: { id } });
  if (!existing) throw new AppError('Status label not found', 404);
  await prisma.bugStatusLabel.delete({ where: { id } });
  res.json({ success: true, message: 'Label deleted' });
};

// ── SETTINGS ──────────────────────────────────────────────────────────────────
export const getBugReportSettings = async (_req: Request, res: Response) => {
  const settings = await prisma.appSetting.findMany({
    where: { key: { in: [SETTING_DISABLED_ALL, SETTING_DISABLED_SUPERADMIN] } },
  });
  const map: Record<string, string> = {};
  settings.forEach((s) => { map[s.key] = s.value ?? 'false'; });
  res.json({
    success: true,
    data: {
      disabledAll: (map[SETTING_DISABLED_ALL] ?? 'false') === 'true',
      disabledSuperAdmin: (map[SETTING_DISABLED_SUPERADMIN] ?? 'false') === 'true',
    },
  });
};

export const updateBugReportSettings = async (req: Request, res: Response) => {
  const { disabledAll, disabledSuperAdmin } = req.body;
  const updates: Array<{ key: string; value: string }> = [];
  if (disabledAll !== undefined)
    updates.push({ key: SETTING_DISABLED_ALL, value: disabledAll ? 'true' : 'false' });
  if (disabledSuperAdmin !== undefined)
    updates.push({ key: SETTING_DISABLED_SUPERADMIN, value: disabledSuperAdmin ? 'true' : 'false' });

  await Promise.all(updates.map((u) =>
    prisma.appSetting.upsert({
      where: { key: u.key },
      update: { value: u.value, updatedBy: req.user?.userId },
      create: { key: u.key, value: u.value, category: 'bug_report', updatedBy: req.user?.userId },
    })
  ));
  res.json({ success: true, message: 'Settings updated' });
};
