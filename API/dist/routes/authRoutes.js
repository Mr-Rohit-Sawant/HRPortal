"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post('/login', authController_1.login);
router.post('/logout', authMiddleware_1.authenticate, authController_1.logout);
router.post('/refresh', authController_1.refreshToken);
router.get('/me', authMiddleware_1.authenticate, authController_1.getMe);
router.post('/forgot-password', authController_1.forgotPassword);
router.post('/reset-password', authController_1.resetPassword);
router.post('/change-password', authMiddleware_1.authenticate, authController_1.changePassword);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map