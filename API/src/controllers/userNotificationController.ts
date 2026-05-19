import { Request, Response } from 'express';
import path from 'path';
import { prisma } from '../app';
import { AppError } from '../middleware/errorMiddleware';
import { buildPaginationMeta } from '../utils/helpers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NotifFile {
  name: string;
  path: string;
  size: number;
}

// ---------------------------------------------------------------------------
// Permission delay helper
// ---------------------------------------------------------------------------

const DELAY_MS: Record<string, number> = {
  '1h': 3_600_000,
  '8h': 28_800_000,
  '24h': 86_400_000,
  '7d': 604_800_000,
  '30d': 2_592_000_000,
};

async function checkDelay(
  notif: { createdAt: Date },
  action: 'edit' | 'delete',
  userRoleName: string
): Promise<void> {
  const setting = await prisma.appSetting.findUnique({ where: { key: 'notification_permissions' } });
  if (!setting?.value) return;

  let config: Record<string, unknown>;
  try {
    config = JSON.parse(setting.value as string);
  } catch {
    return;
  }

  const roleConfig = (config?.[action] as Record<string, unknown> | undefined)?.delays as Record<string, string> | undefined;
  const roleDelay = roleConfig?.[userRoleName];

  if (!roleDelay || roleDelay === 'never_expire') return;
  if (roleDelay === 'not_allowed') throw new AppError('Permission denied', 403);

  const ms = DELAY_MS[roleDelay];
  if (ms && Date.now() - new Date(notif.createdAt).getTime() > ms) {
    throw new AppError(`${action === 'edit' ? 'Edit' : 'Delete'} window has expired`, 403);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const includeFields = {
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  client: { select: { id: true, companyName: true } },
};

function matchesSendTo(sendTo: unknown, userId: string): boolean {
  if (sendTo === 'ALL') return true;
  if (typeof sendTo === 'string') {
    try {
      const parsed = JSON.parse(sendTo);
      if (parsed === 'ALL') return true;
      if (Array.isArray(parsed)) return parsed.includes(userId);
    } catch {
      // ignore
    }
    return false;
  }
  if (Array.isArray(sendTo)) return sendTo.includes(userId);
  return false;
}

// ---------------------------------------------------------------------------
// GET /user-notifications
// ---------------------------------------------------------------------------

export const getUserNotifications = async (req: Request, res: Response) => {
  const currentUserId = req.user!.userId;
  const page = Math.max(1, parseInt(String(req.query.page || '1')));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'))));
  const type = (req.query.type as string) || 'all';

  // Fetch notifications created by this user
  const myCreated = await prisma.userNotification.findMany({
    where: { createdById: currentUserId },
    include: includeFields,
    orderBy: { createdAt: 'desc' },
  });

  // Fetch notifications created by others
  const others = await prisma.userNotification.findMany({
    where: { createdById: { not: currentUserId } },
    include: includeFields,
    orderBy: { createdAt: 'desc' },
  });

  const received = others.filter((n) => matchesSendTo(n.sendTo, currentUserId));

  let merged: typeof myCreated;
  if (type === 'sent') {
    merged = myCreated;
  } else if (type === 'received') {
    merged = received as typeof myCreated;
  } else {
    // all — merge and dedupe
    const seen = new Set<string>();
    merged = [];
    for (const n of [...myCreated, ...received]) {
      if (!seen.has(n.id)) {
        seen.add(n.id);
        merged.push(n as typeof myCreated[number]);
      }
    }
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const total = merged.length;
  const start = (page - 1) * limit;
  const data = merged.slice(start, start + limit);

  res.json({
    success: true,
    data,
    meta: buildPaginationMeta(total, page, limit),
  });
};

// ---------------------------------------------------------------------------
// POST /user-notifications
// ---------------------------------------------------------------------------

export const createUserNotification = async (req: Request, res: Response) => {
  const { title, description, sendTo, clientId } = req.body;

  if (!title || !description || !sendTo) {
    throw new AppError('title, description, and sendTo are required', 400);
  }

  let parsedSendTo: string | string[];
  try {
    parsedSendTo = JSON.parse(sendTo);
  } catch {
    parsedSendTo = sendTo;
  }

  const files: NotifFile[] = (req.files as Express.Multer.File[] | undefined)?.map((f) => ({
    name: f.originalname,
    path: `uploads/custom/${f.filename}`,
    size: f.size,
  })) ?? [];

  const filesJson = files.length ? (files as unknown as import('@prisma/client').Prisma.InputJsonValue) : undefined;

  const notif = await prisma.userNotification.create({
    data: {
      title,
      description,
      sendTo: parsedSendTo,
      files: filesJson,
      clientId: clientId || undefined,
      businessId: req.body.businessId || req.user!.businessId || undefined,
      readBy: JSON.stringify([req.user!.userId]),
      createdById: req.user!.userId,
    },
    include: includeFields,
  });

  res.status(201).json({ success: true, data: notif });
};

// ---------------------------------------------------------------------------
// PUT /user-notifications/:id
// ---------------------------------------------------------------------------

export const updateUserNotification = async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUserId = req.user!.userId;
  const roleName = req.user!.roleName;

  const notif = await prisma.userNotification.findUnique({ where: { id } });
  if (!notif) throw new AppError('Notification not found', 404);
  if (notif.createdById !== currentUserId && !req.user!.isSuperAdmin) {
    throw new AppError('Permission denied', 403);
  }

  await checkDelay(notif, 'edit', roleName);

  const { title, description, sendTo, clientId, files } = req.body;

  let parsedSendTo: string | string[] | undefined;
  if (sendTo !== undefined) {
    try {
      parsedSendTo = JSON.parse(sendTo);
    } catch {
      parsedSendTo = sendTo;
    }
  }

  const updated = await prisma.userNotification.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(parsedSendTo !== undefined && { sendTo: parsedSendTo }),
      ...(clientId !== undefined && { clientId: clientId || null }),
      ...(files !== undefined && { files }),
    },
    include: includeFields,
  });

  res.json({ success: true, data: updated });
};

// ---------------------------------------------------------------------------
// DELETE /user-notifications/:id
// ---------------------------------------------------------------------------

export const deleteUserNotification = async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUserId = req.user!.userId;
  const roleName = req.user!.roleName;

  const notif = await prisma.userNotification.findUnique({ where: { id } });
  if (!notif) throw new AppError('Notification not found', 404);
  if (notif.createdById !== currentUserId && !req.user!.isSuperAdmin) {
    throw new AppError('Permission denied', 403);
  }

  await checkDelay(notif, 'delete', roleName);

  // Delete attached files from disk
  if (notif.files) {
    const fileList = notif.files as unknown as NotifFile[];
    for (const f of fileList) {
      try {
        const fs = await import('fs');
        const filePath = path.join(process.cwd(), f.path);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch {
        // ignore file deletion errors
      }
    }
  }

  await prisma.userNotification.delete({ where: { id } });
  res.json({ success: true, message: 'Notification deleted' });
};

// ---------------------------------------------------------------------------
// GET /user-notifications/permissions
// ---------------------------------------------------------------------------

const DEFAULT_PERMISSIONS = {
  edit: { delays: {} },
  delete: { delays: {} },
};

export const getNotificationPermissions = async (_req: Request, res: Response) => {
  const setting = await prisma.appSetting.findUnique({ where: { key: 'notification_permissions' } });
  let data = DEFAULT_PERMISSIONS;
  if (setting?.value) {
    try {
      data = JSON.parse(setting.value as string);
    } catch {
      // use default
    }
  }
  res.json({ success: true, data });
};

// ---------------------------------------------------------------------------
// POST /user-notifications/:id/read
// ---------------------------------------------------------------------------

export const markNotificationRead = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const notif = await prisma.userNotification.findUnique({ where: { id } });
  if (!notif) throw new AppError('Notification not found', 404);

  let readBy: string[] = [];
  try {
    const raw = notif.readBy;
    readBy = Array.isArray(raw) ? raw as string[] : (typeof raw === 'string' ? JSON.parse(raw) : []);
  } catch { readBy = []; }

  if (!readBy.includes(userId)) {
    readBy.push(userId);
    await prisma.userNotification.update({
      where: { id },
      data: { readBy: JSON.stringify(readBy) },
    });
  }

  res.json({ success: true });
};

// ---------------------------------------------------------------------------
// PUT /user-notifications/permissions (super admin only)
// ---------------------------------------------------------------------------

export const updateNotificationPermissions = async (req: Request, res: Response) => {
  const config = req.body;
  await prisma.appSetting.upsert({
    where: { key: 'notification_permissions' },
    update: { value: JSON.stringify(config), updatedBy: req.user?.userId },
    create: { key: 'notification_permissions', value: JSON.stringify(config), category: 'notifications' },
  });
  res.json({ success: true, data: config });
};
