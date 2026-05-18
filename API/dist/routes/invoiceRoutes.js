"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoiceController_1 = require("../controllers/invoiceController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.get('/', (0, authMiddleware_1.requirePermission)('invoices', 'view'), invoiceController_1.getInvoices);
router.get('/:id', (0, authMiddleware_1.requirePermission)('invoices', 'view'), invoiceController_1.getInvoiceById);
router.get('/:id/download', (0, authMiddleware_1.requirePermission)('invoices', 'view'), invoiceController_1.downloadInvoicePDF);
router.post('/', (0, authMiddleware_1.requirePermission)('invoices', 'create'), invoiceController_1.createInvoice);
router.patch('/:id/status', (0, authMiddleware_1.requirePermission)('invoices', 'update'), invoiceController_1.updateInvoiceStatus);
router.post('/:id/send', (0, authMiddleware_1.requirePermission)('invoices', 'send_email'), invoiceController_1.sendInvoiceToClient);
router.delete('/:id', (0, authMiddleware_1.requirePermission)('invoices', 'delete'), invoiceController_1.deleteInvoice);
exports.default = router;
//# sourceMappingURL=invoiceRoutes.js.map