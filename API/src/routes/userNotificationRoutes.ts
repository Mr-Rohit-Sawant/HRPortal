import { Router } from 'express';
import { authenticate, requireSuperAdmin } from '../middleware/authMiddleware';
import { uploadCustomFiles } from '../middleware/uploadMiddleware';
import {
  getUserNotifications,
  createUserNotification,
  updateUserNotification,
  deleteUserNotification,
  markNotificationRead,
  getNotificationPermissions,
  updateNotificationPermissions,
} from '../controllers/userNotificationController';

const router = Router();
router.use(authenticate);

router.get('/', getUserNotifications);
router.post('/', uploadCustomFiles.array('files', 10), createUserNotification);
router.get('/permissions', getNotificationPermissions);
router.put('/permissions', requireSuperAdmin, updateNotificationPermissions);
router.post('/:id/read', markNotificationRead);
router.put('/:id', updateUserNotification);
router.delete('/:id', deleteUserNotification);

export default router;
