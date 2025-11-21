#!/bin/bash

# Script to convert 10-second audio files to 5-second files
# This script takes existing 10-second audio files and trims them to 5 seconds
# Compatible with both bash and zsh

# Requirements:
# - ffmpeg must be installed: brew install ffmpeg (on macOS) or apt-get install ffmpeg (on Linux)
# - Existing 10-second audio files should be in public/audio/ directory

# Usage:
# Run: ./scripts/process-audio.sh
# This will convert all -10s.mp3 files in public/audio/ to -5s.mp3 files

INPUT_DIR="public/audio"
OUTPUT_DIR="public/audio"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed."
    echo "Install it with: brew install ffmpeg (macOS) or apt-get install ffmpeg (Linux)"
    exit 1
fi

# Function to get output filename from 10s input filename
get_output_filename() {
    local input_name="$1"
    
    # Replace -10s with -5s
    echo "${input_name/-10s/-5s}"
}

# Process each 10-second audio file
# Handle both bash and zsh glob patterns
shopt -s nullglob 2>/dev/null || setopt nullglob 2>/dev/null

processed_count=0

# Only process files ending with -10s.mp3
for input_file in "$INPUT_DIR"/*-10s.mp3; do
    # Skip if no files match the pattern
    [ -e "$input_file" ] || continue
    
    if [ ! -f "$input_file" ]; then
        continue
    fi

    filename=$(basename "$input_file")
    
    # Get output filename by replacing -10s with -5s
    output_name=$(get_output_filename "$filename")
    output_path="$OUTPUT_DIR/$output_name"

    # Skip if output file already exists (unless we want to overwrite)
    if [ -f "$output_path" ]; then
        echo "⚠ Skipping $filename (output already exists: $output_name)"
        continue
    fi

    echo "Processing: $filename -> $output_name"
    
    # Extract first 5 seconds from the 10-second file
    # -t 5: duration of 5 seconds (matches video duration)
    # -ss 0: start from beginning
    # -acodec libmp3lame: use MP3 codec
    # -ar 44100: sample rate 44100 Hz
    # -b:a 192k: bitrate 192 kbps
    # -y: overwrite output file if it exists
    if ffmpeg -i "$input_file" -t 5 -ss 0 -acodec libmp3lame -ar 44100 -b:a 192k -y "$output_path" 2>/dev/null; then
        echo "✓ Successfully created: $output_path"
        processed_count=$((processed_count + 1))
    else
        echo "✗ Failed to process: $filename"
    fi
done

echo ""
if [ $processed_count -gt 0 ]; then
    echo "Done! Converted $processed_count audio file(s) from 10s to 5s in $OUTPUT_DIR/"
    echo "Files are accessible at /audio/<filename> in your Next.js app"
    echo ""
    echo "Note: Original 10-second files are still in $INPUT_DIR/"
    echo "You can delete them if you no longer need them."
else
    echo "No 10-second audio files found in $INPUT_DIR/"
    echo "Looking for files matching pattern: *-10s.mp3"
fi
