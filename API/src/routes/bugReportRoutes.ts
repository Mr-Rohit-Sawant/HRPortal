import { Router } from 'express';
import { authenticate, requireSuperAdmin } from '../middleware/authMiddleware';
import { uploadBugReport } from '../middleware/uploadMiddleware';
import {
  getBugReports, createBugReport, updateBugReport, deleteBugReport,
  getBugReportSettings, updateBugReportSettings,
} from '../controllers/bugReportController';

const router = Router();
router.use(authenticate);

// Settings — any authenticated user can read (button visibility); only super admin can change
router.get('/settings', getBugReportSettings);
router.put('/settings', requireSuperAdmin, updateBugReportSettings);

// Any authenticated user can submit a bug report
router.post('/', uploadBugReport.array('files', 10), createBugReport);

// Listing & management — super admin only
router.get('/', requireSuperAdmin, getBugReports);
router.patch('/:id', requireSuperAdmin, updateBugReport);
router.delete('/:id', requireSuperAdmin, deleteBugReport);

export default router;
