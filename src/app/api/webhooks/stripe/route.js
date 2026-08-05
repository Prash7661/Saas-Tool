import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminSupabase } from '@/lib/supabase';

export async function POST(request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || stripeSecretKey.includes('placeholder')) {
    return NextResponse.json({ error: 'Stripe environment variables missing' }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
  });

  const bodyText = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;

  try {
    if (webhookSecret && !webhookSecret.includes('placeholder')) {
      event = stripe.webhooks.constructEvent(bodyText, signature, webhookSecret);
    } else {
      // In development mode without webhook secret, parse payload directly
      event = JSON.parse(bodyText);
    }
  } catch (err) {
    console.error(`Webhook Signature Verification Failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Intercept completed checkout sessions
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const customerId = session.customer;

    if (userId) {
      const supabaseAdmin = getAdminSupabase();
      
      const { error } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          is_premium: true,
          stripe_customer_id: customerId || null,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to update Supabase profile for premium status:', error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      console.log(`Successfully upgraded user ${userId} to Premium!`);
    }
  }

  return NextResponse.json({ received: true });
}
