export type ErrorType = 
  | 'transcript-disabled'
  | 'no-experiments'
  | 'api-error'
  | 'network-error'
  | 'invalid-url'
  | 'empty-content'
  | 'unsupported-platform'
  | 'gemini-error'
  | 'generic';

export class AnalysisError extends Error {
  type: ErrorType;
  statusCode: number;
  details?: string;

  constructor(type: ErrorType, message: string, statusCode: number = 400, details?: string) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AnalysisError';
  }
}

export function createTranscriptDisabledError(): AnalysisError {
  return new AnalysisError(
    'transcript-disabled',
    'This YouTube video doesn\'t have a transcript available for analysis.',
    400,
    'Please try a video with captions/transcripts enabled. Educational content and tutorials usually have transcripts.'
  );
}

export function createNoExperimentsError(): AnalysisError {
  return new AnalysisError(
    'no-experiments',
    'No LLM experiments or AI tools were detected in this content.',
    200,
    'This tool works best with AI tutorials, automation workflows, and LLM implementation demos.'
  );
}

export function createInvalidUrlError(platform?: string): AnalysisError {
  return new AnalysisError(
    'invalid-url',
    platform 
      ? `Invalid ${platform} URL format.`
      : 'Invalid URL - could not parse video identifier.',
    400,
    'Make sure you\'re using a valid YouTube video URL (youtube.com or youtu.be)'
  );
}

export function createEmptyContentError(): AnalysisError {
  return new AnalysisError(
    'empty-content',
    'The video content is too short or empty to analyze.',
    400,
    'Try videos that are at least 5 minutes long with substantial spoken content.'
  );
}

export function createUnsupportedPlatformError(): AnalysisError {
  return new AnalysisError(
    'unsupported-platform',
    'Podcast content analysis is not yet supported.',
    400,
    'Please use YouTube video URLs. We support all YouTube formats including podcasts uploaded to YouTube.'
  );
}

export function createGeminiError(originalError?: Error): AnalysisError {
  return new AnalysisError(
    'gemini-error',
    'The AI analysis service encountered an error.',
    500,
    originalError?.message || 'This is usually temporary. Try again in a moment or use a shorter video.'
  );
}

export function createNetworkError(originalError?: Error): AnalysisError {
  return new AnalysisError(
    'network-error',
    'Unable to connect to external services.',
    503,
    originalError?.message || 'Check your connection and try again.'
  );
}
