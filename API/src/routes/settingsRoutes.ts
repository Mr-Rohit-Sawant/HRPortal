import { Router } from 'express';
import {
  getAppSettings, updateAppSettings, uploadLogo, uploadFont, uploadFavicon,
  getRoles, createRole, updateRole, deleteRole, cloneRole, toggleRole, getPermissions,
  getColumnDefinitions, upsertColumnDefinition, deleteColumnDefinition, reorderColumns,
  getAuditLogs, getNotifications, markNotificationRead, markAllNotificationsRead,
  uploadCustomFieldFiles,
} from '../controllers/settingsController';
import { authenticate, requirePermission, requireSuperAdmin, requireAnyPermission } from '../middleware/authMiddleware';
import { uploadLogo as uploadLogoMiddleware, uploadFont as uploadFontMiddleware, uploadFavicon as uploadFaviconMiddleware, uploadCustomFiles } from '../middleware/uploadMiddleware';

const router = Router();

router.use(authenticate);

// App Settings
router.get('/app', requirePermission('settings', 'view'), getAppSettings);
router.put('/app', requireAnyPermission('settings:language'), uploadLogoMiddleware.single('logo'), updateAppSettings);
router.post('/app/logo', requireSuperAdmin, uploadLogoMiddleware.single('logo'), uploadLogo);
router.post('/app/favicon', requireSuperAdmin, uploadFaviconMiddleware.single('favicon'), uploadFavicon);
router.post('/app/font', requireSuperAdmin, uploadFontMiddleware.single('font'), uploadFont);

// Roles — accept both old (settings:roles) and new (settings:manage_roles) permission keys
const canManageRoles = requireAnyPermission('settings:roles', 'settings:manage_roles');
router.get('/roles', canManageRoles, getRoles);
router.post('/roles', canManageRoles, createRole);
router.put('/roles/:id', canManageRoles, updateRole);
router.delete('/roles/:id', canManageRoles, deleteRole);
router.post('/roles/:id/clone', canManageRoles, cloneRole);
router.patch('/roles/:id/toggle', canManageRoles, toggleRole);
router.get('/permissions', canManageRoles, getPermissions);

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
