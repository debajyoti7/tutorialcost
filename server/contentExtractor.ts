import fetch from 'node-fetch';
import { google } from 'googleapis';
import { 
  createTranscriptDisabledError, 
  createInvalidUrlError, 
  createEmptyContentError, 
  createUnsupportedPlatformError,
  createNetworkError 
} from './errors';

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
    
    // First, get video metadata using YouTube Data API
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw createInvalidUrlError('YouTube');
    }

    try {
      const metadata = await extractVideoMetadataWithAPI(videoId);
      videoTitle = metadata.title;
      videoDescription = metadata.description;
      hasDescription = videoDescription.length > 50; // Consider meaningful if > 50 chars
      
      // Check if captions are available via API
      const hasCaptions = metadata.hasCaptions;
      console.log(`API metadata: title="${videoTitle}", description length=${videoDescription.length}, captions available: ${hasCaptions}`);
    } catch (metadataError) {
      console.log('YouTube API metadata fetch failed, falling back to HTML scraping:', metadataError);
      
      // Fallback to HTML scraping if API fails
      try {
        const metadata = await extractVideoMetadata(url);
        videoTitle = metadata.title;
        videoDescription = metadata.description;
        hasDescription = videoDescription.length > 50;
        console.log(`HTML metadata: title="${videoTitle}", description length=${videoDescription.length}`);
      } catch (fallbackError) {
        console.log('Both API and HTML metadata extraction failed:', fallbackError);
      }
    }
    
    // Then try to get transcript using custom direct fetch
    try {
      transcriptItems = await fetchYouTubeTranscriptDirect(videoId);
      hasTranscript = transcriptItems.length > 0;
      if (hasTranscript) {
        console.log('Successfully extracted transcript with direct fetch');
      }
    } catch (transcriptError) {
      console.log('Transcript fetch failed:', transcriptError);
      // Don't throw error yet - we might have description
    }
    
    // Check if we have either transcript or meaningful description
    if ((!transcriptItems || transcriptItems.length === 0) && !hasDescription) {
      throw createTranscriptDisabledError();
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
      throw createEmptyContentError();
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
      throw createTranscriptDisabledError();
    }
    
    throw createNetworkError(error instanceof Error ? error : undefined);
  }
}

export async function extractPodcastContent(url: string): Promise<ContentInfo> {
  // Podcast extraction not yet implemented
  // In production, you'd integrate with podcast platforms or RSS parsing
  throw createUnsupportedPlatformError();
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

async function extractVideoMetadataWithAPI(videoId: string): Promise<{ title: string; description: string; duration: string; hasCaptions: boolean }> {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      throw new Error('YOUTUBE_API_KEY not configured');
    }

    const youtube = google.youtube({
      version: 'v3',
      auth: apiKey
    });

    // Fetch video details
    const videoResponse = await youtube.videos.list({
      part: ['snippet', 'contentDetails'],
      id: [videoId]
    });

    if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
      throw new Error('Video not found');
    }

    const video = videoResponse.data.items[0];
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;

    // Fetch caption tracks to check availability
    let hasCaptions = false;
    try {
      const captionsResponse = await youtube.captions.list({
        part: ['snippet'],
        videoId: videoId
      });
      
      hasCaptions = (captionsResponse.data.items && captionsResponse.data.items.length > 0) || false;
      console.log(`Captions check: ${hasCaptions ? 'available' : 'not available'}`);
    } catch (captionError) {
      // Captions API might not be accessible, but continue
      console.log('Could not check captions availability:', captionError);
    }

    // Parse duration from ISO 8601 format (PT1H2M10S)
    let duration = '0:00';
    if (contentDetails?.duration) {
      duration = parseDuration(contentDetails.duration);
    }

    return {
      title: snippet?.title || 'YouTube Video',
      description: snippet?.description || '',
      duration,
      hasCaptions
    };
  } catch (error) {
    console.error('YouTube API metadata extraction failed:', error);
    throw error;
  }
}

function parseDuration(isoDuration: string): string {
  // Parse ISO 8601 duration format (PT1H2M10S) to MM:SS or H:MM:SS
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  
  if (!match) return '0:00';
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

interface TranscriptItem {
  text: string;
  offset: number;
  duration: number;
}

async function fetchYouTubeTranscriptDirect(videoId: string): Promise<TranscriptItem[]> {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ];
  
  const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  
  // Fetch the YouTube watch page to extract caption data
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  const response = await fetch(watchUrl, {
    headers: {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0',
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch YouTube page: ${response.status}`);
  }
  
  const html = await response.text();
  
  // Extract captionTracks from the page's ytInitialPlayerResponse
  const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});(?:var|<\/script>|\n)/);
  
  if (!playerResponseMatch) {
    throw new Error('Could not find player response in page');
  }
  
  let playerResponse;
  try {
    playerResponse = JSON.parse(playerResponseMatch[1]);
  } catch (e) {
    throw new Error('Failed to parse player response');
  }
  
  const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  
  if (!captions || captions.length === 0) {
    throw new Error('No captions available for this video');
  }
  
  // Prefer English captions, then auto-generated English, then first available
  let captionTrack = captions.find((t: any) => t.languageCode === 'en' && !t.kind);
  if (!captionTrack) {
    captionTrack = captions.find((t: any) => t.languageCode === 'en');
  }
  if (!captionTrack) {
    captionTrack = captions[0];
  }
  
  const captionUrl = captionTrack.baseUrl;
  
  if (!captionUrl) {
    throw new Error('No caption URL found');
  }
  
  // Fetch the caption XML
  const captionResponse = await fetch(captionUrl, {
    headers: {
      'User-Agent': userAgent,
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
    }
  });
  
  if (!captionResponse.ok) {
    throw new Error(`Failed to fetch captions: ${captionResponse.status}`);
  }
  
  const captionXml = await captionResponse.text();
  
  // Parse the XML transcript
  const transcriptItems: TranscriptItem[] = [];
  const textRegex = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([^<]*)<\/text>/g;
  let match;
  
  while ((match = textRegex.exec(captionXml)) !== null) {
    const start = parseFloat(match[1]);
    const dur = parseFloat(match[2]);
    let text = match[3]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n/g, ' ')
      .trim();
    
    if (text) {
      transcriptItems.push({
        text,
        offset: start,
        duration: dur
      });
    }
  }
  
  if (transcriptItems.length === 0) {
    throw new Error('Could not parse transcript from captions');
  }
  
  console.log(`Fetched ${transcriptItems.length} transcript segments directly from YouTube`);
  
  return transcriptItems;
}