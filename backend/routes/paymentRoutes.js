import express from 'express';
import {
  createCheckoutSessionController,
  webhookController,
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create-checkout-session', createCheckoutSessionController);

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  webhookController
);

export default router;