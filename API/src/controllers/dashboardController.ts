import { Request, Response } from 'express';
import { prisma } from '../app';

export const getDashboardStats = async (_req: Request, res: Response) => {
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
    prisma.user.count({ where: { isSuperAdmin: false } }),
    prisma.user.count({ where: { isSuperAdmin: false, status: 'ACTIVE' } }),
    prisma.client.count(),
    prisma.client.count({ where: { isActive: true } }),
    prisma.jobOpening.count(),
    prisma.jobOpening.count({ where: { status: 'ACTIVE' } }),
    prisma.candidate.count(),
    prisma.candidate.count({ where: { isPriority: true } }),
    prisma.invoice.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { totalAmount: true },
    }),
    prisma.jobOpening.findMany({
      where: { priority: { in: ['HIGH', 'URGENT'] }, status: 'ACTIVE' },
      include: { client: { select: { companyName: true } } },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 10,
    }),
    prisma.auditLog.findMany({
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

  const candidates = await prisma.candidate.findMany({
    where: { createdAt: { gte: startDate } },
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

  const invoices = await prisma.invoice.findMany({
    where: { createdAt: { gte: startDate }, status: { in: ['PAID', 'SENT'] } },
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
