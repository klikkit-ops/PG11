/**
 * Image processing utilities for video generation
 * Handles aspect ratio conversion to 9:16 (portrait/vertical)
 */

import sharp from 'sharp';

/**
 * Process an image to 9:16 aspect ratio (portrait/vertical)
 * Downloads the image, crops/resizes it to 9:16, and returns the processed buffer
 */
export async function processImageTo9x16(imageUrl: string, targetHeight: number = 854): Promise<Buffer> {
  try {
    // Download the original image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    const { width, height } = metadata;

    if (!width || !height) {
      throw new Error('Could not read image dimensions');
    }

    // Calculate target dimensions for 9:16 aspect ratio
    // targetHeight is the height we want (e.g., 854 for 480P)
    const targetWidth = Math.round(targetHeight * (9 / 16)); // 9:16 ratio

    // Process the image
    let processedImage = sharp(buffer);

    // Calculate how to crop/resize to 9:16
    const currentAspectRatio = width / height;
    const targetAspectRatio = 9 / 16; // 0.5625

    if (currentAspectRatio > targetAspectRatio) {
      // Image is wider than 9:16 - crop the width (center crop)
      const cropWidth = Math.round(height * targetAspectRatio);
      const left = Math.round((width - cropWidth) / 2);
      processedImage = processedImage.extract({
        left,
        top: 0,
        width: cropWidth,
        height: height,
      });
    } else {
      // Image is taller than 9:16 - crop the height (center crop)
      const cropHeight = Math.round(width / targetAspectRatio);
      const top = Math.round((height - cropHeight) / 2);
      processedImage = processedImage.extract({
        left: 0,
        top,
        width: width,
        height: cropHeight,
      });
    }

    // Resize to target dimensions
    const processedBuffer = await processedImage
      .resize(targetWidth, targetHeight, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    console.log(`[ImageProcessing] Processed image from ${width}x${height} to ${targetWidth}x${targetHeight} (9:16)`);
    return processedBuffer;
  } catch (error) {
    console.error('[ImageProcessing] Error processing image:', error);
    throw error;
  }
}

/**
 * Upload processed image to Vercel Blob and return the URL
 */
export async function uploadProcessedImage(
  processedBuffer: Buffer,
  userId: string,
  originalFilename: string
): Promise<string> {
  const { put } = await import('@vercel/blob');
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (!blobToken) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set');
  }

  // Create a filename for the processed image
  const filename = `${userId}/${Date.now()}-processed-9x16-${originalFilename.replace(/\.[^/.]+$/, '')}.jpg`;

  // Upload the processed image
  const blob = await put(filename, processedBuffer, {
    access: 'public',
    token: blobToken,
    contentType: 'image/jpeg',
  });

  return blob.url;
}

/**
 * Calculate 9:16 dimensions based on a target resolution
 */
export function get9x16Dimensions(resolution: '480P' | '720P' | '1080P'): { width: number; height: number } {
  // For 9:16 aspect ratio (portrait/vertical):
  // 480P: 270x480 (or 480x854 for higher quality)
  // 720P: 405x720 (or 720x1280 for higher quality)
  // 1080P: 608x1080 (or 1080x1920 for higher quality)
  
  // Using the larger dimensions for better quality
  switch (resolution) {
    case '480P':
      return { width: 480, height: 854 }; // 9:16 ratio
    case '720P':
      return { width: 720, height: 1280 }; // 9:16 ratio
    case '1080P':
      return { width: 1080, height: 1920 }; // 9:16 ratio
    default:
      return { width: 480, height: 854 };
  }
}
