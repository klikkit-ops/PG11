# AI Flow Explanation for PetGroove

## Overview
This document explains the complete AI video generation flow in your PetGroove app and what has been implemented.

## Complete Flow Diagram

```
1. User Uploads Image
   ↓
2. Image Stored in Vercel Blob
   ↓
3. User Selects Dance Style & Clicks Generate
   ↓
4. API Checks Authentication & Credits
   ↓
5. Prompt Generated (OpenAI or Fallback Template)
   ↓
6. Video Record Created in Database (status: "queued")
   ↓
7. Credit Deducted (1 credit)
   ↓
8. Runway API Called Asynchronously
   ↓
9. Runway Video ID Stored in Database
   ↓
10. Status Updated (processing/queued/succeeded/failed)
   ↓
11. User Views Status Page (Polls Every 5s)
   ↓
12. Status Endpoint Checks Runway API for Updates
   ↓
13. Video URL Stored When Complete
   ↓
14. User Can Download/View Video
```

## Detailed Step-by-Step Flow

### Step 1: Image Upload
- **Endpoint**: `POST /api/upload`
- **Location**: `app/api/upload/route.ts`
- **Process**:
  - User uploads pet image via form
  - Image validated (type, size < 10MB)
  - Image uploaded to Vercel Blob storage
  - Public URL returned

### Step 2: Video Generation Request
- **Endpoint**: `POST /api/videos/generate`
- **Location**: `app/api/videos/generate/route.ts`
- **Process**:
  1. **Authentication Check**: Verifies user is logged in
  2. **Input Validation**: Checks for `imageUrl` and `danceStyle`
  3. **Credit Check**: Verifies user has at least 1 credit
  4. **Prompt Generation**: Calls `generateDancePrompt()` from `lib/runway.ts`
     - If OpenAI API key is set: Uses GPT-4o-mini to generate optimized prompt
     - Otherwise: Uses fallback template with dance style descriptions
  5. **Database Record**: Creates video record with status "queued"
  6. **Credit Deduction**: Immediately deducts 1 credit
  7. **Async Generation**: Starts `generateVideoAsync()` function
  8. **Response**: Returns video ID and status

### Step 3: Video Generation (Async)
- **Function**: `generateVideoAsync()` in `app/api/videos/generate/route.ts`
- **Process**:
  1. Updates video status to "processing"
  2. Calls Runway API via `generateVideo()` from `lib/runway.ts`
  3. Stores Runway video ID in database
  4. Updates video status based on Runway response
  5. Stores video URL if generation is complete
  6. Handles errors and updates status to "failed" if needed

### Step 4: Runway API Integration
- **File**: `lib/runway.ts`
- **Functions**:
  - `generateVideo()`: Calls Runway API to start video generation
  - `checkVideoStatus()`: Checks status of video generation job
  - `generateDancePrompt()`: Generates prompt using OpenAI or fallback template

**Important Notes**:
- The Runway API implementation uses common REST API patterns
- You may need to adjust the endpoint (`/image-to-video`) based on actual Runway API documentation
- The request/response format may need adjustment based on Runway's actual API structure
- Check Runway API documentation at: https://docs.runwayml.com/

### Step 5: Status Checking
- **Endpoint**: `GET /api/videos/status?videoId=xxx`
- **Location**: `app/api/videos/status/route.ts`
- **Process**:
  1. Authenticates user
  2. Retrieves video record from database
  3. If status is "processing" or "queued":
     - Retrieves `runway_video_id` from database
     - Calls Runway API `checkVideoStatus()` to get latest status
     - Updates database if status changed
     - Updates video URL if generation completed
  4. Returns current video status and URL

### Step 6: Frontend Polling
- **Location**: `app/overview/videos/[id]/page.tsx`
- **Process**:
  - User views video detail page
  - Frontend polls `/api/videos/status` every 5 seconds
  - Updates UI when status changes
  - Shows video player when status is "succeeded"

## Database Schema

### Videos Table
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to users
- `input_image_url` (text): URL of uploaded pet image
- `video_url` (text, nullable): URL of generated video
- `status` (text): "queued" | "processing" | "succeeded" | "failed"
- `dance_style` (text): Selected dance style
- `prompt` (text): Generated prompt sent to Runway
- `provider` (text): "runway"
- `error_message` (text, nullable): Error message if generation failed
- `runway_video_id` (text, nullable): Runway API video ID for status checks
- `created_at` (timestamp): Creation timestamp
- `updated_at` (timestamp): Last update timestamp

## Environment Variables Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Runway API
RUNWAY_API_KEY=your-runway-api-key
RUNWAY_MODEL_ID=gen4_turbo
RUNWAY_BASE_URL=https://api.runwayml.com/v1

# OpenAI (optional, for prompt enhancement)
OPENAI_API_KEY=your-openai-api-key

# Vercel Blob
BLOB_READ_WRITE_TOKEN=your-blob-token
```

## Implementation Status

### ✅ Completed
1. Database schema with `runway_video_id` column
2. Runway API integration functions (`generateVideo`, `checkVideoStatus`)
3. Video generation endpoint with async processing
4. Status checking endpoint with Runway API polling
5. Prompt generation with OpenAI integration (optional) and fallback template
6. Credit deduction system
7. Error handling and status updates

### ⚠️ Needs Verification
1. **Runway API Endpoint**: The endpoint `/image-to-video` may need to be adjusted based on actual Runway API documentation
2. **Request Format**: The request body format may need adjustment (field names, structure)
3. **Response Format**: The response parsing may need adjustment based on actual Runway API response structure
4. **Authentication**: Verify that Bearer token authentication is correct for Runway API

### 📝 Next Steps
1. **Run Database Migration**: Apply the migration `20241111000001_add_runway_video_id.sql` to add the `runway_video_id` column
2. **Test Runway API**: Test the Runway API integration with actual API calls
3. **Adjust API Calls**: Update endpoint and request/response format based on Runway API documentation
4. **Set Up Webhooks** (Optional): Configure Runway webhooks to update video status automatically instead of polling
5. **Test End-to-End**: Test the complete flow from image upload to video generation

## Testing the Flow

1. **Upload Image**: Upload a pet image via the generate page
2. **Select Dance Style**: Choose a dance style
3. **Generate Video**: Click generate and verify:
   - Credit is deducted
   - Video record is created
   - Status updates to "processing"
   - Runway video ID is stored
4. **Check Status**: Monitor the status page and verify:
   - Status updates from "processing" to "succeeded"
   - Video URL is stored when complete
   - Video can be played/downloaded

## Troubleshooting

### Video Generation Fails
- Check Runway API key is correct
- Verify Runway API endpoint is correct
- Check Runway API response format matches expected format
- Review error messages in database `error_message` field

### Status Not Updating
- Verify `runway_video_id` is stored in database
- Check Runway API status endpoint is correct
- Verify Runway API is returning correct status values
- Check server logs for errors

### Credits Not Deducted
- Verify credits table exists and has correct structure
- Check user has credits before generation
- Verify credit deduction code is executing

## Additional Resources

- Runway API Documentation: https://docs.runwayml.com/
- Supabase Documentation: https://supabase.com/docs
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

