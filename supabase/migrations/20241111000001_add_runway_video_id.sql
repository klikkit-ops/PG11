-- Add runway_video_id column to videos table for tracking Runway API video IDs
ALTER TABLE "public"."videos" 
ADD COLUMN IF NOT EXISTS "runway_video_id" text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "videos_runway_video_id_idx" ON "public"."videos" USING btree ("runway_video_id");

