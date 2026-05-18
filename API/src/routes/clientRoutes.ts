import { Router } from 'express';
import { getClients, getClientById, createClient, updateClient, toggleClientStatus, deleteClient, getClientDropdown, updateCustomFields } from '../controllers/clientController';
import { authenticate, requirePermission } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/dropdown', requirePermission('clients', 'view'), getClientDropdown);
router.get('/', requirePermission('clients', 'view'), getClients);
router.get('/:id', requirePermission('clients', 'view'), getClientById);
router.post('/', requirePermission('clients', 'create'), createClient);
router.put('/:id', requirePermission('clients', 'update'), updateClient);
router.patch('/:id/status', requirePermission('clients', 'update'), toggleClientStatus);
router.patch('/:id/custom-fields', requirePermission('clients', 'update'), updateCustomFields);
router.delete('/:id', requirePermission('clients', 'delete'), deleteClient);

export default router;
