-- Migration for PetGroove: Complete schema for video generation app
-- This migration creates all necessary tables for PetGroove

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- Create credits table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS "public"."credits" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "credits" integer DEFAULT 0 NOT NULL,
    "user_id" uuid NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."credits" OWNER TO "postgres";

-- Set up credits id sequence if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'credits_id_seq') THEN
    CREATE SEQUENCE "public"."credits_id_seq"
        START WITH 1
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 1;
    ALTER TABLE "public"."credits" ALTER COLUMN "id" SET DEFAULT nextval('credits_id_seq');
    ALTER SEQUENCE "public"."credits_id_seq" OWNED BY "public"."credits"."id";
  END IF;
END $$;

-- Add updated_at column to credits table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'credits' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE "public"."credits" ADD COLUMN "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL;
  END IF;
END $$;

-- Create videos table
CREATE TABLE IF NOT EXISTS "public"."videos" (
    "id" uuid DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" uuid NOT NULL,
    "input_image_url" text NOT NULL,
    "video_url" text,
    "status" text DEFAULT 'queued'::text NOT NULL,
    "dance_style" text NOT NULL,
    "prompt" text NOT NULL,
    "provider" text DEFAULT 'runway'::text NOT NULL,
    "error_message" text,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now()" NOT NULL
);

ALTER TABLE "public"."videos" OWNER TO "postgres";

-- Primary keys and constraints
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'credits_pkey'
  ) THEN
    ALTER TABLE ONLY "public"."credits"
        ADD CONSTRAINT "credits_pkey" PRIMARY KEY ("id");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'videos_pkey'
  ) THEN
    ALTER TABLE ONLY "public"."videos"
        ADD CONSTRAINT "videos_pkey" PRIMARY KEY ("id");
  END IF;
END $$;

-- Foreign keys
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'credits_user_id_fkey'
  ) THEN
    ALTER TABLE ONLY "public"."credits"
        ADD CONSTRAINT "credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'videos_user_id_fkey'
  ) THEN
    ALTER TABLE ONLY "public"."videos"
        ADD CONSTRAINT "videos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "videos_user_id_idx" ON "public"."videos" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "videos_status_idx" ON "public"."videos" USING btree ("status");
CREATE INDEX IF NOT EXISTS "credits_user_id_idx" ON "public"."credits" USING btree ("user_id");

-- Enable RLS
ALTER TABLE "public"."credits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."videos" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."credits";
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."credits";
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "public"."credits";
DROP POLICY IF EXISTS "Enable insert for service role" ON "public"."credits";
DROP POLICY IF EXISTS "Enable update for service role" ON "public"."credits";

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."videos";
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."videos";
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "public"."videos";
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "public"."videos";
DROP POLICY IF EXISTS "Enable all access for service role" ON "public"."videos";

-- RLS Policies for credits table
CREATE POLICY "Enable insert for authenticated users only" ON "public"."credits" 
    FOR INSERT TO "authenticated" 
    WITH CHECK (("auth"."uid"() = "user_id"));

CREATE POLICY "Enable read access for authenticated users" ON "public"."credits" 
    FOR SELECT TO "authenticated" 
    USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Enable update for authenticated users" ON "public"."credits" 
    FOR UPDATE TO "authenticated" 
    USING (("auth"."uid"() = "user_id")) 
    WITH CHECK (("auth"."uid"() = "user_id"));

CREATE POLICY "Enable insert for service role" ON "public"."credits" 
    FOR INSERT TO "service_role" 
    WITH CHECK (true);

CREATE POLICY "Enable update for service role" ON "public"."credits" 
    FOR UPDATE TO "service_role" 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable read access for service role" ON "public"."credits" 
    FOR SELECT TO "service_role" 
    USING (true);

-- RLS Policies for videos table
CREATE POLICY "Enable insert for authenticated users" ON "public"."videos" 
    FOR INSERT TO "authenticated" 
    WITH CHECK (("user_id" = "auth"."uid"()));

CREATE POLICY "Enable read access for authenticated users" ON "public"."videos" 
    FOR SELECT TO "authenticated" 
    USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Enable update for authenticated users" ON "public"."videos" 
    FOR UPDATE TO "authenticated" 
    USING (("auth"."uid"() = "user_id")) 
    WITH CHECK (("auth"."uid"() = "user_id"));

CREATE POLICY "Enable delete for authenticated users" ON "public"."videos" 
    FOR DELETE TO "authenticated" 
    USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Enable all access for service role" ON "public"."videos" 
    FOR ALL TO "service_role" 
    USING (true) 
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON TABLE "public"."credits" TO "anon";
GRANT ALL ON TABLE "public"."credits" TO "authenticated";
GRANT ALL ON TABLE "public"."credits" TO "service_role";
GRANT ALL ON TABLE "public"."videos" TO "anon";
GRANT ALL ON TABLE "public"."videos" TO "authenticated";
GRANT ALL ON TABLE "public"."videos" TO "service_role";

-- Grant sequence permissions
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'credits_id_seq') THEN
    GRANT ALL ON SEQUENCE "public"."credits_id_seq" TO "anon";
    GRANT ALL ON SEQUENCE "public"."credits_id_seq" TO "authenticated";
    GRANT ALL ON SEQUENCE "public"."credits_id_seq" TO "service_role";
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = "now"();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS "update_videos_updated_at" ON "public"."videos";
CREATE TRIGGER "update_videos_updated_at"
    BEFORE UPDATE ON "public"."videos"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_updated_at_column"();

DROP TRIGGER IF EXISTS "update_credits_updated_at" ON "public"."credits";
CREATE TRIGGER "update_credits_updated_at"
    BEFORE UPDATE ON "public"."credits"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_updated_at_column"();
