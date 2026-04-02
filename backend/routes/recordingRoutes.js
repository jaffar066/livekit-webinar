import express from 'express';
import {
  startRecording,
  stopRecording,
  deleteRecording,
  listRecordings,
} from '../services/recordingService.js';

const router = express.Router();

router.post('/start-recording', startRecording);
router.post('/stop-recording', stopRecording);
router.delete('/delete-recording/:filename', deleteRecording);
router.get('/recordings-list', listRecordings);

export default router;
