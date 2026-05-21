"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settingsController_1 = require("../controllers/settingsController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
// App Settings
router.get('/app', (0, authMiddleware_1.requirePermission)('settings', 'view'), settingsController_1.getAppSettings);
router.put('/app', authMiddleware_1.requireSuperAdmin, uploadMiddleware_1.uploadLogo.single('logo'), settingsController_1.updateAppSettings);
router.post('/app/logo', authMiddleware_1.requireSuperAdmin, uploadMiddleware_1.uploadLogo.single('logo'), settingsController_1.uploadLogo);
router.post('/app/font', authMiddleware_1.requireSuperAdmin, uploadMiddleware_1.uploadFont.single('font'), settingsController_1.uploadFont);
// Roles
router.get('/roles', (0, authMiddleware_1.requirePermission)('settings', 'roles'), settingsController_1.getRoles);
router.post('/roles', authMiddleware_1.requireSuperAdmin, settingsController_1.createRole);
router.put('/roles/:id', authMiddleware_1.requireSuperAdmin, settingsController_1.updateRole);
router.delete('/roles/:id', authMiddleware_1.requireSuperAdmin, settingsController_1.deleteRole);
router.post('/roles/:id/clone', authMiddleware_1.requireSuperAdmin, settingsController_1.cloneRole);
router.get('/permissions', (0, authMiddleware_1.requirePermission)('settings', 'roles'), settingsController_1.getPermissions);
// Columns (GET is open to all authenticated users; manage requires permission)
// NOTE: /reorder must be before /:id or Express will match "reorder" as the id param
router.get('/columns', settingsController_1.getColumnDefinitions);
router.post('/columns', (0, authMiddleware_1.requirePermission)('columns', 'manage'), settingsController_1.upsertColumnDefinition);
router.put('/columns/reorder', (0, authMiddleware_1.requirePermission)('columns', 'manage'), settingsController_1.reorderColumns);
router.put('/columns/:id', (0, authMiddleware_1.requirePermission)('columns', 'manage'), settingsController_1.upsertColumnDefinition);
router.delete('/columns/:id', (0, authMiddleware_1.requirePermission)('columns', 'manage'), settingsController_1.deleteColumnDefinition);
// Audit Logs
router.get('/audit', (0, authMiddleware_1.requirePermission)('audit', 'view'), settingsController_1.getAuditLogs);
// Custom field file upload
router.post('/upload-custom-files', uploadMiddleware_1.uploadCustomFiles.array('files', 20), settingsController_1.uploadCustomFieldFiles);
// Notifications
router.get('/notifications', settingsController_1.getNotifications);
router.patch('/notifications/:id/read', settingsController_1.markNotificationRead);
router.patch('/notifications/read-all', settingsController_1.markAllNotificationsRead);
exports.default = router;
