import express from 'express';
import { createToken } from '../services/tokenService.js';

const router = express.Router();

router.post('/get-token', createToken);
router.get('/get-token', createToken);

export default router;
