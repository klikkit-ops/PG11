/**
 * Video watermarking utilities
 * Adds PetGroove logo watermark to generated videos
 */

import sharp from 'sharp';
import { exec } from 'child_process';
import { promisify } from 'util';
import { put } from '@vercel/blob';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { writeFile, unlink } from 'fs/promises';

const execAsync = promisify(exec);

/**
 * Add PetGroove logo watermark to a video
 * Downloads the video, adds watermark in bottom right corner, uploads to Vercel Blob
 */
export async function addWatermarkToVideo(
  videoUrl: string,
  userId: string,
  videoId: string
): Promise<string> {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set');
  }

  // Create temporary file paths
  const tempDir = tmpdir();
  const inputVideoPath = join(tempDir, `input-${videoId}-${Date.now()}.mp4`);
  const outputVideoPath = join(tempDir, `output-${videoId}-${Date.now()}.mp4`);
  const logoPath = join(process.cwd(), 'public', 'logo.png');
  const watermarkPath = join(tempDir, `watermark-${videoId}-${Date.now()}.png`);

  try {
    console.log(`[Watermark] Starting watermark process for video ${videoId}`);
    console.log(`[Watermark] Downloading video from: ${videoUrl.substring(0, 100)}...`);

    // Download the video
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    await writeFile(inputVideoPath, videoBuffer);
    console.log(`[Watermark] Video downloaded, size: ${videoBuffer.length} bytes`);

    // Get video dimensions using ffprobe
    const { stdout: probeOutput } = await execAsync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of json "${inputVideoPath}"`
    );
    const probeData = JSON.parse(probeOutput);
    const videoWidth = probeData.streams[0]?.width || 480;
    const videoHeight = probeData.streams[0]?.height || 854;

    console.log(`[Watermark] Video dimensions: ${videoWidth}x${videoHeight}`);

    // Create watermark: 15% of video width, maintain aspect ratio
    const watermarkWidth = Math.round(videoWidth * 0.15);
    const watermarkImage = await sharp(logoPath)
      .resize(watermarkWidth, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();
    
    // Get actual watermark dimensions after resize
    const watermarkMetadata = await sharp(watermarkImage).metadata();
    const actualWatermarkWidth = watermarkMetadata.width || watermarkWidth;
    const actualWatermarkHeight = watermarkMetadata.height || Math.round(watermarkWidth * 0.5);
    
    await writeFile(watermarkPath, watermarkImage);
    console.log(`[Watermark] Watermark created: ${actualWatermarkWidth}x${actualWatermarkHeight}px`);

    // Calculate position: bottom right with 20px padding
    const padding = 20;
    const x = videoWidth - actualWatermarkWidth - padding;
    const y = videoHeight - actualWatermarkHeight - padding;

    console.log(`[Watermark] Watermark position: x=${x}, y=${y}`);

    // Check if ffmpeg is available
    try {
      await execAsync('ffmpeg -version');
    } catch (error) {
      throw new Error('ffmpeg is not available. Please ensure ffmpeg is installed in the environment.');
    }

    // Add watermark using ffmpeg
    // Using overlay filter to place logo in bottom right corner
    // Scale watermark to exact size, then overlay at calculated position
    const ffmpegCommand = `ffmpeg -i "${inputVideoPath}" -i "${watermarkPath}" -filter_complex "[1:v]scale=${actualWatermarkWidth}:${actualWatermarkHeight}[wm];[0:v][wm]overlay=${x}:${y}" -codec:a copy -y "${outputVideoPath}"`;

    console.log(`[Watermark] Adding watermark with ffmpeg...`);
    const { stderr } = await execAsync(ffmpegCommand);
    if (stderr) {
      console.log(`[Watermark] ffmpeg output: ${stderr.substring(0, 500)}`);
    }
    console.log(`[Watermark] Watermark added successfully`);

    // Read the watermarked video
    const watermarkedVideo = await readFile(outputVideoPath);
    console.log(`[Watermark] Watermarked video size: ${watermarkedVideo.length} bytes`);

    // Upload to Vercel Blob
    const filename = `${userId}/${Date.now()}-watermarked-${videoId}.mp4`;
    const blob = await put(filename, watermarkedVideo, {
      access: 'public',
      token: blobToken,
      contentType: 'video/mp4',
    });

    console.log(`[Watermark] Watermarked video uploaded: ${blob.url}`);

    // Clean up temporary files
    await Promise.all([
      unlink(inputVideoPath).catch(() => {}),
      unlink(outputVideoPath).catch(() => {}),
      unlink(watermarkPath).catch(() => {}),
    ]);

    return blob.url;
  } catch (error) {
    console.error(`[Watermark] Error adding watermark:`, error);
    
    // Clean up temporary files on error
    await Promise.all([
      unlink(inputVideoPath).catch(() => {}),
      unlink(outputVideoPath).catch(() => {}),
      unlink(watermarkPath).catch(() => {}),
    ]);

    throw error;
  }
}

