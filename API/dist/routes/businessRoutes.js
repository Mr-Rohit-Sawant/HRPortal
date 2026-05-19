"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const businessController_1 = require("../controllers/businessController");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.get('/dropdown', businessController_1.getBusinessesDropdown);
router.get('/', authMiddleware_1.requireSuperAdmin, businessController_1.getBusinesses);
router.get('/:id', authMiddleware_1.requireSuperAdmin, businessController_1.getBusiness);
router.post('/', authMiddleware_1.requireSuperAdmin, businessController_1.createBusiness);
router.put('/:id', authMiddleware_1.requireSuperAdmin, businessController_1.updateBusiness);
router.patch('/:id/toggle-status', authMiddleware_1.requireSuperAdmin, businessController_1.toggleBusinessStatus);
router.post('/:id/undo-delete', authMiddleware_1.requireSuperAdmin, businessController_1.undoDeleteBusiness);
router.delete('/:id', authMiddleware_1.requireSuperAdmin, businessController_1.deleteBusiness);
exports.default = router;
//# sourceMappingURL=businessRoutes.js.map