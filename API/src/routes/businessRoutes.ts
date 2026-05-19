import { Router } from 'express';
import { authenticate, requireSuperAdmin } from '../middleware/authMiddleware';
import {
  getBusinesses, getBusiness, createBusiness, updateBusiness,
  deleteBusiness, getBusinessesDropdown, undoDeleteBusiness, toggleBusinessStatus,
} from '../controllers/businessController';

const router = Router();
router.use(authenticate);

router.get('/dropdown', getBusinessesDropdown);
router.get('/', requireSuperAdmin, getBusinesses);
router.get('/:id', requireSuperAdmin, getBusiness);
router.post('/', requireSuperAdmin, createBusiness);
router.put('/:id', requireSuperAdmin, updateBusiness);
router.patch('/:id/toggle-status', requireSuperAdmin, toggleBusinessStatus);
router.post('/:id/undo-delete', requireSuperAdmin, undoDeleteBusiness);
router.delete('/:id', requireSuperAdmin, deleteBusiness);

export default router;
