# Quick Fix: Vercel Blob Upload Error

## The Problem
You're getting this error when uploading:
```
Error uploading file: Vercel Blob: Access denied, please provide a valid token for this resource.
```

## The Solution

### ✅ Step 1: Set Environment Variable in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add:
   - **Key**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: `vercel_blob_rw_XEcbK3lwJslYCMXL_T5W5ma57A91tK8ovZ8pClDyesDW0iW`
   - **Environment**: Select all (Production, Preview, Development)
6. Click **Save**

### ✅ Step 2: Redeploy

1. Go to **Deployments** tab
2. Click the **⋯** menu on your latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

### ✅ Step 3: Test

1. Go to your app
2. Try uploading an image
3. It should work now! 🎉

## If It Still Doesn't Work

### Option A: Get a New Token

1. Go to Vercel Dashboard → **Storage** tab
2. Select your Blob store (or create one)
3. Go to **Settings** → **API**
4. Copy the **Read and Write** token
5. Update the environment variable in Vercel
6. Redeploy

### Option B: Verify Token Format

Make sure the token:
- Starts with `vercel_blob_rw_`
- Has no extra spaces or quotes
- Is the **Read and Write** token (not just Read)

### Option C: Check Vercel Logs

1. Go to Vercel Dashboard → **Deployments**
2. Click on your latest deployment
3. Check the **Logs** tab
4. Look for any error messages about the token

## Code Already Fixed

The code has been updated to:
- ✅ Explicitly check for the token
- ✅ Pass the token to Vercel Blob
- ✅ Provide better error messages

You just need to set the environment variable in Vercel and redeploy!

## Alternative: Use Supabase Storage

If you continue having issues, consider using Supabase Storage instead (you're already using Supabase). This would:
- ✅ Eliminate the need for Vercel Blob
- ✅ Simplify your setup
- ✅ Use your existing Supabase infrastructure

Let me know if you want help setting up Supabase Storage instead!

