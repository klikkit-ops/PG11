import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Stripe from "stripe";
import { Database } from "@/types/supabase";

export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const deploymentUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://petgroove.app";

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-08-16",
  typescript: true,
});

/**
 * POST /api/stripe/create-portal-session
 * Creates a Stripe Customer Portal session for subscription management
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the user's Stripe customer ID by looking up customers by email
    // Since we store user_id in customer metadata, we'll search for it
    const customers = await stripe.customers.list({
      email: user.email || undefined,
      limit: 100,
    });

    // Find the customer with matching user_id in metadata
    const customer = customers.data.find(
      (c) => c.metadata?.user_id === user.id
    );

    if (!customer) {
      return NextResponse.json(
        { error: "No active subscription found. Please contact support if you believe this is an error." },
        { status: 404 }
      );
    }

    // Create a billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${deploymentUrl}/overview/videos`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create subscription management session",
      },
      { status: 500 }
    );
  }
}

