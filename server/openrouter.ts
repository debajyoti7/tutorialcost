import { AnalysisResult, QuotaExceededError } from "./gemini";

export { QuotaExceededError };
export type { AnalysisResult };

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

export async function analyzeContentWithOpenRouter(
  transcript: string,
  title: string,
  userApiKey: string,
): Promise<AnalysisResult> {
  try {
    if (!userApiKey) {
      throw new Error("No OpenRouter API key provided. Please configure your API key.");
    }

    const systemPrompt = `You are an expert AI researcher analyzing content to identify LLM experiments and tools mentioned.

═══ CRITICAL: YOUR ROLE ═══
✓ YOU IDENTIFY tools and experiments (qualitative analysis)
✗ YOU DO NOT CALCULATE costs or estimate dollar amounts
✓ YOU PROVIDE tier names and deployment context
✗ BACKEND SYSTEMS handle all mathematical cost calculations

═══ TASK ═══
Analyze transcripts to find:
1. Concrete LLM experiments (skip theoretical discussions)
2. Tools/platforms actually mentioned or demonstrated

═══ EXPERIMENT FIELDS ═══
{
  "id": "exp1",                    // unique: exp1, exp2, etc.
  "title": "RAG Chatbot",          // clear, specific
  "description": "What it does",   // 1-2 sentences
  "timestamp": "12:34",            // format: "MM:SS" or "unknown"
  "tools": ["tool1", "tool2"],     // array of tool IDs
  "complexity": "Medium",          // Low | Medium | High
  "usagePattern": "production"     // learning | prototype | production | high-volume
}

═══ TOOL FIELDS ═══
{
  "id": "tool1",                         // unique: tool1, tool2, etc.
  "name": "OpenAI",                      // official name
  "category": "LLM API",                 // category type
  "description": "GPT API service",      // 1 sentence
  "mentioned": ["in RAG experiment"],    // context where mentioned
  "suggestedTier": "Free tier",          // tier NAME only (no $)
  "deploymentType": "api-only",          // cloud | self-hosted | hybrid | api-only
  "confidence": "high"                   // high | medium | low
}

═══ TIER NAMING REFERENCE (no dollar amounts) ═══
Suggest tier names by usage pattern:
• learning      → "Free tier", "Self-hosted", "Open source"
• prototype     → "Free tier", "Starter plan"
• production    → "Pro plan", "Standard tier"
• high-volume   → "Enterprise", "Usage-based"

Common tier patterns:
• LLM APIs: Free tier, Paid API
• Vector DBs: Free/Self-hosted, Starter, Pro
• Automation: Self-hosted (free), Cloud Starter, Pro
• Frameworks: Open source, Pro features

═══ EXAMPLES ═══
✓ GOOD: "Built RAG chatbot using OpenAI and ChromaDB"
  → Experiment: id="exp1", title="RAG Chatbot", tools=["openai","chromadb"], usagePattern="prototype"
  → OpenAI: deploymentType="api-only", confidence="high", suggestedTier="Free tier"
  → ChromaDB: deploymentType="self-hosted", confidence="high", suggestedTier="Self-hosted"

✓ GOOD: "Used LangChain with Llama2 for document analysis in production"
  → Experiment: id="exp1", title="Document Analyzer", usagePattern="production"
  → LangChain: deploymentType="hybrid", confidence="high"
  → Llama2: deploymentType="self-hosted", confidence="high"

✗ BAD: "Vector databases are interesting" → Skip (theoretical)
✗ BAD: "You could use GPT-4" → Skip (hypothetical)

═══ VALIDATION RULES ═══
• Every experiment.tools ID must match a tool.id
• Timestamps: "MM:SS" or "unknown" only
• Only include explicitly mentioned tools
• confidence="low" if tool is implied but not clearly stated
• deploymentType must match how the tool is actually used

Return valid JSON matching the schema.`;

    const userPrompt = `Content Title: ${title}

Transcript:
${transcript.slice(0, 15000)} ${transcript.length > 15000 ? "...[truncated]" : ""}

Analyze this content and identify LLM experiments and tools as specified. Return valid JSON.`;

    let rawJson: string;

    try {
      rawJson = await withRetry(
        () => callOpenRouter(DEFAULT_MODEL, systemPrompt, userPrompt, userApiKey),
        { operationName: 'OpenRouter content analysis' }
      );
    } catch (primaryError) {
      console.warn(`Primary model (${DEFAULT_MODEL}) failed, trying fallback model (${FALLBACK_MODEL})...`, primaryError);
      rawJson = await withRetry(
        () => callOpenRouter(FALLBACK_MODEL, systemPrompt, userPrompt, userApiKey),
        { operationName: 'OpenRouter content analysis (fallback)' }
      );
    }

    console.log(`OpenRouter analysis response: ${rawJson?.slice(0, 500)}...`);

    const cleanedJson = rawJson.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
    const data: AnalysisResult = JSON.parse(cleanedJson);
    return data;
  } catch (error) {
    console.error("OpenRouter analysis failed:", error);

    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
    const isQuotaError = error instanceof Error && (
      errorMessage.includes('429') ||
      errorMessage.includes('quota') ||
      errorMessage.includes('resource_exhausted') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests')
    );

    if (isQuotaError) {
      throw new QuotaExceededError('API quota exceeded. Please try again in a few minutes.');
    }

    throw new Error(
      `Failed to analyze content with OpenRouter: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
