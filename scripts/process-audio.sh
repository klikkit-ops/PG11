#!/bin/bash

# Script to process audio files for dance styles
# This script extracts 10 seconds from each audio file and saves them to public/audio/

# Requirements:
# - ffmpeg must be installed: brew install ffmpeg (on macOS) or apt-get install ffmpeg (on Linux)
# - Audio files should be downloaded from Pixabay and placed in a temporary directory

# Usage:
# 1. Download audio files from Pixabay links in public/music.md
# 2. Place them in a directory (e.g., ./temp-audio/)
# 3. Run: ./scripts/process-audio.sh ./temp-audio/

if [ -z "$1" ]; then
    echo "Usage: $0 <input-directory>"
    echo "Example: $0 ./temp-audio/"
    exit 1
fi

INPUT_DIR="$1"
OUTPUT_DIR="public/audio"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed."
    echo "Install it with: brew install ffmpeg (macOS) or apt-get install ffmpeg (Linux)"
    exit 1
fi

# Mapping of input filenames to output filenames
# You'll need to rename the downloaded files to match these, or update the mapping
declare -A FILE_MAPPING=(
    ["macarena"]="macarena-10s.mp3"
    ["salsa"]="salsa-10s.mp3"
    ["hip-hop"]="hip-hop-10s.mp3"
    ["hip_hop"]="hip-hop-10s.mp3"
    ["robot"]="robot-10s.mp3"
    ["ballet"]="ballet-10s.mp3"
    ["disco"]="disco-10s.mp3"
    ["breakdance"]="breakdance-10s.mp3"
    ["waltz"]="waltz-10s.mp3"
    ["tango"]="tango-10s.mp3"
)

# Process each audio file
for input_file in "$INPUT_DIR"/*.{mp3,wav,m4a,ogg}; do
    if [ ! -f "$input_file" ]; then
        continue
    fi

    filename=$(basename "$input_file")
    name_without_ext="${filename%.*}"

    # Try to find matching output name
    output_name="${FILE_MAPPING[$name_without_ext]}"
    
    if [ -z "$output_name" ]; then
        # If no mapping found, try to infer from filename
        output_name="${name_without_ext}-10s.mp3"
        echo "Warning: No mapping found for $filename, using $output_name"
    fi

    output_path="$OUTPUT_DIR/$output_name"

    echo "Processing: $filename -> $output_name"
    
    # Extract first 10 seconds and convert to MP3
    # -t 10: duration of 10 seconds
    # -ss 0: start from beginning (you can change this to start from a different point)
    # -acodec libmp3lame: use MP3 codec
    # -ar 44100: sample rate 44100 Hz
    # -b:a 192k: bitrate 192 kbps
    ffmpeg -i "$input_file" -t 10 -ss 0 -acodec libmp3lame -ar 44100 -b:a 192k -y "$output_path" 2>/dev/null

    if [ $? -eq 0 ]; then
        echo "✓ Successfully created: $output_path"
    else
        echo "✗ Failed to process: $filename"
    fi
done

echo ""
echo "Done! Audio files are in $OUTPUT_DIR/"
echo "Make sure these files are accessible at /audio/<filename> in your Next.js app"

