import { YoutubeTranscript } from 'youtube-transcript';

export interface ContentInfo {
  title: string;
  duration: string;
  platform: 'YouTube' | 'Podcast';
  transcript: string;
}

export async function extractYouTubeContent(url: string): Promise<ContentInfo> {
  try {
    console.log('Extracting YouTube content from:', url);
    
    // Get transcript
    const transcriptItems = await YoutubeTranscript.fetchTranscript(url);
    
    if (!transcriptItems || transcriptItems.length === 0) {
      throw new Error('No transcript available for this video');
    }

    // Combine transcript text
    const transcript = transcriptItems
      .map(item => item.text)
      .join(' ')
      .replace(/\[.*?\]/g, '') // Remove timestamp markers
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (transcript.length < 100) {
      throw new Error('Transcript too short to analyze meaningfully');
    }

    // Calculate duration from transcript timestamps
    // Note: youtube-transcript returns offset and duration in seconds, not milliseconds
    const lastItem = transcriptItems[transcriptItems.length - 1];
    const totalSeconds = Math.round(lastItem.offset + (lastItem.duration || 0));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Extract title from URL or use generic title
    const title = await extractVideoTitle(url);

    return {
      title,
      duration,
      platform: 'YouTube',
      transcript
    };
  } catch (error) {
    console.error('YouTube extraction failed:', error);
    throw new Error(`Failed to extract YouTube content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function extractPodcastContent(url: string): Promise<ContentInfo> {
  // Podcast extraction not yet implemented
  // In production, you'd integrate with podcast platforms or RSS parsing
  throw new Error('Podcast content analysis is not yet supported. Please use YouTube video URLs instead. We support all YouTube video formats including educational content, podcasts uploaded to YouTube, and technical discussions.');
}

async function extractVideoTitle(url: string): Promise<string> {
  try {
    // Extract video ID
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    
    if (!videoIdMatch) {
      return "YouTube Video";
    }

    // TODO: Use YouTube Data API to get real title
    // For now, return a generic title
    return "YouTube Video";
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