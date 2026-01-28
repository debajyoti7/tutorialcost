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

const API_KEY_STORAGE_KEY = 'gemini_api_key';

function getStoredApiKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE_KEY);
}

export async function analyzeContent(url: string): Promise<AnalysisResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const apiKey = getStoredApiKey();
  if (apiKey) {
    headers['X-Gemini-Api-Key'] = apiKey;
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