# Fixing Vercel Blob Upload Error

## Error
```
Error uploading file: Vercel Blob: Access denied, please provide a valid token for this resource.
```

## Solution

### Step 1: Verify Token in Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Verify that `BLOB_READ_WRITE_TOKEN` is set with the correct value
4. Make sure it's enabled for **Production**, **Preview**, and **Development** environments
5. If it's not set, add it:
   - Name: `BLOB_READ_WRITE_TOKEN`
   - Value: Your blob token (starts with `vercel_blob_rw_`)
   - Environment: All (Production, Preview, Development)

### Step 2: Get a Valid Token

If you don't have a valid token or the current one is expired:

1. Go to Vercel Dashboard → **Storage** tab
2. Select your Blob store (or create one if you don't have one)
3. Go to **Settings** → **API**
4. Copy the **Read and Write** token
5. Update the environment variable in Vercel

### Step 3: Redeploy

After updating the environment variable:
1. Go to **Deployments** tab in Vercel
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger a new deployment

### Step 4: Verify the Fix

The code has been updated to:
- Explicitly check for the token
- Pass the token to the `put()` function
- Provide better error messages

## Alternative: Use Supabase Storage

If you continue having issues with Vercel Blob, consider switching to Supabase Storage since you're already using Supabase. This would:
- Eliminate the need for a separate storage service
- Simplify your setup
- Reduce costs (Supabase free tier includes storage)

See `SUPABASE_STORAGE_ALTERNATIVE.md` for implementation details.

## Testing

To test if the token is working:

1. Check Vercel logs after deploying
2. Try uploading an image
3. If you still get errors, check:
   - Token is correctly set in Vercel
   - Token hasn't expired
   - Token has read/write permissions
   - Blob store exists and is accessible

## Common Issues

### Token not found
- **Cause**: Environment variable not set in Vercel
- **Fix**: Add `BLOB_READ_WRITE_TOKEN` in Vercel dashboard and redeploy

### Invalid token
- **Cause**: Token is expired or incorrect
- **Fix**: Generate a new token from Vercel Storage settings

### Token format error
- **Cause**: Extra characters or quotes in token
- **Fix**: Make sure token doesn't have quotes or extra spaces

### Access denied
- **Cause**: Token doesn't have the right permissions
- **Fix**: Use a token with read/write permissions (not just read)

