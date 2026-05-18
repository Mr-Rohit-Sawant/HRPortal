"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clientController_1 = require("../controllers/clientController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.get('/dropdown', (0, authMiddleware_1.requirePermission)('clients', 'view'), clientController_1.getClientDropdown);
router.get('/', (0, authMiddleware_1.requirePermission)('clients', 'view'), clientController_1.getClients);
router.get('/:id', (0, authMiddleware_1.requirePermission)('clients', 'view'), clientController_1.getClientById);
router.post('/', (0, authMiddleware_1.requirePermission)('clients', 'create'), clientController_1.createClient);
router.put('/:id', (0, authMiddleware_1.requirePermission)('clients', 'update'), clientController_1.updateClient);
router.patch('/:id/status', (0, authMiddleware_1.requirePermission)('clients', 'update'), clientController_1.toggleClientStatus);
router.patch('/:id/custom-fields', (0, authMiddleware_1.requirePermission)('clients', 'update'), clientController_1.updateCustomFields);
router.delete('/:id', (0, authMiddleware_1.requirePermission)('clients', 'delete'), clientController_1.deleteClient);
exports.default = router;
//# sourceMappingURL=clientRoutes.js.map