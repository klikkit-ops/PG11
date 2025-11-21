import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Database } from "@/types/supabase";

export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-08-16",
  typescript: true,
});

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

    const body = await request.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment intent ID is required" },
        { status: 400 }
      );
    }

    // Retrieve the payment intent to get the charge ID
    // Expand charges to access the charge data
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['charges'],
    });

    // Access charges from the expanded data
    const charges = (paymentIntent as any).charges?.data;
    
    if (!charges || charges.length === 0 || !charges[0]?.id) {
      return NextResponse.json(
        { error: "No charge found for this payment intent" },
        { status: 400 }
      );
    }

    const chargeId = charges[0].id;

    // Create a refund
    const refund = await stripe.refunds.create({
      charge: chargeId,
      reason: "requested_by_customer",
    });

    return NextResponse.json({
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount,
    });
  } catch (error) {
    console.error("Error creating refund:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create refund";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

