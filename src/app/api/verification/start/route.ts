import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Age-verification start (blueprint Level 2, safe pattern).
 *
 * Members click "Verify your age with ID" on their dashboard. When a vendor key
 * (STRIPE_IDENTITY_SECRET_KEY or PERSONA_API_KEY) is configured we hand back the
 * vendor's verification-session URL. Otherwise we answer with a graceful message
 * so the button still works — the feature is wired, just not activated.
 *
 * Privacy rule (see docs/AGE_VERIFICATION_LEGAL_NOTES.md): we never receive or
 * store ID images or dates of birth — only derived flags (verified_18) and the
 * vendor's verification reference, written by the completion path/webhook.
 */
export async function POST() {
  // Members only — this endpoint is never useful to a logged-out visitor.
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: member } = await supabase
    .from("members")
    .select("id, attested_18, verified_18")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if ((member as { verified_18?: boolean } | null)?.verified_18) {
    return NextResponse.json({ message: "Your age is already verified. Nothing more to do." });
  }

  // --- Stripe Identity hook -------------------------------------------------
  const stripeKey = process.env.STRIPE_IDENTITY_SECRET_KEY;
  if (stripeKey) {
    try {
      const body = new URLSearchParams({
        // Type option: document check. The vendor collects the ID and returns
        // only a session object — no documents ever touch our servers.
        type: "document",
        "options[document][require_matching_selfie]": "false",
      });
      const res = await fetch("https://api.stripe.com/v1/identity/verification_sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      const json = (await res.json()) as {
        id?: string;
        url?: string;
        error?: { message?: string };
      };
      if (!res.ok || !json.url) {
        return NextResponse.json(
          { message: json.error?.message ?? "Verification vendor returned an error. Try again shortly." },
          { status: 502 },
        );
      }
      // The completion webhook should use json.id as verification_ref and flip
      // members.verified_18 = true (we look the session up, never receive the document).
      return NextResponse.json({
        url: json.url,
        ref: json.id,
        vendor: "stripe_identity",
        attested_18: (member as { attested_18?: boolean } | null)?.attested_18 ?? false,
      });
    } catch {
      return NextResponse.json(
        { message: "Could not reach the verification vendor. Try again shortly." },
        { status: 502 },
      );
    }
  }

  // --- Persona hook (stub: create the session via their API when the key is added) ---
  if (process.env.PERSONA_API_KEY) {
    return NextResponse.json({
      message:
        "Persona is configured but its session flow isn't wired yet. Use Stripe Identity (STRIPE_IDENTITY_SECRET_KEY) or extend this route.",
    });
  }

  // --- Not configured: graceful answer so the button still works -------------
  return NextResponse.json({
    message:
      "Age verification with ID isn't switched on yet. Your 18+ attestation is already on file — ID checks will be available soon through a third-party vendor.",
    attested_18: (member as { attested_18?: boolean } | null)?.attested_18 ?? false,
  });
}
