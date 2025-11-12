# Runway API Research

## Official Documentation
- **API Docs**: https://docs.dev.runwayml.com/api/
- **SDKs**: Node.js and Python SDKs available
- **GitHub**: https://github.com/runwayml/learn

## Key Findings

### API Structure
Based on the Runway API documentation structure, the API likely uses:
1. **Task-based workflow**: Create a task, then poll for status
2. **Base URL**: Likely `https://api.runwayml.com/v1` or similar
3. **Authentication**: Bearer token with API key
4. **Endpoints**: 
   - Create task: `POST /v1/tasks/image-to-video` or `POST /v1/image-to-video`
   - Get task status: `GET /v1/tasks/{taskId}` or `GET /v1/image-to-video/{taskId}`

### Request Format
The request likely needs:
- `image`: Image URL or base64 encoded image
- `prompt`: Text prompt describing the video
- `model`: Model identifier (e.g., `gen4_turbo`)
- `duration`: Video duration in seconds
- Additional optional parameters (seed, ratio, etc.)

### Response Format
The response likely returns:
- `id`: Task/video ID
- `status`: Task status (queued, processing, succeeded, failed)
- `output`: Array of output objects with URLs
- `error`: Error message if failed

## Next Steps

1. **Check Official Documentation**: Visit https://docs.dev.runwayml.com/api/ to get the exact endpoint structure
2. **Test API Endpoint**: Use the Runway API documentation to verify the correct endpoint
3. **Update Implementation**: Update the code to match the official API specification
4. **Test with Real API**: Make a test API call to verify the format is correct

## Current Implementation Issues

1. **Endpoint might be wrong**: Current endpoint is `/image-to-video` but might need to be `/v1/tasks/image-to-video`
2. **Request format might be wrong**: Field names or structure might not match Runway's API
3. **Response parsing might be wrong**: The response structure might be different than expected

## Recommended Approach

1. Check the Runway API documentation for the exact endpoint
2. Use the Runway SDK if available (Node.js SDK)
3. Test the API call with curl or Postman first
4. Update the implementation based on the actual API response

