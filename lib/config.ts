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
  // Note: This function is called during build time in app/layout.tsx
  // We should not throw errors during build as it will fail the deployment
  // Instead, we only log warnings and let runtime handle the actual validation
  
  // Validate Stripe configuration (non-blocking)
  if (typeof config.stripeEnabled !== 'boolean') {
    console.warn('WARNING: Invalid NEXT_PUBLIC_STRIPE_IS_ENABLED value. Defaulting to false.');
  }

  // Validate Deployment URL (for webhooks) - only warn, don't throw
  if (config.deploymentUrl && isVercelPreviewUrl(config.deploymentUrl)) {
    console.warn(
      'WARNING: DEPLOYMENT_URL appears to be a Vercel preview URL. ' +
      'Preview URLs cannot be used for webhooks. ' +
      'Use your production domain or an ngrok tunnel for local development.'
    );
  }

  // Validate Supabase configuration (warn only, don't block build)
  // Actual validation will happen at runtime when Supabase is actually used
  if (!config.supabaseUrl || config.supabaseUrl === 'https://placeholder.supabase.co') {
    console.warn('WARNING: NEXT_PUBLIC_SUPABASE_URL is not set or is a placeholder. Supabase features may not work at runtime.');
  }
  if (!config.supabaseAnonKey || config.supabaseAnonKey === 'placeholder-key') {
    console.warn('WARNING: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or is a placeholder. Supabase features may not work at runtime.');
  }
}


