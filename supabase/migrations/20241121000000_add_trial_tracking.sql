-- Migration: Add trial tracking to credits table
-- This allows us to prevent users from using the trial multiple times

-- Add has_used_trial column to credits table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'credits' 
    AND column_name = 'has_used_trial'
  ) THEN
    ALTER TABLE "public"."credits" ADD COLUMN "has_used_trial" boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "credits_has_used_trial_idx" ON "public"."credits" ("has_used_trial");

