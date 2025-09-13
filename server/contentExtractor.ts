import { YoutubeTranscript } from 'youtube-transcript';
import fetch from 'node-fetch';

export interface ContentInfo {
  title: string;
  duration: string;
  platform: 'YouTube' | 'Podcast';
  transcript: string;
  description?: string;
  hasTranscript: boolean;
  hasDescription: boolean;
}

export async function extractYouTubeContent(url: string): Promise<ContentInfo> {
  try {
    console.log('Extracting YouTube content from:', url);
    
    // Try to get both transcript and description
    let transcriptItems;
    let hasTranscript = false;
    let videoTitle = "YouTube Video";
    let videoDescription = "";
    let hasDescription = false;
    
    // First, try to get video metadata (title and description)
    try {
      const metadata = await extractVideoMetadata(url);
      videoTitle = metadata.title;
      videoDescription = metadata.description;
      hasDescription = videoDescription.length > 50; // Consider meaningful if > 50 chars
      console.log(`Extracted metadata: title="${videoTitle}", description length=${videoDescription.length}`);
    } catch (metadataError) {
      console.log('Failed to extract video metadata:', metadataError);
    }
    
    // Then try to get transcript with error handling
    try {
      transcriptItems = await YoutubeTranscript.fetchTranscript(url);
      hasTranscript = true;
      console.log('Successfully extracted transcript');
    } catch (transcriptError) {
      console.log('Initial transcript fetch failed, trying with different options:', transcriptError);
      
      // Try different language configurations if the first attempt fails
      try {
        transcriptItems = await YoutubeTranscript.fetchTranscript(url, {
          lang: 'en'
        });
        hasTranscript = true;
        console.log('Successfully extracted English transcript');
      } catch (secondError) {
        console.log('English transcript not available, trying any available language:', secondError);
        
        // Last attempt: try to get any transcript regardless of language
        try {
          const videoId = extractVideoId(url);
          if (videoId) {
            transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
            hasTranscript = true;
            console.log('Successfully extracted transcript with video ID');
          }
        } catch (finalError) {
          console.log('All transcript attempts failed:', finalError);
          // Don't throw error yet - we might have description
        }
      }
    }
    
    // Check if we have either transcript or meaningful description
    if ((!transcriptItems || transcriptItems.length === 0) && !hasDescription) {
      throw new Error('No transcript or meaningful description available for this video');
    }

    // Combine available content
    let transcript = "";
    let duration = "0:00";
    
    if (hasTranscript && transcriptItems && transcriptItems.length > 0) {
      // Process transcript
      transcript = transcriptItems
        .map(item => item.text)
        .join(' ')
        .replace(/\[.*?\]/g, '') // Remove timestamp markers
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      // Calculate duration from transcript timestamps
      const lastItem = transcriptItems[transcriptItems.length - 1];
      const totalSeconds = Math.round(lastItem.offset + (lastItem.duration || 0));
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // If we only have description, use it as the main content for analysis
    if (!hasTranscript && hasDescription) {
      transcript = `Video Description: ${videoDescription}`;
      console.log('Using video description as primary content for analysis');
    }
    
    // If we have both, combine them for richer analysis
    if (hasTranscript && hasDescription) {
      transcript = `${transcript}\n\nVideo Description: ${videoDescription}`;
      console.log('Combining transcript and description for enhanced analysis');
    }

    if (transcript.length < 50) {
      throw new Error('Content too short to analyze meaningfully');
    }

    return {
      title: videoTitle,
      duration,
      platform: 'YouTube',
      transcript,
      description: videoDescription,
      hasTranscript,
      hasDescription
    };
  } catch (error) {
    console.error('YouTube extraction failed:', error);
    
    if (error instanceof Error && (
      error.message.includes('No transcript or meaningful description available') ||
      error.message.includes('No transcript available') ||
      error.message.includes('Transcript is disabled') ||
      error.message.includes('transcript could not be retrieved')
    )) {
      throw new Error('This YouTube video doesn\'t have a transcript or sufficient description available for analysis. Please try a different video. Videos with transcripts or detailed descriptions work best - these are usually educational content, tutorials, tech talks, or videos with auto-generated captions enabled.');
    }
    
    throw new Error(`Failed to extract YouTube content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function extractPodcastContent(url: string): Promise<ContentInfo> {
  // Podcast extraction not yet implemented
  // In production, you'd integrate with podcast platforms or RSS parsing
  throw new Error('Podcast content analysis is not yet supported. Please use YouTube video URLs instead. We support all YouTube video formats including educational content, podcasts uploaded to YouTube, and technical discussions.');
}

function extractVideoId(url: string): string | null {
  const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return videoIdMatch ? videoIdMatch[1] : null;
}

async function extractVideoMetadata(url: string): Promise<{ title: string; description: string }> {
  try {
    console.log('Fetching video metadata from:', url);
    
    // Fetch the YouTube page HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch video page: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract title from meta tags or page title
    let title = "YouTube Video";
    const titleMatch = html.match(/<meta property="og:title" content="([^"]*)"/) || 
                      html.match(/<title>([^<]*)<\/title>/);
    
    if (titleMatch) {
      title = titleMatch[1]
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/ - YouTube$/, '') // Remove " - YouTube" suffix
        .trim();
    }
    
    // Extract description from meta tags
    let description = "";
    const descriptionMatch = html.match(/<meta property="og:description" content="([^"]*)"/) ||
                           html.match(/<meta name="description" content="([^"]*)">/);
    
    if (descriptionMatch) {
      description = descriptionMatch[1]
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
    }
    
    // Try to extract more detailed description from JSON-LD data
    const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        if (jsonLd.description && jsonLd.description.length > description.length) {
          description = jsonLd.description;
        }
      } catch (jsonError) {
        console.log('Failed to parse JSON-LD data for description');
      }
    }
    
    console.log(`Extracted: title="${title}", description length=${description.length}`);
    
    return {
      title: title || "YouTube Video",
      description: description || ""
    };
    
  } catch (error) {
    console.error('Failed to extract video metadata:', error);
    throw new Error(`Unable to fetch video metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function extractVideoTitle(url: string): Promise<string> {
  try {
    const videoId = extractVideoId(url);
    
    if (!videoId) {
      return "YouTube Video";
    }

    // TODO: Use YouTube Data API to get real title
    // For now, return a generic title with video ID for debugging
    return `YouTube Video (${videoId})`;
  } catch (error) {
    console.error('Failed to extract video title:', error);
    return "YouTube Video";
  }
}

export function detectPlatform(url: string): 'YouTube' | 'Podcast' | 'Unknown' {
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'YouTube';
  }
  
  if (lowerUrl.includes('spotify.com') || 
      lowerUrl.includes('apple.com') || 
      lowerUrl.includes('overcast.fm') ||
      lowerUrl.includes('.mp3') ||
      lowerUrl.includes('podcast')) {
    return 'Podcast';
  }
  
  return 'Unknown';
}

export function validateUrl(url: string): { isValid: boolean; error?: string } {
  try {
    const urlObj = new URL(url);
    const platform = detectPlatform(url);
    
    if (platform === 'Unknown') {
      return {
        isValid: false,
        error: 'URL must be from YouTube or a supported podcast platform'
      };
    }
    
    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: 'Please enter a valid URL'
    };
  }
}