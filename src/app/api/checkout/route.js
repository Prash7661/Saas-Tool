import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, userEmail } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required for checkout' },
        { status: 401 }
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey || stripeSecretKey.includes('placeholder')) {
      // Demo response for local dev if Stripe keys are not configured yet
      const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      return NextResponse.json({
        url: `${origin}/?payment=demo_success&user_id=${userId}`,
        isDemo: true,
        message: 'Stripe API key not configured. Simulated payment redirection.',
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      automatic_payment_methods: { enabled: true },
      billing_address_collection: 'auto',
      mode: 'payment',
      customer_email: userEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'MarkdownTableIO Pro - Unlimited Conversions',
              description: 'Lifetime unlimited row Markdown table conversions with high-speed browser matrix processing.',
            },
            unit_amount: 500, // $5.00 flat fee
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId,
      },
      success_url: `${origin}/?payment=success`,
      cancel_url: `${origin}/?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
