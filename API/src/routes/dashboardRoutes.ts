import { Router } from 'express';
import { getDashboardStats, getRecruitmentChart, getRevenueChart } from '../controllers/dashboardController';
import { authenticate, requirePermission } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);
router.get('/stats', requirePermission('dashboard', 'view'), getDashboardStats);
router.get('/recruitment-chart', requirePermission('dashboard', 'view'), getRecruitmentChart);
router.get('/revenue-chart', requirePermission('dashboard', 'view'), getRevenueChart);

export default router;
