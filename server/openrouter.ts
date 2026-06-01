import { AnalysisResult, QuotaExceededError, LearningRef, ExperimentsResult, ToolsResult } from "./gemini";

export { QuotaExceededError };
export type { AnalysisResult, ExperimentsResult, ToolsResult };

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.5-flash-preview-05-20:free";
const FALLBACK_MODEL = "google/gemini-2.0-flash-exp:free";

async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelayMs?: number; operationName?: string } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, operationName = 'API call' } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      const isRateLimitError = error instanceof Error && (
        errorMessage.includes('429') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('resource_exhausted') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('too many requests')
      );

      if (!isRateLimitError || attempt === maxRetries) {
        throw error;
      }

      const delayMs = baseDelayMs * Math.pow(2, attempt);
      console.log(`${operationName} hit rate limit (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(`${operationName} failed after ${maxRetries + 1} attempts`);
}

async function callOpenRouter(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
): Promise<string> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://tutorial-cost.replit.app",
      "X-Title": "Tutorial Cost Analyzer",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    if (response.status === 429) {
      throw new Error(`429 Too Many Requests: ${errorBody}`);
    }
    throw new Error(`OpenRouter API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`OpenRouter error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenRouter");
  }

  return content;
}

export async function identifyExperimentsWithOpenRouter(
  transcript: string,
  title: string,
  userApiKey: string,
  learnings?: LearningRef[],
): Promise<ExperimentsResult> {
  const learningIdsUsed: string[] = [];
  let systemPrompt = `You are an expert AI researcher analyzing content to identify LLM experiments and tools mentioned.
Identify only concrete LLM experiments from the transcript (skip theoretical discussions).
Return valid JSON with an "experiments" array where each item has: id, title, description, timestamp (MM:SS or "unknown"), tools (array of tool IDs), complexity (Low/Medium/High), usagePattern (learning/prototype/production/high-volume).`;

  if (learnings && learnings.length > 0) {
    systemPrompt += `\n\nLEARNED CORRECTIONS FROM USER FEEDBACK:\n`;
    for (const l of learnings) {
      systemPrompt += `• ${l.insight}\n`;
      learningIdsUsed.push(l.id);
    }
  }

  const userPrompt = `Content Title: ${title}\n\nTranscript:\n${transcript.slice(0, 15000)} ${transcript.length > 15000 ? "...[truncated]" : ""}\n\nReturn JSON with "experiments" array only.`;

  const rawJson = await withRetry(
    () => callOpenRouter(DEFAULT_MODEL, systemPrompt, userPrompt, userApiKey),
    { operationName: 'OpenRouter identify experiments' }
  );

  const cleaned = rawJson.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
  const data = JSON.parse(cleaned);
  return { experiments: data.experiments || [], learningIdsUsed };
}

export async function identifyToolsWithOpenRouter(
  transcript: string,
  experiments: AnalysisResult['experiments'],
  userApiKey: string,
): Promise<ToolsResult> {
  const experimentContext = experiments.map(e => `- ${e.title}: ${e.description}`).join('\n');
  const systemPrompt = `You are an expert AI researcher. Identify all tools required for these experiments from the transcript.
Return JSON with a "tools" array where each item has: id, name, category, description, mentioned (array), suggestedTier (tier name only, no $), deploymentType (cloud/self-hosted/hybrid/api-only), confidence (high/medium/low).`;

  const userPrompt = `Transcript:\n${transcript.slice(0, 15000)} ${transcript.length > 15000 ? "...[truncated]" : ""}\n\nExperiments:\n${experimentContext}\n\nReturn JSON with "tools" array only.`;

  const rawJson = await withRetry(
    () => callOpenRouter(DEFAULT_MODEL, systemPrompt, userPrompt, userApiKey),
    { operationName: 'OpenRouter identify tools' }
  );

  const cleaned = rawJson.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
  const data = JSON.parse(cleaned);
  return { tools: data.tools || [] };
}

export async function analyzeContentWithOpenRouter(
  transcript: string,
  title: string,
  userApiKey: string,
  learnings?: LearningRef[],
): Promise<AnalysisResult & { learningIdsUsed: string[] }> {
  if (!userApiKey) {
    throw new Error("No OpenRouter API key provided. Please configure your API key.");
  }

  try {
    const expResult = await identifyExperimentsWithOpenRouter(transcript, title, userApiKey, learnings);
    const toolsResult = await identifyToolsWithOpenRouter(transcript, expResult.experiments, userApiKey);
    return {
      experiments: expResult.experiments,
      tools: toolsResult.tools,
      learningIdsUsed: expResult.learningIdsUsed,
    } as AnalysisResult & { learningIdsUsed: string[] };
  } catch (error) {
    console.error("OpenRouter analysis failed:", error);

    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
    const isQuotaError =
      errorMessage.includes('429') ||
      errorMessage.includes('quota') ||
      errorMessage.includes('resource_exhausted') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests');

    if (isQuotaError) {
      throw new QuotaExceededError('API quota exceeded. Please try again in a few minutes.');
    }

    throw new Error(
      `Failed to analyze content with OpenRouter: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
