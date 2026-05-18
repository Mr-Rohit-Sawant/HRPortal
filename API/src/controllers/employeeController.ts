import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../app';
import { AppError } from '../middleware/errorMiddleware';
import { paginate, buildPaginationMeta, generateEmployeeId, sanitizeUser } from '../utils/helpers';
import { sendWelcomeEmail } from '../services/emailService';
import path from 'path';
import fs from 'fs';

export const getEmployees = async (req: Request, res: Response) => {
  const { page = '1', limit = '10', search, status, department, roleId } = req.query;
  const take = parseInt(limit as string);
  const pg = parseInt(page as string);
  const { skip } = paginate(pg, take);

  const where: any = { isSuperAdmin: false };
  if (status) where.status = status;
  if (department) where.department = { contains: department };
  if (roleId) where.roleId = roleId as string;
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
      { employeeId: { contains: search } },
    ];
  }

  const [employees, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, employeeId: true, firstName: true, lastName: true, email: true, phone: true,
        department: true, designation: true, joiningDate: true, status: true, profilePhoto: true,
        role: { select: { id: true, name: true } },
        lastLoginAt: true, createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ success: true, data: employees, meta: buildPaginationMeta(total, pg, take) });
};

export const getEmployeeById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const employee = await prisma.user.findUnique({
    where: { id },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });
  if (!employee) throw new AppError('Employee not found', 404);
  res.json({ success: true, data: sanitizeUser(employee) });
};

export const createEmployee = async (req: Request, res: Response) => {
  const {
    email, username, password, firstName, lastName, phone, department, designation,
    roleId, joiningDate, salary, address, city, state, country, sendWelcome,
  } = req.body;

  // Pre-validate uniqueness with clear errors
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) throw new AppError('An employee with this email address already exists', 409);

  const plainPassword = password || `HR@${Math.random().toString(36).slice(-8)}`;
  const passwordHash = await bcrypt.hash(plainPassword, parseInt(process.env.BCRYPT_ROUNDS || '12'));

  // Generate unique employee ID (count ALL users to avoid collision with superadmin)
  const totalCount = await prisma.user.count();
  let empNum = totalCount + 1;
  let employeeId = generateEmployeeId(empNum);
  while (await prisma.user.findFirst({ where: { employeeId } })) {
    employeeId = generateEmployeeId(++empNum);
  }

  const profilePhoto = req.file ? `uploads/profiles/${req.file.filename}` : null;

  // Generate a unique username
  const baseUsername = (username || email.split('@')[0]).replace(/[^a-zA-Z0-9._-]/g, '');
  let finalUsername = baseUsername;
  let attempt = 1;
  while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
    finalUsername = `${baseUsername}${attempt++}`;
  }

  const employee = await prisma.user.create({
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
    },
    include: { role: true },
  });

  if (sendWelcome === 'true') {
    await sendWelcomeEmail(
      email,
      `${firstName} ${lastName}`,
      plainPassword,
      `${process.env.FRONTEND_URL}/login`
    ).catch(() => {});
  }

  await prisma.auditLog.create({
    data: { userId: req.user?.userId, userEmail: req.user?.email, action: 'CREATE', module: 'employees', recordId: employee.id },
  });

  res.status(201).json({
    success: true,
    message: 'Employee created successfully',
    data: sanitizeUser(employee),
  });
};

export const updateEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new AppError('Employee not found', 404);

  const { email, username, firstName, lastName, phone, department, designation, roleId, joiningDate, salary, address, city, state, country } = req.body;

  // Pre-validate uniqueness with clear errors
  if (email && email !== existing.email) {
    const emailConflict = await prisma.user.findUnique({ where: { email } });
    if (emailConflict) throw new AppError('An employee with this email address already exists', 409);
  }
  if (username && username !== existing.username) {
    const sanitized = username.replace(/[^a-zA-Z0-9._-]/g, '');
    const conflict = await prisma.user.findUnique({ where: { username: sanitized } });
    if (conflict) throw new AppError('Username is already taken, please choose a different one', 409);
  }

  const updates: any = {
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
  };

  if (req.file) {
    updates.profilePhoto = `uploads/profiles/${req.file.filename}`;
    if (existing.profilePhoto) {
      const oldPath = path.join(process.cwd(), existing.profilePhoto);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
  }

  const employee = await prisma.user.update({
    where: { id },
    data: updates,
    include: { role: true },
  });

  res.json({ success: true, message: 'Employee updated', data: sanitizeUser(employee) });
};

export const toggleEmployeeStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const employee = await prisma.user.findUnique({ where: { id } });
  if (!employee) throw new AppError('Employee not found', 404);

  const newStatus = employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const updated = await prisma.user.update({ where: { id }, data: { status: newStatus } });

  await prisma.auditLog.create({
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

export const deleteEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (id === req.user?.userId) throw new AppError('Cannot delete your own account', 400);

  await prisma.user.findUniqueOrThrow({ where: { id } });
  await prisma.user.delete({ where: { id } });

  await prisma.auditLog.create({
    data: { userId: req.user?.userId, userEmail: req.user?.email, action: 'DELETE', module: 'employees', recordId: id },
  });

  res.json({ success: true, message: 'Employee deleted' });
};

export const resetEmployeePassword = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { newPassword: providedPassword } = req.body;

  const employee = await prisma.user.findUnique({ where: { id } });
  if (!employee) throw new AppError('Employee not found', 404);

  const newPassword = providedPassword || `HR@${Math.random().toString(36).slice(-8)}`;
  const passwordHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12'));

  await prisma.user.update({ where: { id }, data: { passwordHash, refreshToken: null } });

  res.json({ success: true, message: 'Password reset successfully', data: { newPassword } });
};

export const updateCustomFields = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fieldName, value } = req.body;
  const user = await prisma.user.findUniqueOrThrow({ where: { id } });
  const updated = await prisma.user.update({
    where: { id },
    data: { customFields: { ...(user.customFields as any || {}), [fieldName]: value } },
  });
  res.json({ success: true, data: (updated as any).customFields });
};

export const updateProfile = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { firstName, lastName, phone, address, city, state } = req.body;

  const updates: any = { firstName, lastName, phone, address, city, state };

  if (req.file) {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (existing?.profilePhoto) {
      const oldPath = path.join(process.cwd(), existing.profilePhoto);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    updates.profilePhoto = `uploads/profiles/${req.file.filename}`;
  }

  const user = await prisma.user.update({ where: { id: userId }, data: updates, include: { role: true } });
  res.json({ success: true, data: sanitizeUser(user) });
};
