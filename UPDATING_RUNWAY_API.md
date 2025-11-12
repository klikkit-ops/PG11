# Updating Runway API Implementation

## Official Documentation
- **API Docs**: https://docs.dev.runwayml.com/api/
- **Using the API Guide**: https://docs.dev.runwayml.com/guides/using-the-api
- **SDKs**: https://docs.dev.runwayml.com/api-details/sdks/
- **GitHub Examples**: https://github.com/runwayml/learn

## Steps to Fix

### Step 1: Check the Official API Documentation

Visit https://docs.dev.runwayml.com/api/ and find the **Image to Video** endpoint documentation. Look for:

1. **Endpoint URL**: What is the exact endpoint path?
   - Current guess: `/v1/image-to-video` or `/v1/tasks/image-to-video`
   - Check the actual endpoint in the docs

2. **Request Format**: What fields are required?
   - Current implementation uses: `image`, `prompt`, `model`, `duration`
   - Verify these are correct and what the exact field names should be

3. **Response Format**: What does the response look like?
   - Current implementation expects: `id`, `status`, `output: [{ url }]`
   - Verify the actual response structure

4. **Authentication**: How is authentication handled?
   - Current: Bearer token with API key in Authorization header
   - Verify this is correct

### Step 2: Check the Runway SDK (Recommended)

Runway provides official SDKs for Node.js and Python. Using the SDK is recommended because:
- Type safety
- Best practices built-in
- Automatic handling of API changes
- Better error handling

**To use the SDK:**
1. Install the Runway SDK: `npm install @runwayml/sdk` (check the exact package name)
2. Update the code to use the SDK instead of raw fetch calls
3. Follow the SDK documentation for image-to-video generation

### Step 3: Test the API Manually

Before updating the code, test the API manually:

```bash
curl -X POST https://api.runwayml.com/v1/image-to-video \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "image": "https://your-image-url.com/image.jpg",
    "prompt": "A pet dancing",
    "model": "gen4_turbo",
    "duration": 8
  }'
```

Replace:
- `YOUR_API_KEY` with your actual Runway API key
- The endpoint URL with the correct one from the docs
- The request body with the correct format from the docs

### Step 4: Update the Code

Once you know the correct endpoint and format:

1. Update `lib/runway.ts` with the correct endpoint
2. Update the request body format
3. Update the response parsing
4. Test with a real API call

### Step 5: Verify Environment Variables

Make sure these are set in Vercel:
- `RUNWAY_API_KEY` - Your Runway API key
- `RUNWAY_MODEL_ID` - Model ID (e.g., `gen4_turbo`)
- `RUNWAY_BASE_URL` - Base URL (e.g., `https://api.runwayml.com/v1`)

## Current Implementation Issues

Based on the logs showing videos stuck without `runway_video_id`, the likely issues are:

1. **Wrong Endpoint**: The endpoint `/image-to-video` might not be correct
2. **Wrong Request Format**: The request body might not match what Runway expects
3. **Wrong Response Parsing**: The response structure might be different
4. **API Key Issues**: The API key might not be set or invalid

## Recommended Next Steps

1. **Check the Documentation**: Visit https://docs.dev.runwayml.com/api/ and find the Image to Video endpoint
2. **Use the SDK**: If available, use the official Runway SDK instead of raw API calls
3. **Test Manually**: Test the API with curl or Postman to verify it works
4. **Update Code**: Update the implementation based on the actual API
5. **Test Integration**: Test the full flow after updating

## Quick Reference

### Current Implementation
- Endpoint: `${RUNWAY_BASE_URL}/image-to-video`
- Request: `{ image: imageUrl, prompt: string, model: string, duration: number }`
- Response: Expected `{ id, status, output: [{ url }] }`

### What to Check in Docs
- Actual endpoint path
- Required request fields
- Request field names (e.g., `image` vs `imageUrl`)
- Response structure
- Authentication method
- Error response format

## After Updating

Once you've updated the code based on the official documentation:

1. Deploy the updated code
2. Generate a new video
3. Check Vercel logs for the Runway API call
4. Verify the `runway_video_id` is being saved
5. Check that credits are being used in Runway

