"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.get('/stats', (0, authMiddleware_1.requirePermission)('dashboard', 'view'), dashboardController_1.getDashboardStats);
router.get('/recruitment-chart', (0, authMiddleware_1.requirePermission)('dashboard', 'view'), dashboardController_1.getRecruitmentChart);
router.get('/revenue-chart', (0, authMiddleware_1.requirePermission)('dashboard', 'view'), dashboardController_1.getRevenueChart);
exports.default = router;
//# sourceMappingURL=dashboardRoutes.js.map