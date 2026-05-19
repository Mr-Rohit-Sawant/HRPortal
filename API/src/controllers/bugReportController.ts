import { Request, Response } from 'express';
import { prisma } from '../app';
import { AppError } from '../middleware/errorMiddleware';
import { buildPaginationMeta } from '../utils/helpers';

const SETTING_DISABLED_ALL = 'bug_report.disabled_all';
const SETTING_DISABLED_SUPERADMIN = 'bug_report.disabled_superadmin';

// GET /bug-reports — paginated list
export const getBugReports = async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || '1')));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'))));
  const search = String(req.query.search || '').trim();
  const type = String(req.query.type || '').trim();
  const priority = String(req.query.priority || '').trim();
  const businessId = String(req.query.businessId || '').trim();

  const where: any = {};
  if (search) {
    where.OR = [
      { description: { contains: search } },
      { reportedByEmail: { contains: search } },
      { reportedByName: { contains: search } },
    ];
  }
  if (type) where.type = type;
  if (priority) where.priority = priority;
  if (businessId) where.businessId = businessId;

  const [total, data] = await Promise.all([
    prisma.bugReport.count({ where }),
    prisma.bugReport.findMany({
      where,
      include: { business: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  res.json({ success: true, data, meta: buildPaginationMeta(total, page, limit) });
};

// POST /bug-reports — create (supports multipart file upload)
export const createBugReport = async (req: Request, res: Response) => {
  const { type, description, priority } = req.body;
  if (!description || !String(description).trim()) {
    throw new AppError('Description is required', 400);
  }

  const files = (req.files as Express.Multer.File[] | undefined) || [];
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
      reportedByName = reportedByName || `${dbUser.firstName} ${dbUser.lastName}`.trim();
      if (dbUser.business) {
        businessId = dbUser.business.id;
        businessName = dbUser.business.name;
      }
    }
  }

  if (!reportedByEmail) reportedByEmail = 'anonymous';

  const report = await prisma.bugReport.create({
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

// PATCH /bug-reports/:id — update priority/type
export const updateBugReport = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { priority, type } = req.body;

  const existing = await prisma.bugReport.findUnique({ where: { id } });
  if (!existing) throw new AppError('Bug report not found', 404);

  const updated = await prisma.bugReport.update({
    where: { id },
    data: {
      ...(priority && { priority }),
      ...(type && { type }),
    },
  });
  res.json({ success: true, data: updated });
};

// DELETE /bug-reports/:id — super admin only
export const deleteBugReport = async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.bugReport.findUnique({ where: { id } });
  if (!existing) throw new AppError('Bug report not found', 404);

  await prisma.bugReport.delete({ where: { id } });
  res.json({ success: true, message: 'Bug report deleted' });
};

// GET /bug-reports/settings — read settings (public so the button can decide visibility)
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

// PUT /bug-reports/settings — super admin only
export const updateBugReportSettings = async (req: Request, res: Response) => {
  const { disabledAll, disabledSuperAdmin } = req.body;

  const updates: Array<{ key: string; value: string }> = [];
  if (disabledAll !== undefined) {
    updates.push({ key: SETTING_DISABLED_ALL, value: disabledAll ? 'true' : 'false' });
  }
  if (disabledSuperAdmin !== undefined) {
    updates.push({ key: SETTING_DISABLED_SUPERADMIN, value: disabledSuperAdmin ? 'true' : 'false' });
  }

  await Promise.all(
    updates.map((u) =>
      prisma.appSetting.upsert({
        where: { key: u.key },
        update: { value: u.value, updatedBy: req.user?.userId },
        create: { key: u.key, value: u.value, category: 'bug_report', updatedBy: req.user?.userId },
      })
    )
  );

  res.json({ success: true, message: 'Settings updated' });
};
