import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async ({ items, userId }) => {
  console.log('Creating checkout session for user:', userId);
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',

    line_items: items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    })),

    metadata: { userId },

    success_url: `${process.env.CLIENT_URL}/success`,
    cancel_url: `${process.env.CLIENT_URL}/cancel`,
  });

   return {
    sessionId: session.id,
    url: session.url,
  };
};

export const handleWebhookEvent = (event) => {
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;

      console.log('✅ Payment successful for user:', session.metadata.userId);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }
};