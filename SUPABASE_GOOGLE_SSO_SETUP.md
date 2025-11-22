# Setting Up Custom Domain for Google SSO

To change the Supabase URL shown in Google SSO from `nvfeyuzohfopxkiegxey.supabase.co` to "PetGroove", you need to configure a custom redirect URI using your domain.

## Steps to Configure

### 1. Supabase Dashboard Configuration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. Set the **Site URL** to your production domain:
   ```
   https://petgroove.app
   ```
5. Add your production domain to **Redirect URLs**:
   ```
   https://petgroove.app/auth/callback
   https://www.petgroove.app/auth/callback
   ```
6. Save the changes

### 2. Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one if you haven't)
3. Navigate to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID (or create one if needed)
5. Add the following to **Authorized redirect URIs**:
   ```
   https://petgroove.app/auth/callback
   https://www.petgroove.app/auth/callback
   ```
   Also keep the Supabase redirect URI:
   ```
   https://nvfeyuzohfopxkiegxey.supabase.co/auth/v1/callback
   ```
6. Save the changes

### 3. Google OAuth Consent Screen

1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. Set the **Application name** to: `PetGroove`
3. Set the **Application home page** to: `https://petgroove.app`
4. Add your domain to **Authorized domains**:
   ```
   petgroove.app
   ```
5. Save and publish the changes

### 4. Update Supabase Google Provider Settings

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Click on **Google**
3. Ensure the **Client ID** and **Client Secret** from Google Cloud Console are correctly entered
4. The redirect URI should automatically use your Site URL, but verify it shows:
   ```
   https://petgroove.app/auth/callback
   ```

### 5. Verify Environment Variables

Ensure your production environment has:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `NEXT_PUBLIC_APP_URL` - Set to `https://petgroove.app` (or your production domain)

## Important Notes

- The "to continue to" text in Google's OAuth screen shows the **redirect URI domain**, not the application name
- To show "PetGroove" instead of the domain, you need to configure the **OAuth consent screen** application name
- The redirect URI domain will still show `petgroove.app` (or your domain), but the application name will show "PetGroove"
- It may take a few minutes for Google's changes to propagate

## Testing

After making these changes:
1. Clear your browser cache
2. Try signing in with Google
3. The OAuth screen should show "PetGroove" as the application name
4. The redirect URI will show your custom domain instead of the Supabase project URL

