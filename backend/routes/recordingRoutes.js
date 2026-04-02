import express from 'express';
import {
  startRecording,
  stopRecording,
  deleteRecording,
  listRecordings,
} from '../services/recordingService.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/start-recording', requireAuth, startRecording);
router.post('/stop-recording', requireAuth, stopRecording);
router.delete('/delete-recording/:filename', requireAuth, deleteRecording);
router.get('/recordings-list', requireAuth, listRecordings);

export default router;
