import { Router } from 'express';
import {
  getAppSettings, updateAppSettings, uploadLogo, uploadFont,
  getRoles, createRole, updateRole, deleteRole, cloneRole, getPermissions,
  getColumnDefinitions, upsertColumnDefinition, deleteColumnDefinition, reorderColumns,
  getAuditLogs, getNotifications, markNotificationRead, markAllNotificationsRead,
  uploadCustomFieldFiles,
} from '../controllers/settingsController';
import { authenticate, requirePermission, requireSuperAdmin } from '../middleware/authMiddleware';
import { uploadLogo as uploadLogoMiddleware, uploadFont as uploadFontMiddleware, uploadCustomFiles } from '../middleware/uploadMiddleware';

const router = Router();

router.use(authenticate);

// App Settings
router.get('/app', requirePermission('settings', 'view'), getAppSettings);
router.put('/app', requireSuperAdmin, uploadLogoMiddleware.single('logo'), updateAppSettings);
router.post('/app/logo', requireSuperAdmin, uploadLogoMiddleware.single('logo'), uploadLogo);
router.post('/app/font', requireSuperAdmin, uploadFontMiddleware.single('font'), uploadFont);

// Roles
router.get('/roles', requirePermission('settings', 'roles'), getRoles);
router.post('/roles', requireSuperAdmin, createRole);
router.put('/roles/:id', requireSuperAdmin, updateRole);
router.delete('/roles/:id', requireSuperAdmin, deleteRole);
router.post('/roles/:id/clone', requireSuperAdmin, cloneRole);
router.get('/permissions', requirePermission('settings', 'roles'), getPermissions);

// Columns (GET is open to all authenticated users; manage requires permission)
// NOTE: /reorder must be before /:id or Express will match "reorder" as the id param
router.get('/columns', getColumnDefinitions);
router.post('/columns', requirePermission('columns', 'manage'), upsertColumnDefinition);
router.put('/columns/reorder', requirePermission('columns', 'manage'), reorderColumns);
router.put('/columns/:id', requirePermission('columns', 'manage'), upsertColumnDefinition);
router.delete('/columns/:id', requirePermission('columns', 'manage'), deleteColumnDefinition);

// Audit Logs
router.get('/audit', requirePermission('audit', 'view'), getAuditLogs);

// Custom field file upload
router.post('/upload-custom-files', uploadCustomFiles.array('files', 20), uploadCustomFieldFiles);

// Notifications
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);
router.patch('/notifications/read-all', markAllNotificationsRead);

export default router;
