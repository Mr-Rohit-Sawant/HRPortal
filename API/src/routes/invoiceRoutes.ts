import { Router } from 'express';
import { getInvoices, getInvoiceById, createInvoice, updateInvoiceStatus, sendInvoiceToClient, downloadInvoicePDF, deleteInvoice } from '../controllers/invoiceController';
import { authenticate, requirePermission } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('invoices', 'view'), getInvoices);
router.get('/:id', requirePermission('invoices', 'view'), getInvoiceById);
router.get('/:id/download', requirePermission('invoices', 'view'), downloadInvoicePDF);
router.post('/', requirePermission('invoices', 'create'), createInvoice);
router.patch('/:id/status', requirePermission('invoices', 'update'), updateInvoiceStatus);
router.post('/:id/send', requirePermission('invoices', 'send_email'), sendInvoiceToClient);
router.delete('/:id', requirePermission('invoices', 'delete'), deleteInvoice);

export default router;
