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
    const { paymentMethodId, customerId: providedCustomerId, email } = body;

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "Payment method ID is required" },
        { status: 400 }
      );
    }

    let customerId: string;

    if (providedCustomerId) {
      // Use provided customer ID
      customerId = providedCustomerId;
    } else {
      // Get or create customer by email
      const userEmail = email || user.email;
      
      if (!userEmail) {
        return NextResponse.json(
          { error: "Email is required" },
          { status: 400 }
        );
      }

      // Try to find existing customer by email
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
        // Update metadata to ensure user_id is set
        await stripe.customers.update(customerId, {
          metadata: {
            user_id: user.id,
          },
        });
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            user_id: user.id,
          },
        });
        customerId = customer.id;
      }
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return NextResponse.json({
      customerId,
    });
  } catch (error) {
    console.error("Error attaching payment method:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to attach payment method";
    const stripeError = error as any;
    
    // Handle case where payment method is already attached
    if (stripeError?.code === 'resource_already_exists') {
      return NextResponse.json({
        customerId: stripeError?.param?.customer || null,
      });
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

