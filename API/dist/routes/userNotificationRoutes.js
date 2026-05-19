"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const userNotificationController_1 = require("../controllers/userNotificationController");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.get('/', userNotificationController_1.getUserNotifications);
router.post('/', uploadMiddleware_1.uploadCustomFiles.array('files', 10), userNotificationController_1.createUserNotification);
router.get('/permissions', userNotificationController_1.getNotificationPermissions);
router.put('/permissions', authMiddleware_1.requireSuperAdmin, userNotificationController_1.updateNotificationPermissions);
router.post('/:id/read', userNotificationController_1.markNotificationRead);
router.put('/:id', userNotificationController_1.updateUserNotification);
router.delete('/:id', userNotificationController_1.deleteUserNotification);
exports.default = router;
//# sourceMappingURL=userNotificationRoutes.js.map