import { Router } from 'express';
import {
  getJobs, getJobById, createJob, updateJob, deleteJob,
  addRound, updateSlot, addCandidateToRound, removeCandidateFromRound, importJobsCSV, updateCustomFields,
  renameRound, updateRoundColumns, updateSlotCustomField, bulkUpdateSlots, toggleJobAssignee, closeJob,
  startReplacement, updatePostSelectionRecord, uploadOfferLetter, updatePSRColumns,
} from '../controllers/jobController';
import { authenticate, requirePermission } from '../middleware/authMiddleware';
import { uploadDocument } from '../middleware/uploadMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('jobs', 'view'), getJobs);
router.get('/:id', requirePermission('jobs', 'view'), getJobById);
router.post('/', requirePermission('jobs', 'create'), uploadDocument.single('jdDocument'), createJob);
router.post('/import-csv', requirePermission('jobs', 'create'), importJobsCSV);
router.put('/:id', requirePermission('jobs', 'update'), uploadDocument.single('jdDocument'), updateJob);
router.delete('/:id', requirePermission('jobs', 'delete'), deleteJob);
router.patch('/:id/custom-fields', requirePermission('jobs', 'update'), updateCustomFields);
router.patch('/:id/assignees', requirePermission('jobs', 'update'), toggleJobAssignee);
router.post('/:id/close', requirePermission('jobs', 'update'), closeJob);
router.post('/:id/start-replacement', requirePermission('jobs', 'update'), startReplacement);
router.patch('/:id/psr-columns', requirePermission('jobs', 'update'), updatePSRColumns);

// Post Selection Records
router.patch('/psr/:recordId', requirePermission('jobs', 'update'), updatePostSelectionRecord);
router.post('/psr/:recordId/offer-letter', requirePermission('jobs', 'update'), uploadDocument.single('offerLetter'), uploadOfferLetter);

// Interview Rounds
router.post('/:id/rounds', requirePermission('jobs', 'update'), addRound);
router.patch('/rounds/:roundId', requirePermission('jobs', 'update'), renameRound);
router.patch('/rounds/:roundId/columns', requirePermission('jobs', 'update'), updateRoundColumns);
router.patch('/rounds/:roundId/slots/bulk', requirePermission('jobs', 'update'), bulkUpdateSlots);
router.post('/rounds/:roundId/candidates', requirePermission('jobs', 'update'), addCandidateToRound);
router.delete('/rounds/:roundId/candidates/:candidateId', requirePermission('jobs', 'update'), removeCandidateFromRound);
router.patch('/slots/:slotId', requirePermission('jobs', 'update'), updateSlot);
router.patch('/slots/:slotId/custom-fields', requirePermission('jobs', 'update'), updateSlotCustomField);

export default router;
