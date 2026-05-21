"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRevenueChart = exports.getRecruitmentChart = exports.getDashboardStats = void 0;
const app_1 = require("../app");
const cache_1 = require("../utils/cache");
const getDashboardStats = async (req, res) => {
    const isSuperAdmin = req.user?.isSuperAdmin;
    const businessId = req.user?.businessId;
    const userId = req.user?.userId;
    const cacheKey = `stats:${isSuperAdmin ? 'sa' : (businessId ?? 'none')}`;
    const cached = cache_1.statsCache.get(cacheKey);
    if (cached)
        return res.json({ success: true, data: cached, _cached: true });
    const bizFilter = isSuperAdmin ? {} : (businessId ? { businessId } : {});
    const activityWhere = isSuperAdmin ? {} : { userId };
    const [totalEmployees, activeEmployees, totalClients, activeClients, totalJobs, activeJobs, totalCandidates, priorityCandidates, invoiceStats, priorityJobs, recentActivities,] = await Promise.all([
        app_1.prisma.user.count({ where: { isSuperAdmin: false, ...bizFilter } }),
        app_1.prisma.user.count({ where: { isSuperAdmin: false, status: 'ACTIVE', ...bizFilter } }),
        app_1.prisma.client.count({ where: bizFilter }),
        app_1.prisma.client.count({ where: { isActive: true, ...bizFilter } }),
        app_1.prisma.jobOpening.count({ where: bizFilter }),
        app_1.prisma.jobOpening.count({ where: { status: 'ACTIVE', ...bizFilter } }),
        app_1.prisma.candidate.count({ where: bizFilter }),
        app_1.prisma.candidate.count({ where: { isPriority: true, ...bizFilter } }),
        app_1.prisma.invoice.groupBy({
            by: ['status'],
            where: bizFilter,
            _count: { id: true },
            _sum: { totalAmount: true },
        }),
        app_1.prisma.jobOpening.findMany({
            where: { priority: { in: ['HIGH', 'URGENT'] }, status: 'ACTIVE', ...bizFilter },
            select: {
                id: true, jobTitle: true, priority: true, status: true, createdAt: true,
                client: { select: { companyName: true } },
            },
            orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
            take: 10,
        }),
        app_1.prisma.auditLog.findMany({
            where: activityWhere,
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true, action: true, module: true, createdAt: true, recordId: true,
                user: { select: { firstName: true, lastName: true, profilePhoto: true } },
            },
        }),
    ]);
    const invoiceMap = invoiceStats.reduce((acc, item) => {
        acc[item.status] = { count: item._count.id, amount: Number(item._sum.totalAmount || 0) };
        return acc;
    }, {});
    const data = {
        stats: {
            totalEmployees, activeEmployees, inactiveEmployees: totalEmployees - activeEmployees,
            totalClients, activeClients,
            totalJobs, activeJobs, closedJobs: totalJobs - activeJobs,
            totalCandidates, priorityCandidates,
            invoices: {
                draft: invoiceMap['DRAFT'] || { count: 0, amount: 0 },
                sent: invoiceMap['SENT'] || { count: 0, amount: 0 },
                paid: invoiceMap['PAID'] || { count: 0, amount: 0 },
                overdue: invoiceMap['OVERDUE'] || { count: 0, amount: 0 },
            },
        },
        priorityJobs,
        recentActivities,
    };
    cache_1.statsCache.set(cacheKey, data, cache_1.STATS_TTL);
    res.json({ success: true, data });
};
exports.getDashboardStats = getDashboardStats;
const getRecruitmentChart = async (req, res) => {
    const { period = '6months' } = req.query;
    const months = period === '12months' ? 12 : 6;
    const isSuperAdmin = req.user?.isSuperAdmin;
    const businessId = req.user?.businessId;
    const cacheKey = `recruit-chart:${isSuperAdmin ? 'sa' : (businessId ?? 'none')}:${months}`;
    const cached = cache_1.statsCache.get(cacheKey);
    if (cached)
        return res.json({ success: true, data: cached, _cached: true });
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    // SQL GROUP BY in the DB — avoids shipping thousands of rows to Node
    const rows = isSuperAdmin
        ? await app_1.prisma.$queryRaw `
        SELECT DATE_FORMAT(createdAt, '%Y-%m') as month,
               COUNT(*) as added,
               SUM(status = 'HIRED') as hired,
               SUM(status = 'REJECTED') as rejected
        FROM Candidate
        WHERE createdAt >= ${startDate}
        GROUP BY month ORDER BY month`
        : businessId
            ? await app_1.prisma.$queryRaw `
        SELECT DATE_FORMAT(createdAt, '%Y-%m') as month,
               COUNT(*) as added,
               SUM(status = 'HIRED') as hired,
               SUM(status = 'REJECTED') as rejected
        FROM Candidate
        WHERE createdAt >= ${startDate} AND businessId = ${businessId}
        GROUP BY month ORDER BY month`
            : [];
    // Build full month scaffold and merge DB results
    const chartData = {};
    for (let i = months - 1; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        chartData[key] = { month: key, added: 0, hired: 0, rejected: 0 };
    }
    for (const row of rows) {
        if (chartData[row.month]) {
            chartData[row.month].added = Number(row.added);
            chartData[row.month].hired = Number(row.hired);
            chartData[row.month].rejected = Number(row.rejected);
        }
    }
    const result = Object.values(chartData);
    cache_1.statsCache.set(cacheKey, result, cache_1.STATS_TTL);
    res.json({ success: true, data: result });
};
exports.getRecruitmentChart = getRecruitmentChart;
const getRevenueChart = async (req, res) => {
    const { period = '6months' } = req.query;
    const months = period === '12months' ? 12 : 6;
    const isSuperAdmin = req.user?.isSuperAdmin;
    const businessId = req.user?.businessId;
    const cacheKey = `revenue-chart:${isSuperAdmin ? 'sa' : (businessId ?? 'none')}:${months}`;
    const cached = cache_1.statsCache.get(cacheKey);
    if (cached)
        return res.json({ success: true, data: cached, _cached: true });
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const rows = isSuperAdmin
        ? await app_1.prisma.$queryRaw `
        SELECT DATE_FORMAT(createdAt, '%Y-%m') as month,
               SUM(totalAmount) as invoiced,
               SUM(CASE WHEN status = 'PAID' THEN totalAmount ELSE 0 END) as collected
        FROM Invoice
        WHERE createdAt >= ${startDate} AND status IN ('PAID','SENT')
        GROUP BY month ORDER BY month`
        : businessId
            ? await app_1.prisma.$queryRaw `
        SELECT DATE_FORMAT(createdAt, '%Y-%m') as month,
               SUM(totalAmount) as invoiced,
               SUM(CASE WHEN status = 'PAID' THEN totalAmount ELSE 0 END) as collected
        FROM Invoice
        WHERE createdAt >= ${startDate} AND status IN ('PAID','SENT') AND businessId = ${businessId}
        GROUP BY month ORDER BY month`
            : [];
    const chartData = {};
    for (let i = months - 1; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        chartData[key] = { month: key, invoiced: 0, collected: 0 };
    }
    for (const row of rows) {
        if (chartData[row.month]) {
            chartData[row.month].invoiced = Number(row.invoiced || 0);
            chartData[row.month].collected = Number(row.collected || 0);
        }
    }
    const result = Object.values(chartData);
    cache_1.statsCache.set(cacheKey, result, cache_1.STATS_TTL);
    res.json({ success: true, data: result });
};
exports.getRevenueChart = getRevenueChart;
//# sourceMappingURL=dashboardController.js.map