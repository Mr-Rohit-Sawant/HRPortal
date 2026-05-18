import { Router } from 'express';
import {
  getEmployees, getEmployeeById, createEmployee, updateEmployee,
  toggleEmployeeStatus, deleteEmployee, resetEmployeePassword, updateProfile, updateCustomFields,
} from '../controllers/employeeController';
import { authenticate, requirePermission, requireSuperAdmin, requireAdminOrSuperAdmin } from '../middleware/authMiddleware';
import { uploadProfilePhoto } from '../middleware/uploadMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('employees', 'view'), getEmployees);
router.get('/:id', requirePermission('employees', 'view'), getEmployeeById);
router.post('/', requirePermission('employees', 'create'), uploadProfilePhoto.single('profilePhoto'), createEmployee);
router.put('/me', uploadProfilePhoto.single('profilePhoto'), updateProfile);
router.put('/:id', requirePermission('employees', 'update'), uploadProfilePhoto.single('profilePhoto'), updateEmployee);
router.patch('/:id/status', requirePermission('employees', 'toggle_status'), toggleEmployeeStatus);
router.patch('/:id/reset-password', requireAdminOrSuperAdmin, resetEmployeePassword);
router.patch('/:id/custom-fields', requirePermission('employees', 'update'), updateCustomFields);
router.delete('/:id', requirePermission('employees', 'delete'), deleteEmployee);

export default router;
