"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const bugReportController_1 = require("../controllers/bugReportController");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
// Settings — any authenticated user can read; only super admin can write
router.get('/settings', bugReportController_1.getBugReportSettings);
router.put('/settings', authMiddleware_1.requireSuperAdmin, bugReportController_1.updateBugReportSettings);
// Status labels — any admin can read; super admin can manage
router.get('/status-labels', bugReportController_1.getStatusLabels);
router.post('/status-labels', authMiddleware_1.requireSuperAdmin, bugReportController_1.createStatusLabel);
router.patch('/status-labels/:id', authMiddleware_1.requireSuperAdmin, bugReportController_1.updateStatusLabel);
router.delete('/status-labels/:id', authMiddleware_1.requireSuperAdmin, bugReportController_1.deleteStatusLabel);
// Any authenticated user can submit
router.post('/', uploadMiddleware_1.uploadBugReport.array('files', 10), bugReportController_1.createBugReport);
// Listing & management — super admin only
router.get('/', authMiddleware_1.requireSuperAdmin, bugReportController_1.getBugReports);
router.get('/:id', authMiddleware_1.requireSuperAdmin, bugReportController_1.getBugReportById);
router.patch('/:id', authMiddleware_1.requireSuperAdmin, bugReportController_1.updateBugReport);
router.delete('/:id', authMiddleware_1.requireSuperAdmin, bugReportController_1.deleteBugReport);
exports.default = router;
