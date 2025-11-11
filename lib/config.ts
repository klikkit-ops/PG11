export const config = {
  stripeEnabled: process.env.NEXT_PUBLIC_STRIPE_IS_ENABLED === 'true',
  deploymentUrl: process.env.DEPLOYMENT_URL,
  // Supabase configuration
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const;

function isVercelPreviewUrl(url: string): boolean {
  return url.includes('.vercel.app') &&
    (url.includes('-git-') ||
     url.match(/-[a-f0-9]{8,}\.vercel\.app/i) !== null);
}

export function validateConfig() {
  // Validate Stripe configuration
  if (typeof config.stripeEnabled !== 'boolean') {
    throw new Error('Invalid NEXT_PUBLIC_STRIPE_IS_ENABLED value');
  }

  // Validate Deployment URL (for webhooks)
  if (config.deploymentUrl && isVercelPreviewUrl(config.deploymentUrl)) {
    throw new Error(
      'Invalid DEPLOYMENT_URL: Preview URLs cannot be used for webhooks.\n' +
      'Please use either:\n' +
      '1. Your production domain (e.g., your-app.com)\n' +
      '2. For local development, use ngrok (e.g., your-tunnel.ngrok.io)'
    );
  }

  // Validate Supabase configuration (warn in development, error in production)
  if (process.env.NODE_ENV === 'production') {
    if (!config.supabaseUrl || config.supabaseUrl === 'https://placeholder.supabase.co') {
      throw new Error('MISSING NEXT_PUBLIC_SUPABASE_URL! Please set it in your environment variables.');
    }
    if (!config.supabaseAnonKey || config.supabaseAnonKey === 'placeholder-key') {
      throw new Error('MISSING NEXT_PUBLIC_SUPABASE_ANON_KEY! Please set it in your environment variables.');
    }
  } else {
    // In development, allow placeholder values but warn
    if (config.supabaseUrl === 'https://placeholder.supabase.co') {
      console.warn('Using placeholder Supabase URL for local development. Remember to set NEXT_PUBLIC_SUPABASE_URL for production.');
    }
    if (config.supabaseAnonKey === 'placeholder-key') {
      console.warn('Using placeholder Supabase Anon Key for local development. Remember to set NEXT_PUBLIC_SUPABASE_ANON_KEY for production.');
    }
  }
}


