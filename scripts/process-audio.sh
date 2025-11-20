#!/bin/bash

# Script to process audio files for dance styles
# This script extracts 10 seconds from each audio file and saves them to public/audio/
# Compatible with both bash and zsh

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

# Function to get output filename based on input filename
get_output_filename() {
    local input_name="$1"
    local lower_name=$(echo "$input_name" | tr '[:upper:]' '[:lower:]')
    
    # Remove common prefixes/suffixes and normalize
    lower_name=$(echo "$lower_name" | sed 's/^[^a-z]*//;s/[^a-z]*$//')
    
    # Map various filename patterns to output names
    case "$lower_name" in
        *macarena*)
            echo "macarena-10s.mp3"
            ;;
        *salsa*)
            echo "salsa-10s.mp3"
            ;;
        *hip*hop*|*hiphop*)
            echo "hip-hop-10s.mp3"
            ;;
        *robot*)
            echo "robot-10s.mp3"
            ;;
        *ballet*)
            echo "ballet-10s.mp3"
            ;;
        *disco*)
            echo "disco-10s.mp3"
            ;;
        *breakdance*|*break*dance*)
            echo "breakdance-10s.mp3"
            ;;
        *waltz*)
            echo "waltz-10s.mp3"
            ;;
        *tango*)
            echo "tango-10s.mp3"
            ;;
        *)
            # Default: use input name with -10s suffix
            echo "${lower_name}-10s.mp3"
            ;;
    esac
}

# Process each audio file
# Handle both bash and zsh glob patterns
shopt -s nullglob 2>/dev/null || setopt nullglob 2>/dev/null

processed_count=0

for input_file in "$INPUT_DIR"/*.mp3 "$INPUT_DIR"/*.wav "$INPUT_DIR"/*.m4a "$INPUT_DIR"/*.ogg; do
    # Skip if no files match the pattern
    [ -e "$input_file" ] || continue
    
    if [ ! -f "$input_file" ]; then
        continue
    fi

    filename=$(basename "$input_file")
    name_without_ext="${filename%.*}"
    
    # Get output filename based on input filename
    output_name=$(get_output_filename "$name_without_ext")
    output_path="$OUTPUT_DIR/$output_name"

    echo "Processing: $filename -> $output_name"
    
    # Extract first 10 seconds and convert to MP3
    # -t 10: duration of 10 seconds
    # -ss 0: start from beginning (you can change this to start from a different point)
    # -acodec libmp3lame: use MP3 codec
    # -ar 44100: sample rate 44100 Hz
    # -b:a 192k: bitrate 192 kbps
    # -y: overwrite output file if it exists
    if ffmpeg -i "$input_file" -t 10 -ss 0 -acodec libmp3lame -ar 44100 -b:a 192k -y "$output_path" 2>/dev/null; then
        echo "✓ Successfully created: $output_path"
        processed_count=$((processed_count + 1))
    else
        echo "✗ Failed to process: $filename"
    fi
done

echo ""
if [ $processed_count -gt 0 ]; then
    echo "Done! Processed $processed_count audio file(s) in $OUTPUT_DIR/"
    echo "Files are accessible at /audio/<filename> in your Next.js app"
else
    echo "No audio files were processed. Check that files exist in $INPUT_DIR/"
fi
