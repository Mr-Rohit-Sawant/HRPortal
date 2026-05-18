import { Router } from 'express';
import {
  getCandidates, getCandidateById, createCandidate, updateCandidate,
  deleteCandidate, togglePriority, bulkImportCVs, getBulkImportStatus, downloadCV, updateCustomFields,
} from '../controllers/cvController';
import { authenticate, requirePermission } from '../middleware/authMiddleware';
import { uploadCV, uploadBulkCV } from '../middleware/uploadMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('cv', 'view'), getCandidates);
router.get('/bulk-status/:jobId', requirePermission('cv', 'view'), getBulkImportStatus);
router.get('/:id', requirePermission('cv', 'view'), getCandidateById);
router.get('/:id/download', requirePermission('cv', 'download'), downloadCV);
router.post('/', requirePermission('cv', 'create'), uploadCV.single('cvFile'), createCandidate);
router.post('/bulk-import', requirePermission('cv', 'bulk_import'), uploadBulkCV.array('files', 50), bulkImportCVs);
router.put('/:id', requirePermission('cv', 'update'), uploadCV.single('cvFile'), updateCandidate);
router.patch('/:id/priority', requirePermission('cv', 'update'), togglePriority);
router.patch('/:id/custom-fields', requirePermission('cv', 'update'), updateCustomFields);
router.delete('/:id', requirePermission('cv', 'delete'), deleteCandidate);

export default router;
