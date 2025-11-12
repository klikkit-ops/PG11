-- Quick SQL Script to Add Credits to a User
-- Copy and paste this into Supabase SQL Editor

-- ============================================
-- OPTION 1: Add credits by User ID
-- ============================================
-- Replace 'USER_ID_HERE' with the actual user ID UUID
-- Replace 10 with the number of credits you want to add

DO $$
DECLARE
    target_user_id UUID := 'USER_ID_HERE'; -- ⬅️ CHANGE THIS
    credits_to_add INTEGER := 10; -- ⬅️ CHANGE THIS
BEGIN
    -- Check if credits record exists
    IF EXISTS (SELECT 1 FROM public.credits WHERE user_id = target_user_id) THEN
        -- Update existing record
        UPDATE public.credits
        SET credits = credits + credits_to_add,
            updated_at = NOW()
        WHERE user_id = target_user_id;
        
        RAISE NOTICE 'Added % credits to user %. New total: %', 
            credits_to_add, 
            target_user_id,
            (SELECT credits FROM public.credits WHERE user_id = target_user_id);
    ELSE
        -- Insert new record
        INSERT INTO public.credits (user_id, credits, updated_at)
        VALUES (target_user_id, credits_to_add, NOW());
        
        RAISE NOTICE 'Created new credits record for user % with % credits', 
            target_user_id, 
            credits_to_add;
    END IF;
END $$;

-- ============================================
-- OPTION 2: Add credits by Email (Easier!)
-- ============================================
-- Replace 'user@example.com' with the user's email
-- Replace 10 with the number of credits you want to add

DO $$
DECLARE
    user_email TEXT := 'user@example.com'; -- ⬅️ CHANGE THIS
    credits_to_add INTEGER := 10; -- ⬅️ CHANGE THIS
    target_user_id UUID;
    current_credits INTEGER;
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
        WHERE user_id = target_user_id
        RETURNING credits INTO current_credits;
        
        RAISE NOTICE 'Added % credits to user % (email: %). New total: %', 
            credits_to_add, 
            target_user_id,
            user_email,
            current_credits;
    ELSE
        -- Insert new record
        INSERT INTO public.credits (user_id, credits, updated_at)
        VALUES (target_user_id, credits_to_add, NOW());
        
        RAISE NOTICE 'Created new credits record for user % (email: %) with % credits', 
            target_user_id,
            user_email,
            credits_to_add;
    END IF;
END $$;

-- ============================================
-- OPTION 3: Set credits to exact amount (overwrites)
-- ============================================
-- This sets the credits to a specific number (doesn't add to existing)

DO $$
DECLARE
    user_email TEXT := 'user@example.com'; -- ⬅️ CHANGE THIS
    new_credit_amount INTEGER := 50; -- ⬅️ CHANGE THIS
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
        SET credits = new_credit_amount,
            updated_at = NOW()
        WHERE user_id = target_user_id;
        
        RAISE NOTICE 'Set credits to % for user % (email: %)', 
            new_credit_amount,
            target_user_id,
            user_email;
    ELSE
        -- Insert new record
        INSERT INTO public.credits (user_id, credits, updated_at)
        VALUES (target_user_id, new_credit_amount, NOW());
        
        RAISE NOTICE 'Created new credits record for user % (email: %) with % credits', 
            target_user_id,
            user_email,
            new_credit_amount;
    END IF;
END $$;

-- ============================================
-- BONUS: View user's current credits
-- ============================================
-- Use this to check a user's current credit balance

SELECT 
    u.id as user_id,
    u.email,
    COALESCE(c.credits, 0) as credits,
    c.updated_at as last_updated
FROM auth.users u
LEFT JOIN public.credits c ON u.id = c.user_id
WHERE u.email = 'user@example.com'; -- ⬅️ CHANGE THIS

-- ============================================
-- BONUS: List all users and their credits
-- ============================================

SELECT 
    u.id as user_id,
    u.email,
    COALESCE(c.credits, 0) as credits,
    c.updated_at as last_updated
FROM auth.users u
LEFT JOIN public.credits c ON u.id = c.user_id
ORDER BY u.email;

