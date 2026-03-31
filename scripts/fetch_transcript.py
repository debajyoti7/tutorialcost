#!/usr/bin/env python3
"""Fetch YouTube transcript and output JSON to stdout."""

import sys
import json

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No video ID provided"}))
        sys.exit(1)

    video_id = sys.argv[1]

    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        api = YouTubeTranscriptApi()
        transcript = api.fetch(video_id)

        snippets = [
            {
                "text": snippet.text,
                "start": snippet.start,
                "duration": snippet.duration,
            }
            for snippet in transcript.snippets
        ]

        result = {
            "success": True,
            "snippets": snippets,
            "language": transcript.language_code,
            "is_generated": transcript.is_generated,
        }
        print(json.dumps(result))
    except Exception as e:
        result = {"success": False, "error": str(e)}
        print(json.dumps(result))
        sys.exit(1)

if __name__ == "__main__":
    main()
