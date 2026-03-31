#!/usr/bin/env python3
"""Fetch YouTube transcript"""

from youtube_transcript_api import YouTubeTranscriptApi

def get_video_id(url):
    """Extract video ID from YouTube URL"""
    if 'v=' in url:
        return url.split('v=')[1].split('&')[0]
    elif 'youtu.be/' in url:
        return url.split('youtu.be/')[1].split('?')[0]
    else:
        return url

def format_time(seconds):
    """Convert seconds to HH:MM:SS format"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"

# Video URL
video_url = "https://www.youtube.com/watch?v=1em64iUFt3U"
video_id = get_video_id(video_url)

# Initialize API and fetch transcript
api = YouTubeTranscriptApi()
transcript = api.fetch(video_id)

# Print metadata
print(f"Video ID: {transcript.video_id}")
print(f"Language: {transcript.language} ({transcript.language_code})")
print(f"Auto-generated: {transcript.is_generated}")
print(f"\n{'='*80}\n")

# Print transcript with timestamps
for snippet in transcript.snippets:
    timestamp = format_time(snippet.start)
    text = snippet.text.strip()
    print(f"[{timestamp}] {text}")
