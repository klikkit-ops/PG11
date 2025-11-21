import { Database } from "@/types/supabase";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { streamToString } from "@/lib/utils";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getCreditsPerPeriod, PLANS } from "@/lib/billing";

export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("MISSING NEXT_PUBLIC_SUPABASE_URL!");
}

if (!supabaseServiceRoleKey) {
  throw new Error("MISSING SUPABASE_SERVICE_ROLE_KEY!");
}

export async function POST(request: Request) {
  console.log("Request from: ", request.url);
  console.log("Request: ", request);
  const headersObj = headers();
  const sig = headersObj.get("stripe-signature");

  if (!stripeSecretKey) {
    return NextResponse.json(
      {
        message: `Missing stripeSecretKey`,
      },
      { status: 400 }
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-08-16",
    typescript: true,
  });

  if (!sig) {
    return NextResponse.json(
      {
        message: `Missing signature`,
      },
      { status: 400 }
    );
  }

  if (!request.body) {
    return NextResponse.json(
      {
        message: `Missing body`,
      },
      { status: 400 }
    );
  }

  const rawBody = await streamToString(request.body);

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret!);
  } catch (err) {
    const error = err as Error;
    console.log("Error verifying webhook signature: " + error.message);
    return NextResponse.json(
      {
        message: `Webhook Error: ${error?.message}`,
      },
      { status: 400 }
    );
  }

  const supabase = createClient<Database>(
    supabaseUrl as string,
    supabaseServiceRoleKey as string,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event, stripe, supabase);
      return NextResponse.json({ message: "success" }, { status: 200 });

    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpdate(event, stripe, supabase);
      return NextResponse.json({ message: "success" }, { status: 200 });

    case "invoice.payment_succeeded":
      await handleInvoicePaymentSucceeded(event, stripe, supabase);
      return NextResponse.json({ message: "success" }, { status: 200 });

    default:
      console.log(`Unhandled event type: ${event.type}`);
      return NextResponse.json(
        {
          message: `Unhandled event type ${event.type}`,
        },
        { status: 200 } // Return 200 to acknowledge receipt
      );
  }
}

/**
 * Handle checkout.session.completed event
 * This is triggered when a user completes a subscription purchase
 */
async function handleCheckoutSessionCompleted(
  event: Stripe.Event,
  stripe: Stripe,
  supabase: ReturnType<typeof createClient<Database>>
) {
  const checkoutSession = event.data.object as Stripe.Checkout.Session;
  const userId = checkoutSession.client_reference_id;

  if (!userId) {
    console.error("Missing client_reference_id in checkout session");
    return;
  }

  // Get subscription details if this is a subscription checkout
  if (checkoutSession.mode === "subscription" && checkoutSession.subscription) {
    const subscription = await stripe.subscriptions.retrieve(
      checkoutSession.subscription as string
    );
    const priceId = subscription.items.data[0].price.id;
    const isTrial = checkoutSession.metadata?.is_trial === "true" || subscription.metadata?.is_trial === "true";
    
    // Handle trial subscription
    if (isTrial && subscription.status === "trialing") {
      // Grant 100 coins for trial (1 generation)
      await addCreditsToUser(userId, 100, supabase);
      
      // Mark user as having used the trial
      await markTrialAsUsed(userId, supabase);
      
      // Charge $0.49 as an invoice item
      try {
        const customerId = subscription.customer as string;
        await stripe.invoiceItems.create({
          customer: customerId,
          amount: 49, // $0.49 in cents
          currency: "usd",
          description: "3-Day Trial Fee",
        });
        
        // Create and pay the invoice immediately
        const invoice = await stripe.invoices.create({
          customer: customerId,
          auto_advance: true, // Auto-finalize
        });
        await stripe.invoices.pay(invoice.id);
      } catch (error) {
        console.error("Error charging trial fee:", error);
        // Continue even if fee charging fails - user still gets trial
      }
      
      // Store Stripe customer and subscription info
      await updateUserStripeInfo(
        userId,
        subscription.customer as string,
        subscription.id,
        subscription.status,
        supabase
      );
    } else {
      // Regular subscription
      const creditsPerPeriod = getCreditsPerPeriod(priceId);
      if (creditsPerPeriod > 0) {
        await addCreditsToUser(userId, creditsPerPeriod, supabase);
      }
      
      // Store Stripe customer and subscription info
      await updateUserStripeInfo(
        userId,
        subscription.customer as string,
        subscription.id,
        subscription.status,
        supabase
      );
    }
  } else if (checkoutSession.mode === "payment") {
    // Handle one-time payments (legacy support)
    const lineItems = await stripe.checkout.sessions.listLineItems(
      checkoutSession.id
    );
    const priceId = lineItems.data[0]?.price?.id;
    if (priceId) {
      const creditsPerPeriod = getCreditsPerPeriod(priceId);
      if (creditsPerPeriod > 0) {
        await addCreditsToUser(userId, creditsPerPeriod, supabase);
      }
    }
  }
}

/**
 * Handle subscription created/updated events
 */
async function handleSubscriptionUpdate(
  event: Stripe.Event,
  stripe: Stripe,
  supabase: ReturnType<typeof createClient<Database>>
) {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;

  // Get user ID from customer metadata or lookup
  const customer = await stripe.customers.retrieve(customerId);
  const userId = (customer as Stripe.Customer).metadata?.user_id;

  if (!userId) {
    console.error("Missing user_id in customer metadata");
    return;
  }

  const priceId = subscription.items.data[0].price.id;
  const isTrial = subscription.metadata?.is_trial === "true";
  const creditsPerPeriod = getCreditsPerPeriod(priceId);

  // Update user's Stripe info
  await updateUserStripeInfo(
    userId,
    customerId,
    subscription.id,
    subscription.status,
    supabase
  );

  // Handle trial-to-active conversion (when trial ends and converts to weekly)
  if (isTrial && subscription.status === "active" && subscription.trial_end && subscription.trial_end < Math.floor(Date.now() / 1000)) {
    // Trial has ended, grant weekly credits (1000 coins)
    if (creditsPerPeriod > 0) {
      await addCreditsToUser(userId, creditsPerPeriod, supabase);
    }
  } else if (subscription.status === "active" && creditsPerPeriod > 0) {
    // Regular active subscription renewal
    await addCreditsToUser(userId, creditsPerPeriod, supabase);
  }
}

/**
 * Handle invoice payment succeeded event
 * This is triggered on recurring subscription renewals
 */
async function handleInvoicePaymentSucceeded(
  event: Stripe.Event,
  stripe: Stripe,
  supabase: ReturnType<typeof createClient<Database>>
) {
  const invoice = event.data.object as Stripe.Invoice;
  
  if (!invoice.subscription) {
    return; // Not a subscription invoice
  }

  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  );
  const customerId = subscription.customer as string;

  // Get user ID from customer metadata
  const customer = await stripe.customers.retrieve(customerId);
  const userId = (customer as Stripe.Customer).metadata?.user_id;

  if (!userId) {
    console.error("Missing user_id in customer metadata");
    return;
  }

  const priceId = subscription.items.data[0].price.id;
  const creditsPerPeriod = getCreditsPerPeriod(priceId);

  // Add credits on successful payment
  if (creditsPerPeriod > 0) {
    await addCreditsToUser(userId, creditsPerPeriod, supabase);
  }
}

/**
 * Add credits to a user's account
 */
async function addCreditsToUser(
  userId: string,
  credits: number,
  supabase: ReturnType<typeof createClient<Database>>
) {
  const { data: existingCredits } = await supabase
    .from("credits")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (existingCredits) {
    const newCredits = existingCredits.credits + credits;
    const { error } = await supabase
      .from("credits")
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating credits:", error);
      throw error;
    }
  } else {
    const { error } = await supabase.from("credits").insert({
      user_id: userId,
      credits: credits,
    });

    if (error) {
      console.error("Error creating credits:", error);
      throw error;
    }
  }
}

/**
 * Mark user as having used the trial
 */
async function markTrialAsUsed(
  userId: string,
  supabase: ReturnType<typeof createClient<Database>>
) {
  const { error } = await supabase
    .from("credits")
    .update({
      has_used_trial: true,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Error marking trial as used:", error);
    // Don't throw - this is not critical enough to fail the webhook
  } else {
    console.log(`[Webhook] Marked user ${userId} as having used trial`);
  }
}

/**
 * Mark user as having used the trial
 */
async function markTrialAsUsed(
  userId: string,
  supabase: ReturnType<typeof createClient<Database>>
) {
  const { error } = await supabase
    .from("credits")
    .update({
      has_used_trial: true,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Error marking trial as used:", error);
    // Don't throw - this is not critical enough to fail the webhook
  } else {
    console.log(`[Webhook] Marked user ${userId} as having used trial`);
  }
}

/**
 * Update user's Stripe customer and subscription information
 * Note: This assumes you have a users table or profile table with these columns
 * You may need to create a migration to add these columns
 */
async function updateUserStripeInfo(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  subscriptionStatus: string,
  supabase: ReturnType<typeof createClient<Database>>
) {
  // TODO: Update this to match your actual user/profile table structure
  // This is a placeholder - you may need to create a user_profiles table
  // or add columns to an existing users table
  
  // For now, we'll store this in a metadata table or extend the credits table
  // This is a simplified approach - you may want to create a separate subscriptions table
  
  console.log("Stripe info update:", {
    userId,
    stripeCustomerId,
    stripeSubscriptionId,
    subscriptionStatus,
  });
  
  // Example: If you have a user_profiles table:
  // await supabase
  //   .from("user_profiles")
  //   .upsert({
  //     user_id: userId,
  //     stripe_customer_id: stripeCustomerId,
  //     stripe_subscription_id: stripeSubscriptionId,
  //     stripe_subscription_status: subscriptionStatus,
  //     updated_at: new Date().toISOString(),
  //   });
}
