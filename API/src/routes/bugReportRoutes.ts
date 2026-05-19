import { Router } from 'express';
import { authenticate, requireSuperAdmin } from '../middleware/authMiddleware';
import { uploadBugReport } from '../middleware/uploadMiddleware';
import {
  getBugReports, getBugReportById, createBugReport, updateBugReport, deleteBugReport,
  getBugReportSettings, updateBugReportSettings,
  getStatusLabels, createStatusLabel, updateStatusLabel, deleteStatusLabel,
} from '../controllers/bugReportController';

const router = Router();
router.use(authenticate);

// Settings — any authenticated user can read; only super admin can write
router.get('/settings', getBugReportSettings);
router.put('/settings', requireSuperAdmin, updateBugReportSettings);

// Status labels — any admin can read; super admin can manage
router.get('/status-labels', getStatusLabels);
router.post('/status-labels', requireSuperAdmin, createStatusLabel);
router.patch('/status-labels/:id', requireSuperAdmin, updateStatusLabel);
router.delete('/status-labels/:id', requireSuperAdmin, deleteStatusLabel);

// Any authenticated user can submit
router.post('/', uploadBugReport.array('files', 10), createBugReport);

// Listing & management — super admin only
router.get('/', requireSuperAdmin, getBugReports);
router.get('/:id', requireSuperAdmin, getBugReportById);
router.patch('/:id', requireSuperAdmin, updateBugReport);
router.delete('/:id', requireSuperAdmin, deleteBugReport);

export default router;
