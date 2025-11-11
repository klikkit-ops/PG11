'use client'
import { User } from '@supabase/supabase-js';
import React, { useEffect } from 'react';

interface StripePricingTableProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> {
  'pricing-table-id': string;
  'publishable-key': string;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-pricing-table': StripePricingTableProps;
    }
  }
}

type Props = {
  user: User;
}

const StripePricingTable = ({ user }: Props) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://js.stripe.com/v3/pricing-table.js";
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    }
  }, []);

  // TODO: Replace with your Stripe Pricing Table ID and Publishable Key
  // Create a Stripe Pricing Table in your Stripe Dashboard:
  // https://dashboard.stripe.com/test/pricing-tables
  // Then update the pricing-table-id and publishable-key below
  const pricingTableId = process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID || "prctbl_1P0TL0C3ic5Sd20TGpWOU2Fi";
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_live_51P0SikC3ic5Sd20T9QRaRKIkqy8l951LDgeOxcP24ZRXHnQzjnOFM7tfhsYdWksn1wNBdejJzvaxXGq0yRAxm14A00Py0XreGk";

  return (
    <div className='flex flex-1 flex-col w-full'>
      <stripe-pricing-table
          pricing-table-id={pricingTableId}
          publishable-key={publishableKey}
          client-reference-id={user.id}
          customer-email={user.email}
      >
      </stripe-pricing-table>
    </div>
  );
}

export default StripePricingTable;
