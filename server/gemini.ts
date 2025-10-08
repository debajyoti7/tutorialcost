import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AnalysisResult {
  experiments: {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    tools: string[];
    estimatedCostMin: number;
    estimatedCostMax: number;
    complexity: "Low" | "Medium" | "High";
  }[];
  tools: {
    id: string;
    name: string;
    category: string;
    description: string;
    mentioned: string[];
  }[];
  summary: {
    totalExperiments: number;
    totalToolsRequired: number;
    overallCostRangeMin: number;
    overallCostRangeMax: number;
    implementationTimeEstimate: string;
    difficultyLevel: "Low" | "Medium" | "High";
  };
}

export async function analyzeContentForLLMExperiments(
  transcript: string,
  title: string,
): Promise<AnalysisResult> {
  try {
    const systemPrompt = `You are an expert AI researcher who specializes in identifying LLM experiments and automation tools from content.

Your task is to analyze transcripts from podcasts and videos to identify:
1. Specific LLM experiments or AI projects mentioned
2. Tools, platforms, and services discussed
3. Realistic cost RANGES for implementing similar experiments (based on actual 2025 pricing)

For each experiment found, extract:
- Clear title and description
- Timestamp if mentioned
- Required tools/platforms
- Realistic monthly cost range (minimum and maximum) considering different usage levels
- Complexity level (Low/Medium/High)

For each tool mentioned, extract:
- Tool name and category
- Brief description
- Which experiments it's mentioned in

Cost Guidelines (use actual 2025 pricing):
- OpenAI GPT-4o: $0-500/month depending on usage (API: $2.50-10/1M tokens)
- Claude 3.5: $0-800/month (API: $3-15/1M tokens)
- Pinecone: $0-500/month (Free tier, then $50+ minimum)
- LangChain/LangSmith: $0-390/month ($39/user + usage)
- Consider free tiers, basic usage, and scale-up costs

Provide a summary section with overall analysis.

Focus only on concrete, actionable experiments - not theoretical discussions.

Respond with valid JSON in this exact format:
{
  "experiments": [
    {
      "id": "exp1",
      "title": "experiment title",
      "description": "what the experiment does",
      "timestamp": "12:34",
      "tools": ["tool1", "tool2"],
      "estimatedCostMin": 25,
      "estimatedCostMax": 150,
      "complexity": "Medium"
    }
  ],
  "tools": [
    {
      "id": "tool1",
      "name": "Tool Name",
      "category": "Category",
      "description": "what it does",
      "mentioned": ["experiment context"]
    }
  ],
  "summary": {
    "totalExperiments": 1,
    "totalToolsRequired": 2,
    "overallCostRangeMin": 25,
    "overallCostRangeMax": 150,
    "implementationTimeEstimate": "2-4 hours",
    "difficultyLevel": "Medium"
  }
}`;

    const prompt = `Content Title: ${title}

Transcript:
${transcript.slice(0, 15000)} ${transcript.length > 15000 ? "...[truncated]" : ""}

Analyze this content and identify LLM experiments and tools as specified.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", //"gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            experiments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  timestamp: { type: "string" },
                  tools: { type: "array", items: { type: "string" } },
                  estimatedCostMin: { type: "number" },
                  estimatedCostMax: { type: "number" },
                  complexity: { type: "string" },
                },
                required: [
                  "id",
                  "title",
                  "description",
                  "timestamp",
                  "tools",
                  "estimatedCostMin",
                  "estimatedCostMax",
                  "complexity",
                ],
              },
            },
            tools: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  category: { type: "string" },
                  description: { type: "string" },
                  mentioned: { type: "array", items: { type: "string" } },
                },
                required: [
                  "id",
                  "name",
                  "category",
                  "description",
                  "mentioned",
                ],
              },
            },
            summary: {
              type: "object",
              properties: {
                totalExperiments: { type: "number" },
                totalToolsRequired: { type: "number" },
                overallCostRangeMin: { type: "number" },
                overallCostRangeMax: { type: "number" },
                implementationTimeEstimate: { type: "string" },
                difficultyLevel: { type: "string" },
              },
              required: [
                "totalExperiments",
                "totalToolsRequired",
                "overallCostRangeMin",
                "overallCostRangeMax",
                "implementationTimeEstimate",
                "difficultyLevel",
              ],
            },
          },
          required: ["experiments", "tools", "summary"],
        },
      },
      contents: prompt,
    });

    const rawJson = response.text;
    console.log(`Gemini analysis response: ${rawJson?.slice(0, 500)}...`);

    if (rawJson) {
      const data: AnalysisResult = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    throw new Error(
      `Failed to analyze content: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function extractVideoTitle(url: string): Promise<string> {
  try {
    // Extract video ID from various YouTube URL formats
    const videoIdMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    );

    if (!videoIdMatch) {
      return "Unknown Video";
    }

    // For now, return a generic title - in production you'd use YouTube API
    return "Video Content"; // TODO: Integrate with YouTube Data API for real titles
  } catch (error) {
    console.error("Failed to extract video title:", error);
    return "Unknown Video";
  }
}
