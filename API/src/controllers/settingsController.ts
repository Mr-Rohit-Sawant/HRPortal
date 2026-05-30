import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { buildWelcomeEmailHtml } from '../services/emailService';
import { prisma } from '../app';
import { AppError } from '../middleware/errorMiddleware';
import { paginate, buildPaginationMeta } from '../utils/helpers';
import { settingsCache, SETTINGS_TTL } from '../utils/cache';
import path from 'path';
import fs from 'fs';

function settingsMapToResponse(map: Record<string, string | null>) {
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
  const settings = await prisma.appSetting.findMany();
  const map = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string | null>);
  const data = settingsMapToResponse(map);
  settingsCache.set(SETTINGS_CACHE_KEY, data, SETTINGS_TTL);
  return data;
}

// --- Theme & App Settings ---
export const getAppSettings = async (_req: Request, res: Response) => {
  const cached = settingsCache.get(SETTINGS_CACHE_KEY);
  if (cached) return res.json({ success: true, data: cached });
  const data = await fetchAndCacheSettings();
  res.json({ success: true, data });
};

export const updateAppSettings = async (req: Request, res: Response) => {
  const fieldMap: Record<string, string> = {
    appName: 'app_name',
    primaryColor: 'primary_color',
    sidebarColor: 'sidebar_color',
    fontFamily: 'font_family',
    accentColor: 'accent_color',
  };

  const updates: Record<string, string> = {};

  for (const [camel, snake] of Object.entries(fieldMap)) {
    const val = req.body[camel];
    if (val !== undefined && val !== null) updates[snake] = String(val);
  }

  if (req.file) {
    const logoPath = `uploads/logos/${req.file.filename}`;
    const existing = await prisma.appSetting.findUnique({ where: { key: 'app_logo' } });
    if (existing?.value) {
      const oldPath = path.join(process.cwd(), existing.value);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    updates['app_logo'] = logoPath;
  }

  if (Object.keys(updates).length > 0) {
    await Promise.all(
      Object.entries(updates).map(([key, value]) =>
        prisma.appSetting.upsert({
          where: { key },
          update: { value, updatedBy: req.user?.userId },
          create: { key, value, category: 'general' },
        })
      )
    );
  }

  await prisma.auditLog.create({
    data: { userId: req.user?.userId, userEmail: req.user?.email, action: 'UPDATE', module: 'settings', newValues: updates },
  });

  const data = await fetchAndCacheSettings();
  res.json({ success: true, data });
};

export const uploadLogo = async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No logo file uploaded', 400);

  const logoPath = `uploads/logos/${req.file.filename}`;

  const existing = await prisma.appSetting.findUnique({ where: { key: 'app_logo' } });
  if (existing?.value) {
    const oldPath = path.join(process.cwd(), existing.value);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  await prisma.appSetting.upsert({
    where: { key: 'app_logo' },
    update: { value: logoPath },
    create: { key: 'app_logo', value: logoPath, category: 'branding' },
  });

  settingsCache.del(SETTINGS_CACHE_KEY);
  res.json({ success: true, data: { logoPath } });
};

export const uploadFavicon = async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No favicon file uploaded', 400);

  const faviconPath = `uploads/favicons/${req.file.filename}`;

  const existing = await prisma.appSetting.findUnique({ where: { key: 'app_favicon' } });
  if (existing?.value) {
    const oldPath = path.join(process.cwd(), existing.value);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  await prisma.appSetting.upsert({
    where: { key: 'app_favicon' },
    update: { value: faviconPath },
    create: { key: 'app_favicon', value: faviconPath, category: 'branding' },
  });

  settingsCache.del(SETTINGS_CACHE_KEY);
  res.json({ success: true, data: { faviconPath } });
};

export const uploadFont = async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No font file uploaded', 400);

  const fontName = req.body.fontName || path.basename(req.file.originalname, path.extname(req.file.originalname));
  const fontPath = `uploads/fonts/${req.file.filename}`;

  await prisma.appSetting.upsert({
    where: { key: `font_custom_${fontName}` },
    update: { value: fontPath },
    create: { key: `font_custom_${fontName}`, value: fontPath, category: 'fonts' },
  });

  res.json({ success: true, data: { fontName, fontPath } });
};

// --- Role Management ---
export const getRoles = async (req: Request, res: Response) => {
  const user = req.user!;
  const isSuperAdmin = !!user.isSuperAdmin;

  let where: any = {};
  if (!isSuperAdmin) {
    if (user.businessId) {
      // Business-linked: system roles (non-super_admin) + own business custom roles
      where.AND = [
        { name: { not: 'super_admin' } },
        { OR: [{ businessId: null }, { businessId: user.businessId }] },
      ];
    } else {
      // Unlinked non-super-admin: sees all roles except super_admin
      where.name = { not: 'super_admin' };
    }
  }

  const roles = await prisma.role.findMany({
    where,
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
  });
  res.json({ success: true, data: roles });
};

export const createRole = async (req: Request, res: Response) => {
  const { name, description, permissionIds, businessId: bodyBusinessId } = req.body;
  const user = req.user!;

  let businessId: string | undefined;
  if (user.isSuperAdmin) {
    businessId = bodyBusinessId || undefined;
  } else if (user.businessId) {
    // Business-linked users: always scoped to their own business
    businessId = user.businessId;
  } else {
    // Unlinked users: use whatever was selected in the form (or null = global)
    businessId = bodyBusinessId || undefined;
  }

  const role = await prisma.role.create({
    data: {
      name: name.toLowerCase().replace(/\s+/g, '_'),
      description,
      isActive: false, // disabled by default — must be manually enabled
      ...(businessId ? { businessId } : {}),
      permissions: {
        create: permissionIds.map((id: string) => ({ permissionId: id })),
      },
    },
    include: { permissions: { include: { permission: true } } },
  });

  res.status(201).json({ success: true, data: role });
};

export const updateRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const role = await prisma.role.findUniqueOrThrow({ where: { id } });
  if (role.isSystem && !req.user?.isSuperAdmin) throw new AppError('System roles cannot be modified', 400);

  const { name, description, permissionIds } = req.body;

  // Remove existing and reassign
  await prisma.rolePermission.deleteMany({ where: { roleId: id } });

  const updated = await prisma.role.update({
    where: { id },
    data: {
      name: name.toLowerCase().replace(/\s+/g, '_'),
      description,
      permissions: {
        create: permissionIds.map((pid: string) => ({ permissionId: pid })),
      },
    },
    include: { permissions: { include: { permission: true } } },
  });

  res.json({ success: true, data: updated });
};

export const deleteRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const role = await prisma.role.findUniqueOrThrow({ where: { id } });
  if (role.isSystem && !req.user?.isSuperAdmin) throw new AppError('System roles cannot be deleted', 400);

  const usersCount = await prisma.user.count({ where: { roleId: id } });
  if (usersCount > 0) throw new AppError(`Cannot delete role assigned to ${usersCount} users`, 400);

  await prisma.role.delete({ where: { id } });
  res.json({ success: true, message: 'Role deleted' });
};

export const toggleRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const role = await prisma.role.findUniqueOrThrow({ where: { id } });
  if (role.isSystem) throw new AppError('System roles cannot be toggled', 400);
  const updated = await prisma.role.update({
    where: { id },
    data: { isActive: !role.isActive },
  });
  res.json({ success: true, data: updated });
};

export const cloneRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  const user = req.user!;

  const source = await prisma.role.findUniqueOrThrow({
    where: { id },
    include: { permissions: true },
  });

  // Cloning rules:
  // - User linked to a business → clone scoped to their business (regardless of source)
  // - User NOT linked to any business (or super admin) → clone is Global (null)

  const clonedBusinessId = user.businessId ?? null;

  const cloned = await prisma.role.create({
    data: {
      name: name || `${source.name}_copy`,
      description: `Cloned from ${source.name}`,
      isActive: false, // disabled by default — must be manually enabled
      ...(clonedBusinessId ? { businessId: clonedBusinessId } : {}),
      permissions: {
        create: source.permissions.map((p) => ({ permissionId: p.permissionId })),
      },
    },
    include: { permissions: { include: { permission: true } } },
  });

  res.status(201).json({ success: true, data: cloned });
};

export const getPermissions = async (_req: Request, res: Response) => {
  const permissions = await prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] });
  res.json({ success: true, data: permissions });
};

// --- Dynamic Column Definitions ---
export const getColumnDefinitions = async (req: Request, res: Response) => {
  const { module } = req.query;
  const columns = await prisma.columnDefinition.findMany({
    where: { ...(module ? { module: module as string } : {}) },
    orderBy: { order: 'asc' },
  });
  res.json({ success: true, data: columns });
};

export const upsertColumnDefinition = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  let column;
  if (id) {
    column = await prisma.columnDefinition.update({ where: { id }, data });
  } else {
    column = await prisma.columnDefinition.create({ data: { ...data, createdBy: req.user?.userId } });
  }

  res.json({ success: true, data: column });
};

export const deleteColumnDefinition = async (req: Request, res: Response) => {
  const { id } = req.params;
  const col = await prisma.columnDefinition.findUniqueOrThrow({ where: { id } });
  if (col.isRequired) throw new AppError('Required columns cannot be deleted', 400);
  await prisma.columnDefinition.delete({ where: { id } });
  res.json({ success: true, message: 'Column deleted' });
};

export const reorderColumns = async (req: Request, res: Response) => {
  const { columns } = req.body as { columns: { id: string; order: number }[] };

  await Promise.all(
    columns.map((col) => prisma.columnDefinition.update({ where: { id: col.id }, data: { order: col.order } }))
  );

  res.json({ success: true, message: 'Columns reordered' });
};

// --- Audit Logs ---
export const getAuditLogs = async (req: Request, res: Response) => {
  const { page = '1', limit = '20', module, userId, action, search, startDate, endDate } = req.query;
  const take = parseInt(limit as string);
  const pg = parseInt(page as string);
  const { skip } = paginate(pg, take);

  const where: any = {};
  if (module) where.module = module;
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate as string);
    if (endDate) {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }
  if (search) {
    where.OR = [
      { userEmail: { contains: search as string } },
      { module: { contains: search as string } },
      { action: { contains: search as string } },
      { description: { contains: search as string } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstName: true, lastName: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({ success: true, data: logs, meta: buildPaginationMeta(total, pg, take) });
};

// --- Notifications ---
export const getNotifications = async (req: Request, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ success: true, data: notifications });
};

export const markNotificationRead = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.notification.update({ where: { id }, data: { isRead: true } });
  res.json({ success: true });
};

export const markAllNotificationsRead = async (req: Request, res: Response) => {
  await prisma.notification.updateMany({ where: { userId: req.user!.userId }, data: { isRead: true } });
  res.json({ success: true });
};


// --- Custom Field File Upload ---
export const uploadCustomFieldFiles = async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
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

export const sendTestWelcomeEmail = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) throw new AppError('email is required', 400);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to: email,
    subject: `Welcome to ${process.env.SMTP_FROM_NAME || 'HR Recruitment System'} — Your Account is Ready`,
    html: buildWelcomeEmailHtml('John Doe', email, 'Demo@1234', loginUrl),
  });

  res.json({ success: true, message: 'Welcome email sent successfully' });
};

export const sendTestEmail = async (req: Request, res: Response) => {
  const { to, cc, subject, body } = req.body;
  if (!to || !subject || !body) throw new AppError('to, subject and body are required', 400);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const file = req.file as Express.Multer.File | undefined;
  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    cc: cc || undefined,
    subject,
    html: body,
    attachments: file ? [{ filename: file.originalname, content: file.buffer }] : [],
  });

  res.json({ success: true, message: 'Email sent successfully' });
};
