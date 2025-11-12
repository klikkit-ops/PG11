# How to Add Credits Manually to a User in Supabase

This guide shows you multiple ways to manually add credits to a user's account in Supabase.

## Method 1: Using Supabase SQL Editor (Recommended)

### Step 1: Find the User ID

First, you need to find the user's ID. You can do this in the Supabase Dashboard:

1. Go to **Authentication** → **Users** in your Supabase dashboard
2. Find the user you want to add credits to
3. Copy their **User ID** (UUID format, e.g., `123e4567-e89b-12d3-a456-426614174000`)

Alternatively, you can query for a user by email:

```sql
-- Find user by email
SELECT id, email FROM auth.users WHERE email = 'user@example.com';
```

### Step 2: Add Credits Using SQL

Open the **SQL Editor** in Supabase Dashboard and run one of these queries:

#### Option A: Add credits to existing user (adds to current balance)

```sql
-- Add 10 credits to a user (adds to existing balance)
-- Replace 'USER_ID_HERE' with the actual user ID
INSERT INTO public.credits (user_id, credits, updated_at)
VALUES ('88e3ba29-d35d-4d61-a700-aa1b66827e06', 10, NOW())
ON CONFLICT (user_id) DO UPDATE
SET credits = credits.credits + 10,
    updated_at = NOW();
```

**Note**: This requires a unique constraint on `user_id`. If you don't have one, use Option B or C instead.

#### Option B: Add credits (works without unique constraint)

```sql
-- Add 10 credits to a user
-- This will update if record exists, or create if it doesn't
DO $$
DECLARE
    target_user_id UUID := '88e3ba29-d35d-4d61-a700-aa1b66827e06'; -- Replace with actual user ID
    credits_to_add INTEGER := 10; -- Change this to the number of credits you want to add
BEGIN
    -- Check if credits record exists
    IF EXISTS (SELECT 1 FROM public.credits WHERE user_id = target_user_id) THEN
        -- Update existing record
        UPDATE public.credits
        SET credits = credits + credits_to_add,
            updated_at = NOW()
        WHERE user_id = target_user_id;
    ELSE
        -- Insert new record
        INSERT INTO public.credits (user_id, credits, updated_at)
        VALUES (target_user_id, credits_to_add, NOW());
    END IF;
END $$;
```

#### Option C: Set credits to a specific amount (overwrites current balance)

```sql
-- Set user's credits to exactly 50
-- Replace 'USER_ID_HERE' with the actual user ID
DO $$
DECLARE
    target_user_id UUID := 'USER_ID_HERE'; -- Replace with actual user ID
    new_credit_amount INTEGER := 50; -- Change this to the desired credit amount
BEGIN
    -- Check if credits record exists
    IF EXISTS (SELECT 1 FROM public.credits WHERE user_id = target_user_id) THEN
        -- Update existing record
        UPDATE public.credits
        SET credits = new_credit_amount,
            updated_at = NOW()
        WHERE user_id = target_user_id;
    ELSE
        -- Insert new record
        INSERT INTO public.credits (user_id, credits, updated_at)
        VALUES (target_user_id, new_credit_amount, NOW());
    END IF;
END $$;
```

#### Option D: Add credits by email (convenient if you know the email)

```sql
-- Add 10 credits to a user by email
DO $$
DECLARE
    user_email TEXT := 'user@example.com'; -- Replace with user's email
    credits_to_add INTEGER := 10; -- Change this to the number of credits you want to add
    target_user_id UUID;
BEGIN
    -- Get user ID from email
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
    
    -- Check if credits record exists
    IF EXISTS (SELECT 1 FROM public.credits WHERE user_id = target_user_id) THEN
        -- Update existing record
        UPDATE public.credits
        SET credits = credits + credits_to_add,
            updated_at = NOW()
        WHERE user_id = target_user_id;
    ELSE
        -- Insert new record
        INSERT INTO public.credits (user_id, credits, updated_at)
        VALUES (target_user_id, credits_to_add, NOW());
    END IF;
    
    RAISE NOTICE 'Added % credits to user % (email: %)', credits_to_add, target_user_id, user_email;
END $$;
```

## Method 2: Using Supabase Dashboard Table Editor

1. Go to **Table Editor** → **credits** in your Supabase dashboard
2. Click **Insert** → **Insert row**
3. Fill in:
   - `user_id`: Paste the user's UUID
   - `credits`: Enter the number of credits (e.g., `10`)
   - `created_at`: Will be set automatically
   - `updated_at`: Will be set automatically
4. Click **Save**

**Note**: If the user already has a credits record, you'll need to:
1. Find the existing row
2. Click **Edit**
3. Update the `credits` value
4. Click **Save**

## Method 3: Create a Helper Function in Supabase

You can create a database function to make it easier to add credits:

```sql
-- Create a function to add credits to a user
CREATE OR REPLACE FUNCTION add_credits_to_user(
    p_user_id UUID,
    p_credits INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if credits record exists
    IF EXISTS (SELECT 1 FROM public.credits WHERE user_id = p_user_id) THEN
        -- Update existing record
        UPDATE public.credits
        SET credits = credits + p_credits,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    ELSE
        -- Insert new record
        INSERT INTO public.credits (user_id, credits, updated_at)
        VALUES (p_user_id, p_credits, NOW());
    END IF;
END;
$$;
```

Then you can use it like this:

```sql
-- Add 10 credits to a user
SELECT add_credits_to_user('USER_ID_HERE', 10);

-- Add credits by email
SELECT add_credits_to_user(
    (SELECT id FROM auth.users WHERE email = 'user@example.com'),
    10
);
```

## Method 4: Using a Script (Node.js/TypeScript)

Create a simple script to add credits programmatically:

```typescript
// add-credits.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addCredits(userId: string, credits: number) {
  // Check if credits record exists
  const { data: existing } = await supabase
    .from('credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from('credits')
      .update({
        credits: existing.credits + credits,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating credits:', error);
    } else {
      console.log(`Added ${credits} credits to user ${userId}. New total: ${existing.credits + credits}`);
    }
  } else {
    // Insert new record
    const { error } = await supabase.from('credits').insert({
      user_id: userId,
      credits: credits,
    });

    if (error) {
      console.error('Error creating credits:', error);
    } else {
      console.log(`Created credits record for user ${userId} with ${credits} credits`);
    }
  }
}

// Usage
// addCredits('USER_ID_HERE', 10);
```

## Quick Reference: Common SQL Queries

### View all users and their credits

```sql
SELECT 
    u.id,
    u.email,
    COALESCE(c.credits, 0) as credits,
    c.updated_at
FROM auth.users u
LEFT JOIN public.credits c ON u.id = c.user_id
ORDER BY u.email;
```

### View a specific user's credits

```sql
SELECT 
    u.id,
    u.email,
    COALESCE(c.credits, 0) as credits,
    c.updated_at
FROM auth.users u
LEFT JOIN public.credits c ON u.id = c.user_id
WHERE u.email = 'user@example.com';
```

### View users with zero or no credits

```sql
SELECT 
    u.id,
    u.email,
    COALESCE(c.credits, 0) as credits
FROM auth.users u
LEFT JOIN public.credits c ON u.id = c.user_id
WHERE c.credits IS NULL OR c.credits = 0;
```

### Reset all users' credits to 0

```sql
-- ⚠️ WARNING: This will set all users' credits to 0
UPDATE public.credits SET credits = 0, updated_at = NOW();
```

## Troubleshooting

### User doesn't have a credits record

If a user doesn't have a credits record yet, the queries above will create one automatically. Alternatively, you can ensure all users have a credits record by running:

```sql
-- Create credits record for all users who don't have one
INSERT INTO public.credits (user_id, credits, updated_at)
SELECT id, 0, NOW()
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.credits);
```

### Permission errors

If you get permission errors, make sure you're using the SQL Editor with the appropriate permissions, or use the service role key if running scripts.

### Finding user ID from email

```sql
SELECT id, email, created_at
FROM auth.users
WHERE email = 'user@example.com';
```

## Security Notes

- Always verify the user ID before adding credits
- Consider adding an admin interface for adding credits in production
- The service role key should never be exposed to the client
- Consider adding audit logs for credit additions in production

