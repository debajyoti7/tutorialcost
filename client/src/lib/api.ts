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
    estimatedCost: number;
    complexity: 'Low' | 'Medium' | 'High';
  }[];
  tools: {
    id: string;
    name: string;
    category: string;
    description: string;
    pricing: {
      free: boolean;
      monthly?: number;
      usage?: string;
      features: string[];
    };
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    timeToImplement: string;
    url: string;
    mentioned: string[];
  }[];
  totalEstimatedCost: number;
  processingTime: number;
}

export interface ApiError {
  error: string;
  processingTime?: number;
}

export async function analyzeContent(url: string): Promise<AnalysisResponse> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.error || 'Analysis failed');
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
  totalEstimatedCost: number;
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