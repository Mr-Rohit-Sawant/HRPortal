"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRevenueChart = exports.getRecruitmentChart = exports.getDashboardStats = void 0;
const app_1 = require("../app");
const getDashboardStats = async (req, res) => {
    const isSuperAdmin = req.user?.isSuperAdmin;
    const businessId = req.user?.businessId;
    const userId = req.user?.userId;
    // Business-scoped filter (null for super admin = no filter)
    const bizFilter = isSuperAdmin ? {} : (businessId ? { businessId } : {});
    // Recent activity: super admin sees all, others see only their own
    const activityWhere = isSuperAdmin ? {} : { userId };
    const [totalEmployees, activeEmployees, totalClients, activeClients, totalJobs, activeJobs, totalCandidates, priorityCandidates, invoiceStats, priorityJobs, recentActivities,] = await Promise.all([
        app_1.prisma.user.count({ where: { isSuperAdmin: false, ...bizFilter } }),
        app_1.prisma.user.count({ where: { isSuperAdmin: false, status: 'ACTIVE', ...bizFilter } }),
        app_1.prisma.client.count({ where: { ...bizFilter } }),
        app_1.prisma.client.count({ where: { isActive: true, ...bizFilter } }),
        app_1.prisma.jobOpening.count({ where: { ...bizFilter } }),
        app_1.prisma.jobOpening.count({ where: { status: 'ACTIVE', ...bizFilter } }),
        app_1.prisma.candidate.count({ where: { ...bizFilter } }),
        app_1.prisma.candidate.count({ where: { isPriority: true, ...bizFilter } }),
        app_1.prisma.invoice.groupBy({
            by: ['status'],
            where: { ...bizFilter },
            _count: { id: true },
            _sum: { totalAmount: true },
        }),
        app_1.prisma.jobOpening.findMany({
            where: { priority: { in: ['HIGH', 'URGENT'] }, status: 'ACTIVE', ...bizFilter },
            include: { client: { select: { companyName: true } } },
            orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
            take: 10,
        }),
        app_1.prisma.auditLog.findMany({
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
    }, {});
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
exports.getDashboardStats = getDashboardStats;
const getRecruitmentChart = async (req, res) => {
    const { period = '6months' } = req.query;
    const months = period === '12months' ? 12 : 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const bizFilter = req.user?.isSuperAdmin ? {} : (req.user?.businessId ? { businessId: req.user.businessId } : {});
    const candidates = await app_1.prisma.candidate.findMany({
        where: { createdAt: { gte: startDate }, ...bizFilter },
        select: { createdAt: true, status: true },
    });
    const chartData = {};
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
            if (c.status === 'HIRED')
                chartData[key].hired++;
            if (c.status === 'REJECTED')
                chartData[key].rejected++;
        }
    });
    res.json({ success: true, data: Object.values(chartData) });
};
exports.getRecruitmentChart = getRecruitmentChart;
const getRevenueChart = async (req, res) => {
    const { period = '6months' } = req.query;
    const months = period === '12months' ? 12 : 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const bizFilter = req.user?.isSuperAdmin ? {} : (req.user?.businessId ? { businessId: req.user.businessId } : {});
    const invoices = await app_1.prisma.invoice.findMany({
        where: { createdAt: { gte: startDate }, status: { in: ['PAID', 'SENT'] }, ...bizFilter },
        select: { createdAt: true, totalAmount: true, status: true },
    });
    const chartData = {};
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
            if (inv.status === 'PAID')
                chartData[key].collected += Number(inv.totalAmount);
        }
    });
    res.json({ success: true, data: Object.values(chartData) });
};
exports.getRevenueChart = getRevenueChart;
//# sourceMappingURL=dashboardController.js.map