/**
 * GreenGlo Cleaners — Cloudflare Worker
 * Handles Stripe Payment Intent creation (keeps secret key server-side)
 *
 * SETUP (takes ~2 minutes):
 * 1. Go to https://workers.cloudflare.com and sign up for free
 * 2. Click "Create a Worker" → paste this entire file
 * 3. Replace STRIPE_SECRET_KEY below with your actual sk_live_... key
 * 4. Click "Save and Deploy"
 * 5. Copy the worker URL (e.g. https://greenglo-checkout.your-username.workers.dev)
 * 6. Paste that URL into config.json as "workerUrl"
 * 7. Also add your GitHub Pages domain to ALLOWED_ORIGINS below
 */

// ========================================================
// CONFIGURATION — edit these values
// ========================================================
const STRIPE_SECRET_KEY = "sk_live_YOUR_STRIPE_SECRET_KEY_HERE";
const ALLOWED_ORIGINS = [
  "https://YOUR_GITHUB_USERNAME.github.io",
  "https://greenglocleaners.co.uk",
  "http://localhost:5500",   // for local testing
  "http://127.0.0.1:5500",
];
// ========================================================

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o));
    const corsOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];

    const corsHeaders = {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);

    try {
      // ── Route: Create Payment Intent ──────────────────────────
      if (url.pathname === "/create-payment-intent") {
        const body = await request.json();
        const {
          depositAmount,
          serviceTitle,
          servicePrice,
          bookingRef,
          customerName,
          customerEmail,
          bookingDate,
          timeSlot,
          bedrooms,
          address,
          notes,
        } = body;

        if (!depositAmount || !serviceTitle || !bookingRef) {
          return jsonError(corsHeaders, "Missing required fields", 400);
        }

        // Amount in pence (Stripe uses smallest currency unit)
        const amountPence = Math.round(parseFloat(depositAmount) * 100);
        if (isNaN(amountPence) || amountPence < 30) {
          return jsonError(corsHeaders, "Invalid deposit amount", 400);
        }

        const formBody = new URLSearchParams({
          amount: amountPence,
          currency: "gbp",
          "payment_method_types[]": "card",
          description: `${serviceTitle} — 25% Deposit | Ref: ${bookingRef}`,
          receipt_email: customerEmail || "",
          "metadata[booking_ref]": bookingRef,
          "metadata[service]": serviceTitle,
          "metadata[full_price]": String(servicePrice || ""),
          "metadata[deposit]": String(depositAmount),
          "metadata[customer_name]": customerName || "",
          "metadata[booking_date]": bookingDate || "",
          "metadata[time_slot]": timeSlot || "",
          "metadata[bedrooms]": bedrooms ? String(bedrooms) : "",
          "metadata[address]": address || "",
          "metadata[notes]": (notes || "").substring(0, 500),
        });

        const stripeRes = await fetch("https://api.stripe.com/v1/payment_intents", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formBody,
        });

        const intent = await stripeRes.json();

        if (!stripeRes.ok) {
          return jsonError(corsHeaders, intent.error?.message || "Stripe error", 400);
        }

        return new Response(
          JSON.stringify({ clientSecret: intent.client_secret, intentId: intent.id }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── Route: Confirm booking after payment ──────────────────
      if (url.pathname === "/confirm-booking") {
        const { paymentIntentId, bookingRef } = await request.json();

        const stripeRes = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
          headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
        });
        const intent = await stripeRes.json();

        if (intent.status !== "succeeded") {
          return jsonError(corsHeaders, "Payment not completed", 400);
        }

        return new Response(
          JSON.stringify({ confirmed: true, status: intent.status, ref: bookingRef }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return jsonError(corsHeaders, "Unknown route", 404);

    } catch (err) {
      return jsonError(corsHeaders, err.message || "Internal error", 500);
    }
  },
};

function jsonError(corsHeaders, message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
