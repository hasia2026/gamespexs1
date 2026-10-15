import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

/**
 * Stripe webhook — the source of truth for money.
 *
 * Listens for checkout.session.completed and calls member_mark_paid: it flips
 * members.payment_status to 'paid', stamps paid_cents, and posts the $10
 * charity allocation for premium/both tiers. Idempotent (stripe_checkout_sessions
 * dedupe table) so replayed events are harmless.
 *
 * The rpc is SECURITY DEFINER and revoked from anon/authenticated — PostgREST
 * method-level allow-lists can't be relied on here, so the function itself
 * checks auth.role() = 'service_role'. Raw money math is never client-callable.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature." }, { status: 400 });
  }

  const payload = await request.text();
  const stripe = new Stripe(secretKey);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const authUserId = session.metadata?.auth_user_id;
  const tier = session.metadata?.tier ?? "standard";
  const amount = session.amount_total ?? 0;

  if (!authUserId || amount <= 0) {
    // Refunds/cancellations or malformed sessions: acknowledge, don't explode.
    return NextResponse.json({ received: true });
  }

  // Server-side call to member_mark_paid. SECURITY DEFINER, revoked from all
  // interactive roles; only this service path can execute it.
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/member_mark_paid`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? anonKey}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_auth_user_id: authUserId,
      p_session_id: session.id,
      p_amount_cents: amount,
      p_tier: tier,
    }),
  });

  if (!res.ok) {
    console.error("member_mark_paid failed", res.status, await res.text());
    // 500 so Stripe retries the delivery.
    return NextResponse.json({ error: "Payment recording failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
