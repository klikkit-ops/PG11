-- Migration for PetGroove: Add videos table and update credits table

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

ALTER TABLE ONLY "public"."videos"
    ADD CONSTRAINT "videos_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."videos"
    ADD CONSTRAINT "videos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS "videos_user_id_idx" ON "public"."videos" USING btree ("user_id");

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS "videos_status_idx" ON "public"."videos" USING btree ("status");

-- Enable RLS on videos table
ALTER TABLE "public"."videos" ENABLE ROW LEVEL SECURITY;

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
GRANT ALL ON TABLE "public"."videos" TO "anon";
GRANT ALL ON TABLE "public"."videos" TO "authenticated";
GRANT ALL ON TABLE "public"."videos" TO "service_role";

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = "now"();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER "update_videos_updated_at"
    BEFORE UPDATE ON "public"."videos"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Create trigger for credits updated_at
CREATE TRIGGER "update_credits_updated_at"
    BEFORE UPDATE ON "public"."credits"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_updated_at_column"();

