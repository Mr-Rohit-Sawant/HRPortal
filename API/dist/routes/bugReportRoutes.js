"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const bugReportController_1 = require("../controllers/bugReportController");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
// Settings — any authenticated user can read (button visibility); only super admin can change
router.get('/settings', bugReportController_1.getBugReportSettings);
router.put('/settings', authMiddleware_1.requireSuperAdmin, bugReportController_1.updateBugReportSettings);
// Any authenticated user can submit a bug report
router.post('/', uploadMiddleware_1.uploadBugReport.array('files', 10), bugReportController_1.createBugReport);
// Listing & management — super admin only
router.get('/', authMiddleware_1.requireSuperAdmin, bugReportController_1.getBugReports);
router.patch('/:id', authMiddleware_1.requireSuperAdmin, bugReportController_1.updateBugReport);
router.delete('/:id', authMiddleware_1.requireSuperAdmin, bugReportController_1.deleteBugReport);
exports.default = router;
//# sourceMappingURL=bugReportRoutes.js.map