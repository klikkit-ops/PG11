# Supabase Realtime Setup Guide

## Enable Realtime for Credits Table

To enable real-time updates for the credits in the navbar, you need to enable replication for the `credits` table in Supabase.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Replication** (or **Realtime** → **Settings**)
3. Find the `credits` table in the list
4. Toggle **Enable Replication** for the `credits` table
5. Make sure **INSERT**, **UPDATE**, and **DELETE** are enabled (at minimum, you need **UPDATE**)

### Option 2: Using SQL

Run this SQL in the Supabase SQL Editor:

```sql
-- Enable replication for the credits table
ALTER PUBLICATION supabase_realtime ADD TABLE credits;
```

### Option 3: Using Supabase CLI

```bash
supabase db remote commit
```

Then in your migration file, add:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE credits;
```

## Verify Realtime is Working

After enabling replication:

1. Open your app in the browser
2. Open the browser console (F12)
3. Look for logs like:
   - `[ClientSideCredits] Setting up subscription for user: ...`
   - `[ClientSideCredits] Subscription status: SUBSCRIBED`
4. Generate a video or purchase credits
5. You should see:
   - `[ClientSideCredits] Received postgres_changes event: ...`
   - `[ClientSideCredits] Credits updated for current user: ...`

## Fallback Mechanisms

Even if real-time isn't configured, the app has fallback mechanisms:

1. **Periodic Refresh**: Credits refresh every 5 seconds automatically
2. **Focus Refresh**: Credits refresh when you switch back to the browser tab
3. **Manual Refresh**: Page refresh always works

So the credits will update within 5 seconds even without real-time configured.

## Troubleshooting

If real-time still doesn't work after enabling replication:

1. **Check RLS Policies**: Make sure Row Level Security policies allow the user to read their own credits row
2. **Check Network**: Real-time uses WebSockets - make sure your network/firewall allows WebSocket connections
3. **Check Browser Console**: Look for errors in the browser console
4. **Check Supabase Logs**: Check the Supabase dashboard logs for any errors

## Required RLS Policy

Make sure you have an RLS policy that allows users to read their own credits:

```sql
-- Allow users to read their own credits
CREATE POLICY "Users can read own credits"
ON credits
FOR SELECT
USING (auth.uid() = user_id);
```

This policy is typically already set up, but verify it exists.

