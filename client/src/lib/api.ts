export interface AnalysisRequest {
  url: string;
}

export interface AnalysisResponse {
  id: string;
  contentInfo: {
    title: string;
    duration: string;
    platform: 'YouTube' | 'Podcast';
    url: string;
    transcriptSource?: 'youtube' | 'ai-generated' | 'description-only' | string;
  };
  experiments: {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    tools: string[];
    estimatedCostMin: number;
    estimatedCostMax: number;
    complexity: 'Low' | 'Medium' | 'High';
  }[];
  tools: {
    id: string;
    name: string;
    category: string;
    description: string;
    pricing: {
      free: boolean;
      monthlyMin?: number;
      monthlyMax?: number;
      usage?: string;
      features: string[];
      priceType?: 'fixed' | 'usage-based' | 'per-token' | 'free';
      tierName?: string;
      pricingSource?: 'database' | 'ai-estimated';
      allTiers?: {
        tier: string;
        monthlyMin: number;
        monthlyMax?: number;
        priceType: string;
        usage?: string;
      }[];
    };
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    timeToImplement: string;
    url: string;
    mentioned: string[];
    suggestedContext?: string;
  }[];
  summary: {
    totalExperiments: number;
    totalToolsRequired: number;
    toolSubscriptionCostMin: number;
    toolSubscriptionCostMax: number;
    infrastructureCostMin: number;
    infrastructureCostMax: number;
    infrastructureBreakdown: Array<{
      toolName: string;
      component: string;
      description: string;
      costMin: number;
      costMax: number;
    }>;
    totalCostMin: number;
    totalCostMax: number;
    implementationTimeEstimate: string;
    difficultyLevel: 'Low' | 'Medium' | 'High';
    costClassification?: 'Free' | 'Low' | 'Medium' | 'High';
    costClassificationLabel?: string;
  };
  processingTime: number;
}

export interface ApiError {
  error?: string;
  type?: string;
  message?: string;
  details?: string;
  processingTime?: number;
}

export class AnalysisError extends Error {
  type: string;
  details?: string;

  constructor(type: string, message: string, details?: string) {
    super(message);
    this.type = type;
    this.details = details;
  }
}

const GEMINI_KEY_STORAGE = 'gemini_api_key';
const OPENROUTER_KEY_STORAGE = 'openrouter_api_key';
const PROVIDER_STORAGE = 'ai_provider';

type AiProvider = 'gemini' | 'openrouter';

function getStoredProvider(): AiProvider {
  const stored = localStorage.getItem(PROVIDER_STORAGE);
  return (stored === 'openrouter') ? 'openrouter' : 'gemini';
}

function getStoredApiKey(): string | null {
  const provider = getStoredProvider();
  if (provider === 'openrouter') {
    return localStorage.getItem(OPENROUTER_KEY_STORAGE);
  }
  return localStorage.getItem(GEMINI_KEY_STORAGE);
}

export async function analyzeContent(url: string): Promise<AnalysisResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const provider = getStoredProvider();
  const apiKey = getStoredApiKey();

  if (provider === 'openrouter' && apiKey) {
    headers['X-OpenRouter-Api-Key'] = apiKey;
    headers['X-AI-Provider'] = 'openrouter';
  } else if (provider === 'gemini' && apiKey) {
    headers['X-Gemini-Api-Key'] = apiKey;
  } else if (provider === 'openrouter') {
    headers['X-AI-Provider'] = 'openrouter';
  }

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new AnalysisError(
      errorData.type || 'unknown_error',
      errorData.message || errorData.error || 'Analysis failed',
      errorData.details
    );
  }

  return response.json();
}

// SSE streaming event types
export type StreamStep =
  | { step: 'transcription'; source: string; wordCount: number; transcript: string }
  | { step: 'experiments'; experiments: AnalysisResponse['experiments'] }
  | { step: 'tools'; tools: AnalysisResponse['tools'] }
  | { step: 'costs'; experiments: AnalysisResponse['experiments']; tools: AnalysisResponse['tools'] }
  | { step: 'summary'; summary: AnalysisResponse['summary']; id: string; contentInfo: AnalysisResponse['contentInfo'] }
  | { step: 'done' }
  | { step: 'error'; message: string };

export interface StreamingCallbacks {
  onStep: (event: StreamStep) => void;
  onError: (message: string) => void;
  onDone: () => void;
}

export function analyzeContentStreaming(url: string, callbacks: StreamingCallbacks): () => void {
  const provider = getStoredProvider();
  const apiKey = getStoredApiKey();

  const params = new URLSearchParams({ url, provider });
  if (apiKey) params.set('apiKey', apiKey);

  const streamUrl = `/api/analyze/stream?${params.toString()}`;
  const eventSource = new EventSource(streamUrl, { withCredentials: true });

  eventSource.onmessage = (event) => {
    try {
      const data: StreamStep = JSON.parse(event.data);

      if (data.step === 'error') {
        eventSource.close();
        callbacks.onError((data as any).message || 'Unknown error');
        return;
      }

      if (data.step === 'done') {
        eventSource.close();
        callbacks.onDone();
        return;
      }

      callbacks.onStep(data);
    } catch {
      // Ignore malformed events
    }
  };

  eventSource.onerror = () => {
    eventSource.close();
    callbacks.onError('Connection lost. Please try again.');
  };

  return () => eventSource.close();
}

export async function getAnalyses(): Promise<{
  id: string;
  title: string;
  platform: string;
  url: string;
  experimentsCount: number;
  toolsCount: number;
  summary: {
    overallCostRangeMin: number;
    overallCostRangeMax: number;
  };
  createdAt: string;
}[]> {
  const response = await fetch('/api/analyses');

  if (!response.ok) {
    throw new Error('Failed to fetch analyses');
  }

  return response.json();
}

export async function getAnalysis(id: string): Promise<AnalysisResponse> {
  const response = await fetch(`/api/analyses/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch analysis');
  }

  return response.json();
}
