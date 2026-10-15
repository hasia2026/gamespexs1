import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/config";
import Stripe from "stripe";

/**
 * Stripe Checkout launcher (live money — key lives in the Vercel env only).
 *
 * Memberships, from the blueprint pricing:
 *   standard — $2.25 one-time activation
 *   premium  — $110.00 bundle, exactly $10 of which is the 1% charity allocation
 *   both     — $112.25 (activation + bundle together)
 *
 * Join flow: the form sends auth fields, we create the Supabase account FIRST
 * (signUp signs the browser in), then the checkout session carries metadata
 * (auth_user_id, tier). The webhook — not the success redirect — flips
 * members.payment_status to 'paid'.
 * Upgrade flow: an already-signed-in member just sends a tier.
 */

const PRICES: Record<string, { amount: number; name: string; description: string }> = {
  standard: {
    amount: 225,
    name: "GAMESPEXS Standard Membership",
    description: "One-time registration activation",
  },
  premium: {
    amount: 11000,
    name: "GAMESPEXS Premium Bundle",
    description: "Onboarding bundle — includes the $10 charity allocation",
  },
  both: {
    amount: 11225,
    name: "GAMESPEXS Membership (both fees)",
    description: "$2.25 activation + $110 premium bundle",
  },
};

interface CheckoutBody {
  tier?: string;
  /** Street-team attribution: first active ref wins, 30-day cookie or ?ref= param. */
  ref_code?: string | null;
  signup?: {
    email?: string;
    password?: string;
    first_name?: string;
    last_initial?: string;
    attested_18?: boolean;
  };
}

export async function POST(request: Request) {
  if (isDemoMode) {
    return NextResponse.json(
      { error: "Stripe checkout requires the live database." },
      { status: 400 },
    );
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured yet (missing STRIPE_SECRET_KEY)." },
      { status: 503 },
    );
  }

  const body = ((await request.json().catch(() => ({}))) as CheckoutBody) ?? {};
  const tier = body.tier ?? "standard";
  const product = PRICES[tier];
  if (!product) {
    return NextResponse.json({ error: "Unknown membership tier." }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // Join flow: create the account before checkout so the webhook has a member
  // row to flip. signUp also signs this browser in, which the next getUser uses.
  if (body.signup?.email && body.signup.password) {
    const { error } = await supabase.auth.signUp({
      email: body.signup.email,
      password: body.signup.password,
      options: {
        data: {
          first_name: body.signup.first_name,
          last_initial: body.signup.last_initial,
          tier,
          attested_18: body.signup.attested_18 ? "true" : undefined,
        },
        emailRedirectTo: `${new URL(request.url).origin}/member`,
      },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Street-team attribution runs right after signup, best-effort (never blocks).
  if (body.ref_code) {
    try {
      await supabase.rpc("ref_attribute_signup", { p_code: body.ref_code.toUpperCase() });
    } catch {
      // best-effort
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const stripe = new Stripe(secretKey);
  const origin = process.env.APP_ORIGIN ?? new URL(request.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: product.amount,
            product_data: { name: product.name, description: product.description },
          },
        },
      ],
      metadata: {
        auth_user_id: user.id,
        tier,
      },
      success_url: `${origin}/member?checkout=success`,
      cancel_url: `${origin}/member?checkout=cancelled`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe returned no checkout URL." }, { status: 502 });
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("stripe checkout error", err);
    return NextResponse.json(
      { error: "Could not start Stripe Checkout. Try again shortly." },
      { status: 502 },
    );
  }
}
