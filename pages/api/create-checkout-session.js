import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  weekly: 'price_1TjPVQIL5YGzi5qURS825Bv7',
  monthly: 'price_1TjPVsIL5YGzi5qUINNjRMRV',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plan, userId, userEmail } = req.body;

    if (!plan || !PRICE_IDS[plan]) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    if (!userId || !userEmail) {
      return res.status(400).json({ error: 'Missing user info' });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_IDS[plan],
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      client_reference_id: userId,
      metadata: {
        userId,
        plan,
      },
      success_url: `${siteUrl}/premium-welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
