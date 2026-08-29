import {
  createCheckoutSession,
  handleWebhookEvent,
} from '../services/stripe/payment.js';

export const createCheckoutSessionController = async (req, res, next) => {
  try {
    const { items, userId } = req.body;

    const session = await createCheckoutSession({ items, userId });
    console.log('Checkout session created:', session);
    res.json({ id: session.sessionId, url: session.url });
  } catch (error) {
    next(error);
  }
};

export const webhookController = (req, res, next) => {
  try {
    const event = req.body;

    handleWebhookEvent(event);

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};