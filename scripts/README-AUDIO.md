# Audio File Setup Instructions

This guide explains how to download and process audio files for the dance styles.

## Overview

Each dance style has an associated audio file that will be used with the Wan 2.5 API to generate videos with synchronized audio. The audio files should be exactly 10 seconds long.

## Step 1: Download Audio Files from Pixabay

1. Go to each Pixabay link in `public/music.md`
2. Click the download button on each page
3. Download the audio files (they may be in MP3, WAV, or other formats)
4. Save them to a temporary directory (e.g., `./temp-audio/`)

**Note:** Pixabay requires you to be logged in to download files. Make sure you're logged in before downloading.

## Step 2: Organize Downloaded Files

Rename the downloaded files to match the dance style names:
- `macarena.mp3` (or similar)
- `salsa.mp3`
- `hip-hop.mp3` or `hip_hop.mp3`
- `robot.mp3`
- `ballet.mp3`
- `disco.mp3`
- `breakdance.mp3`
- `waltz.mp3`
- `tango.mp3`

Place all files in a single directory (e.g., `./temp-audio/`)

## Step 3: Install FFmpeg

FFmpeg is required to extract 10 seconds from each audio file.

**macOS:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html and add to PATH

## Step 4: Process Audio Files

Run the processing script:

```bash
chmod +x scripts/process-audio.sh
./scripts/process-audio.sh ./temp-audio/
```

This script will:
1. Extract the first 10 seconds from each audio file
2. Convert them to MP3 format (if needed)
3. Save them to `public/audio/` with the correct filenames:
   - `macarena-10s.mp3`
   - `salsa-10s.mp3`
   - `hip-hop-10s.mp3`
   - `robot-10s.mp3`
   - `ballet-10s.mp3`
   - `disco-10s.mp3`
   - `breakdance-10s.mp3`
   - `waltz-10s.mp3`
   - `tango-10s.mp3`

## Step 5: Verify Files

Check that all files are in `public/audio/`:
```bash
ls -lh public/audio/
```

You should see 9 MP3 files, each approximately 10 seconds long.

## Step 6: Test Audio URLs

The audio files should be accessible at:
- `http://localhost:3000/audio/macarena-10s.mp3` (development)
- `https://your-domain.com/audio/macarena-10s.mp3` (production)

## Alternative: Manual Processing

If you prefer to process files manually:

```bash
# Extract 10 seconds from an audio file
ffmpeg -i input.mp3 -t 10 -ss 0 -acodec libmp3lame -ar 44100 -b:a 192k output-10s.mp3
```

Options:
- `-t 10`: Duration of 10 seconds
- `-ss 0`: Start from beginning (change to start from a different point, e.g., `-ss 5` to start at 5 seconds)
- `-acodec libmp3lame`: Use MP3 codec
- `-ar 44100`: Sample rate 44100 Hz
- `-b:a 192k`: Bitrate 192 kbps

## Storage Location

Audio files are stored in `public/audio/` because:
1. They're static assets that don't change
2. Next.js serves files from `public/` at the root URL
3. They're accessible via `/audio/filename.mp3`
4. They can be cached by CDN in production

## Production Considerations

For production, you might want to:
1. Upload audio files to Vercel Blob or another CDN for better performance
2. Update `lib/audio-mapping.ts` to use CDN URLs instead of local paths
3. Ensure files are publicly accessible (required by RunComfy API)

## Troubleshooting

**Script fails with "ffmpeg: command not found"**
- Make sure ffmpeg is installed and in your PATH
- Try running `ffmpeg -version` to verify installation

**Audio files are too long or too short**
- The script extracts exactly 10 seconds from the start
- To extract from a different point, modify the `-ss` parameter in the script

**Files are not accessible in the app**
- Make sure files are in `public/audio/` (not `public/audio/` subdirectories)
- Check that Next.js dev server is running
- Verify file permissions

