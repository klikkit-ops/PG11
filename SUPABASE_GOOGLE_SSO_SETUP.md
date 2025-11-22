# Setting Up Custom Domain for Google SSO

To change the Supabase URL shown in Google SSO from `nvfeyuzohfopxkiegxey.supabase.co` to "PetGroove" or your custom domain, you need to set up a **custom domain for Supabase Auth**.

**Important**: This requires a **paid Supabase plan** as custom domains are an add-on feature.

## Steps to Configure

### 1. Set Up Supabase Custom Domain (Required)

The "to continue to" text in Google's OAuth screen shows the **redirect URI domain**. Since Supabase OAuth always goes through Supabase's auth endpoint first, you need to use a custom domain for Supabase Auth.

1. **Upgrade to a paid Supabase plan** (if not already on one)
   - Custom domains are available as an add-on for paid plans

2. **Set up a custom domain for Supabase Auth**:
   - Use a subdomain like `auth.petgroove.app` or `api.petgroove.app`
   - This will replace `nvfeyuzohfopxkiegxey.supabase.co` in the OAuth flow

3. **Configure DNS**:
   - Add a CNAME record: `auth.petgroove.app` → `nvfeyuzohfopxkiegxey.supabase.co`
   - Or use the Supabase CLI to get specific DNS instructions

4. **Verify and activate** the custom domain in Supabase Dashboard

### 2. Supabase Dashboard Configuration

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

### 3. Google Cloud Console Configuration

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

### 4. Google OAuth Consent Screen

1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. Set the **Application name** to: `PetGroove`
3. Set the **Application home page** to: `https://petgroove.app`
4. Add your domain to **Authorized domains**:
   ```
   petgroove.app
   ```
5. Save and publish the changes

### 5. Update Supabase Google Provider Settings

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Click on **Google**
3. Ensure the **Client ID** and **Client Secret** from Google Cloud Console are correctly entered
4. The redirect URI should automatically use your Site URL, but verify it shows:
   ```
   https://petgroove.app/auth/callback
   ```

## Alternative: Application Name Only

If you don't want to set up a custom domain for Supabase Auth, you can at least change the **application name** that appears in Google's OAuth consent screen:

1. **Google Cloud Console** → **OAuth consent screen**
2. Set **Application name** to: `PetGroove`
3. The "to continue to" text will still show the Supabase URL, but the app name will show "PetGroove"

**Note**: The redirect URI domain (`nvfeyuzohfopxkiegxey.supabase.co`) will still appear in the "to continue to" text. To change that, you **must** set up a custom domain for Supabase Auth.

## Verify Environment Variables

Ensure your production environment has:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `NEXT_PUBLIC_APP_URL` - Set to `https://petgroove.app` (or your production domain)

## Why the Supabase URL Still Appears

The "to continue to" text in Google's OAuth screen shows the **redirect URI domain** that Google receives during the OAuth flow. 

**The Problem**: Supabase's OAuth flow always uses the Supabase project URL (`nvfeyuzohfopxkiegxey.supabase.co/auth/v1/callback`) as the redirect URI, even if you configure custom redirect URLs in your app. This is because Supabase handles the OAuth exchange server-side.

**The Solution**: To change the redirect URI domain that Google sees, you **must** set up a **custom domain for Supabase Auth**. This is a paid feature that allows you to use a subdomain like `auth.petgroove.app` instead of the Supabase project URL.

**What You Can Do Without Custom Domain**:
- Change the **Application name** to "PetGroove" in Google's OAuth consent screen
- This will show "PetGroove" in the consent screen, but the "to continue to" text will still show `nvfeyuzohfopxkiegxey.supabase.co`

**What Requires Custom Domain**:
- Changing the "to continue to" text to show your custom domain instead of the Supabase URL
- This requires a paid Supabase plan and custom domain setup

## Testing

After making these changes:
1. Clear your browser cache
2. Try signing in with Google
3. The OAuth screen should show "PetGroove" as the application name
4. The redirect URI will show your custom domain instead of the Supabase project URL

