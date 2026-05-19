import { Request, Response } from 'express';
import { prisma } from '../app';

export const getDashboardStats = async (req: Request, res: Response) => {
  const isSuperAdmin = req.user?.isSuperAdmin;
  const businessId = req.user?.businessId;
  const userId = req.user?.userId;

  // Business-scoped filter (null for super admin = no filter)
  const bizFilter = isSuperAdmin ? {} : (businessId ? { businessId } : {});

  // Recent activity: super admin sees all, others see only their own
  const activityWhere = isSuperAdmin ? {} : { userId };

  const [
    totalEmployees,
    activeEmployees,
    totalClients,
    activeClients,
    totalJobs,
    activeJobs,
    totalCandidates,
    priorityCandidates,
    invoiceStats,
    priorityJobs,
    recentActivities,
  ] = await Promise.all([
    prisma.user.count({ where: { isSuperAdmin: false, ...bizFilter } }),
    prisma.user.count({ where: { isSuperAdmin: false, status: 'ACTIVE', ...bizFilter } }),
    prisma.client.count({ where: { ...bizFilter } }),
    prisma.client.count({ where: { isActive: true, ...bizFilter } }),
    prisma.jobOpening.count({ where: { ...bizFilter } }),
    prisma.jobOpening.count({ where: { status: 'ACTIVE', ...bizFilter } }),
    prisma.candidate.count({ where: { ...bizFilter } }),
    prisma.candidate.count({ where: { isPriority: true, ...bizFilter } }),
    prisma.invoice.groupBy({
      by: ['status'],
      where: { ...bizFilter },
      _count: { id: true },
      _sum: { totalAmount: true },
    }),
    prisma.jobOpening.findMany({
      where: { priority: { in: ['HIGH', 'URGENT'] }, status: 'ACTIVE', ...bizFilter },
      include: { client: { select: { companyName: true } } },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 10,
    }),
    prisma.auditLog.findMany({
      where: activityWhere,
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { firstName: true, lastName: true, profilePhoto: true } } },
    }),
  ]);

  const invoiceMap = invoiceStats.reduce((acc, item) => {
    acc[item.status] = {
      count: item._count.id,
      amount: Number(item._sum.totalAmount || 0),
    };
    return acc;
  }, {} as Record<string, any>);

  res.json({
    success: true,
    data: {
      stats: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees: totalEmployees - activeEmployees,
        totalClients,
        activeClients,
        totalJobs,
        activeJobs,
        closedJobs: totalJobs - activeJobs,
        totalCandidates,
        priorityCandidates,
        invoices: {
          draft: invoiceMap['DRAFT'] || { count: 0, amount: 0 },
          sent: invoiceMap['SENT'] || { count: 0, amount: 0 },
          paid: invoiceMap['PAID'] || { count: 0, amount: 0 },
          overdue: invoiceMap['OVERDUE'] || { count: 0, amount: 0 },
        },
      },
      priorityJobs,
      recentActivities,
    },
  });
};

export const getRecruitmentChart = async (req: Request, res: Response) => {
  const { period = '6months' } = req.query;
  const months = period === '12months' ? 12 : 6;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const bizFilter = req.user?.isSuperAdmin ? {} : (req.user?.businessId ? { businessId: req.user.businessId } : {});

  const candidates = await prisma.candidate.findMany({
    where: { createdAt: { gte: startDate }, ...bizFilter },
    select: { createdAt: true, status: true },
  });

  const chartData: Record<string, any> = {};
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    chartData[key] = { month: key, added: 0, hired: 0, rejected: 0 };
  }
  candidates.forEach((c) => {
    const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, '0')}`;
    if (chartData[key]) {
      chartData[key].added++;
      if (c.status === 'HIRED') chartData[key].hired++;
      if (c.status === 'REJECTED') chartData[key].rejected++;
    }
  });
  res.json({ success: true, data: Object.values(chartData) });
};

export const getRevenueChart = async (req: Request, res: Response) => {
  const { period = '6months' } = req.query;
  const months = period === '12months' ? 12 : 6;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const bizFilter = req.user?.isSuperAdmin ? {} : (req.user?.businessId ? { businessId: req.user.businessId } : {});

  const invoices = await prisma.invoice.findMany({
    where: { createdAt: { gte: startDate }, status: { in: ['PAID', 'SENT'] }, ...bizFilter },
    select: { createdAt: true, totalAmount: true, status: true },
  });

  const chartData: Record<string, any> = {};
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    chartData[key] = { month: key, invoiced: 0, collected: 0 };
  }
  invoices.forEach((inv) => {
    const key = `${inv.createdAt.getFullYear()}-${String(inv.createdAt.getMonth() + 1).padStart(2, '0')}`;
    if (chartData[key]) {
      chartData[key].invoiced += Number(inv.totalAmount);
      if (inv.status === 'PAID') chartData[key].collected += Number(inv.totalAmount);
    }
  });
  res.json({ success: true, data: Object.values(chartData) });
};
