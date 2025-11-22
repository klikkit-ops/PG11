# Stripe Setup Guide for PetGroove

## Overview

PetGroove uses **Stripe Subscriptions** with a custom checkout flow. Even though you see products in the Product Catalogue, these products are actually **recurring subscription prices** that Stripe uses to create subscriptions.

## Current Flow

### 1. User Flow
1. User selects a plan (Trial, Weekly, or Annual) on `/get-credits`
2. User is redirected to `/checkout` (custom checkout page)
3. User enters payment details
4. **Payment Method Handling:**
   - Create payment method from card details
   - Get or create Stripe customer
   - **Attach payment method to customer FIRST** (this allows reuse)
5. **For Trial:**
   - Payment Intent is created and charged immediately ($0.59)
   - Subscription is created with 3-day trial period using the attached payment method
   - Subscription uses the **Weekly** price but starts in "trialing" status
   - If subscription creation fails after payment, refund is attempted
6. **For Weekly/Annual:**
   - Subscription is created immediately with the attached payment method and selected price
7. Webhook processes the subscription and grants coins

**Important Note:** The payment method MUST be attached to a customer BEFORE being used in a payment intent, otherwise Stripe won't allow it to be reused for subscription creation. This is why the flow attaches the payment method first, then uses it for both payment intent and subscription.

### 2. Stripe Products & Prices

You need **3 Products** in Stripe, each with **recurring prices**:

#### Product 1: "PetGroove Weekly"
- **Price:** $7.99/week (recurring)
- **Currency Support:** Multi-currency (USD, GBP, EUR, CAD, AUD)
- **Price ID:** Set as `NEXT_PUBLIC_STRIPE_PRICE_WEEKLY` environment variable
- **Used for:** Weekly subscriptions AND trial subscriptions (trial uses this price with a 3-day trial period)

#### Product 2: "PetGroove Annual"  
- **Price:** $69.99/year (recurring)
- **Currency Support:** Multi-currency (USD, GBP, EUR, CAD, AUD)
- **Price ID:** Set as `NEXT_PUBLIC_STRIPE_PRICE_ANNUAL` environment variable
- **Used for:** Annual subscriptions

#### Product 3: "Weekly Trial"
- **Price:** $0.59/week (recurring) - This is a placeholder price
- **Currency Support:** Multi-currency (USD, GBP, EUR, CAD, AUD)
- **Price ID:** Set as `NEXT_PUBLIC_STRIPE_PRICE_TRIAL` environment variable
- **Note:** This price is NOT actually used for subscriptions. It's only used to create the Payment Intent for the $0.59 upfront charge. The actual subscription uses the Weekly price.

### 3. Environment Variables

Set these in your Vercel project:

```
NEXT_PUBLIC_STRIPE_PRICE_WEEKLY=price_xxxxx  # Weekly subscription price ID
NEXT_PUBLIC_STRIPE_PRICE_ANNUAL=price_xxxxx  # Annual subscription price ID
NEXT_PUBLIC_STRIPE_PRICE_TRIAL=price_xxxxx   # Trial payment intent price ID (not used for subscription)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxxxx  # Stripe publishable key
STRIPE_SECRET_KEY=sk_xxxxx                    # Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_xxxxx            # Webhook signing secret
```

### 4. Multi-Currency Setup

Each price in Stripe should support multiple currencies. Stripe handles currency conversion automatically based on the customer's location. The app displays prices based on the selected country:

- **USD:** Trial $0.59, Weekly $7.99, Annual $69.99
- **GBP:** Trial £0.49, Weekly £5.99, Annual £59.99
- **EUR:** Trial €0.49, Weekly €7.49, Annual €64.99
- **CAD:** Trial $0.75, Weekly $10.99, Annual $94.99
- **AUD:** Trial $0.75, Weekly $12.99, Annual $109.99

**Important:** When creating prices in Stripe, you can either:
1. Create separate prices for each currency (not recommended - complex)
2. Use Stripe's built-in multi-currency support (recommended - single price object handles all currencies)

### 5. Webhook Setup

**Webhook URL:** `https://your-domain.com/stripe/subscription-webhook`

**Required Events:**
- `checkout.session.completed` - For Stripe Checkout (if you use it in the future)
- `customer.subscription.created` - **Critical** - Triggers when subscription is created
- `customer.subscription.updated` - Triggers when subscription status changes
- `invoice.payment_succeeded` - Triggers on subscription renewals

**Webhook Flow:**

1. **Trial Subscription Created:**
   - Event: `customer.subscription.created`
   - Status: `trialing`
   - Metadata: `is_trial: "true"`, `checkout_type: "custom"`
   - Action: Grant 100 coins, mark trial as used

2. **Trial Converts to Active:**
   - Event: `customer.subscription.updated`
   - Status: `active` (was `trialing`)
   - Action: Grant 1000 coins (weekly plan credits)

3. **Regular Subscription Renewal:**
   - Event: `invoice.payment_succeeded`
   - Action: Grant credits based on plan (1000 for weekly, 9000 for annual)

### 6. Database Schema

The app uses a `credits` table in Supabase:

```sql
credits (
  user_id UUID PRIMARY KEY,
  credits INTEGER DEFAULT 0,
  has_used_trial BOOLEAN DEFAULT false
)
```

### 7. Current Implementation Details

#### Trial Flow:
1. User selects Trial plan
2. Payment Intent created for $0.59 (using TRIAL price ID)
3. Payment confirmed
4. Subscription created with:
   - Price: Weekly price ID
   - Trial period: 3 days
   - Status: `trialing`
   - Metadata: `is_trial: "true"`, `checkout_type: "custom"`
5. Webhook receives `customer.subscription.created` event
6. Webhook grants 100 coins and marks trial as used
7. After 3 days, subscription converts to `active`
8. Webhook receives `customer.subscription.updated` event
9. Webhook grants 1000 coins (weekly plan)

#### Weekly/Annual Flow:
1. User selects plan
2. Subscription created immediately
3. Webhook receives `customer.subscription.created` event
4. Webhook grants credits based on plan

### 8. Troubleshooting

#### Issue: User charged but no coins granted
- **Check:** Webhook events in Stripe Dashboard → Developers → Webhooks
- **Check:** Vercel logs for webhook processing errors
- **Check:** Subscription metadata includes `is_trial: "true"` and `checkout_type: "custom"`
- **Check:** Look for `customer.subscription.created` events in Stripe Dashboard → Developers → Events
- **If no subscription events:** The subscription creation is failing. Check Vercel logs for errors.

#### Issue: Subscription creation fails (No `customer.subscription.created` events)
- **Check:** Vercel logs for detailed error messages (look for `[Subscription]` and `[Checkout]` logs)
- **Check:** Price IDs are correct in environment variables
- **Check:** Prices are recurring (not one-time) - Go to Product Catalogue → Click on price → Verify "Recurring" is selected
- **Check:** Payment method is attached to customer before creating subscription
- **Check:** Payment intent is confirmed before subscription creation
- **Common errors:**
  - `No such price: price_xxxxx` - Price ID doesn't exist or is wrong
  - `This price is not recurring` - Price is set as one-time instead of recurring
  - `No such payment_method: pm_xxxxx` - Payment method wasn't created or attached correctly
  - `You must provide a payment method` - Payment method not attached to customer

#### Issue: Trial not granting coins
- **Check:** Webhook is listening for `customer.subscription.created`
- **Check:** Subscription status is `trialing`
- **Check:** Subscription metadata includes `is_trial: "true"`
- **Check:** Webhook endpoint is receiving events (Stripe Dashboard → Developers → Webhooks → Click endpoint → View events)

### 9. Stripe Dashboard Checklist

- [ ] 3 Products created (Weekly, Annual, Trial)
- [ ] Each product has recurring prices with multi-currency support
- [ ] Price IDs copied to environment variables
- [ ] Webhook endpoint configured
- [ ] Webhook events enabled (subscription.created, subscription.updated, invoice.payment_succeeded)
- [ ] Webhook signing secret copied to environment variables
- [ ] Test mode vs Live mode keys configured correctly

### 10. Testing

1. **Test Trial:**
   - Create test subscription with trial period
   - Verify webhook receives `customer.subscription.created`
   - Verify 100 coins granted
   - Verify `has_used_trial` set to true

2. **Test Weekly:**
   - Create test subscription with weekly price
   - Verify webhook grants 1000 coins

3. **Test Annual:**
   - Create test subscription with annual price
   - Verify webhook grants 9000 coins

### 11. Important Notes

- **Subscriptions are required:** Even though you see "Products" in Stripe, these are actually subscription prices. The app creates Stripe Subscriptions, not one-time payments.
- **Trial uses Weekly price:** The trial subscription uses the Weekly price ID with a 3-day trial period. The $0.59 is charged separately via Payment Intent.
- **Multi-currency:** Stripe handles currency conversion automatically. You don't need separate price IDs for each currency if using Stripe's multi-currency feature.
- **Webhook is critical:** All coin granting happens via webhooks. If webhooks fail, users won't get coins even if payment succeeds.

### 12. Manually Associating Payments with Customers

If a payment was created under a "Guest" customer and you need to associate it with the correct customer:

**Option 1: Using Stripe Dashboard (Recommended)**
1. Go to Stripe Dashboard → **Payments**
2. Find the payment intent (search by amount, date, or payment intent ID like `pi_xxxxx`)
3. Click on the payment to open details
4. Note: **Payment Intents cannot be reassigned to different customers after creation**
5. However, you can add metadata or notes to track which customer it belongs to

**Option 2: Using Stripe API (Advanced)**
Since Payment Intents cannot be reassigned, if you need to track the relationship:
1. Add customer metadata to the payment intent:
   ```javascript
   await stripe.paymentIntents.update('pi_xxxxx', {
     metadata: {
       actual_customer_id: 'cus_xxxxx',
       actual_customer_email: 'customer@example.com'
     }
   });
   ```
2. Or create a refund and re-charge the correct customer:
   - Refund the "Guest" payment
   - Create a new payment intent with the correct customer ID
   - Confirm the payment

**Option 3: Leave as-is (Simplest)**
- If the payment is already successful and the subscription wasn't created:
  - The payment shows under "Guest" but is still valid
  - You can manually grant coins to the user in your database
  - Future payments will be correctly associated due to the fix

**Note:** The best solution is to ensure customers are created before payment intents (which is now fixed). Historical "Guest" payments can remain as-is if they're already processed successfully.

